#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grok Build 中文操作台：本地网页 + ACP 桥接到 grok agent。只监听 127.0.0.1。"""

from __future__ import annotations

import argparse
import base64
import json
import os
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
import webbrowser
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlencode, urlparse, urlunparse

HOME = Path.home()
GROK_HOME = Path(os.environ.get("GROK_HOME", HOME / ".grok"))
# 测试版可显式指定页面目录；正式打包版仍使用 ~/.grok/webui。
if os.environ.get("GROK_WEBUI_DIR"):
    WEBUI_DIR = Path(os.environ["GROK_WEBUI_DIR"])
elif getattr(sys, "frozen", False):
    WEBUI_DIR = GROK_HOME / "webui"
else:
    WEBUI_DIR = Path(__file__).resolve().parent
STATIC_DIR = WEBUI_DIR / "static"
STATE_DIR = Path(os.environ.get("GROK_WEBUI_STATE_DIR") or WEBUI_DIR)
STATE_PATH = STATE_DIR / "state.json"
MARKET_SOURCES_PATH = GROK_HOME / "market-sources.json"
# 某些桌面宿主会限制进程直接写入用户目录，页面目录可作为同用户配置回退位置。
MARKET_SOURCES_FALLBACK_PATH = STATE_DIR / "market-sources.json"
CONFIG_PATH = GROK_HOME / "config.toml"
LANGUAGE_RULES = {
    "zh-CN": "始终使用简体中文回复用户。提到设置、按钮或斜杠命令时，保留其原文并用中文解释。",
    "zh-TW": "預設使用繁體中文（台灣）回覆使用者。提到設定、按鈕或斜線命令時，保留原文並以繁體中文解釋。",
    "zh-TW-TW": "預設使用繁體中文（台灣）回覆使用者。提到設定、按鈕或斜線命令時，保留原文並以繁體中文解釋。",
    "zh-HK": "預設使用繁體中文（香港）回覆使用者。提到設定、按鈕或斜線命令時，保留原文並以繁體中文解釋。",
    "en": "Reply in English by default. Preserve the exact names of settings, buttons, and slash commands when referring to them.",
    "ja": "原則として日本語で回答してください。設定、ボタン、スラッシュコマンドに言及する場合は、元の表記を保って説明してください。",
    "de": "Antworte standardmäßig auf Deutsch. Bewahre bei Einstellungen, Schaltflächen und Slash-Befehlen deren genaue Originalbezeichnungen.",
    "fr": "Répondez par défaut en français. Conservez le libellé exact des paramètres, boutons et commandes slash lorsque vous les mentionnez.",
    "es": "Responde por defecto en español. Conserva los nombres exactos de los ajustes, botones y comandos con barra cuando los menciones.",
    "ko": "기본적으로 한국어로 답변하세요. 설정, 버튼, 슬래시 명령을 언급할 때는 원래 이름을 그대로 유지하세요.",
}


def language_rule() -> str:
    return LANGUAGE_RULES.get(str(STATE.get("lang") or "zh-CN"), LANGUAGE_RULES["zh-CN"])
EFFORTS = [
    {"id": "low", "label": "低", "en": "low"},
    {"id": "medium", "label": "中", "en": "medium"},
    {"id": "high", "label": "高", "en": "high"},
    {"id": "xhigh", "label": "极高", "en": "xhigh"},
]
PERMISSIONS = {
    "ask": {"en": "Ask", "modeId": "default", "label": "始终问询"},
    "auto": {"en": "Auto", "modeId": "auto", "label": "本对话自动批准"},
    "full": {"en": "Always-approve", "modeId": "bypassPermissions", "label": "完全访问"},
}

LOCK = threading.RLock()
# 隐藏 grok CLI 的控制台窗口（打包成无终端的桌面应用时必需）
NO_WINDOW = subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0


def grok_bin() -> str:
    env = os.environ.get("GROK_BIN")
    if env:
        return env
    candidate = GROK_HOME / "bin" / "grok.exe"
    if candidate.exists():
        return str(candidate)
    found = shutil.which("grok")
    return found or "grok"


def normalize_cwd(path: str | None) -> str:
    raw = (path or "").strip() or str(Path.cwd())
    try:
        return str(Path(raw).expanduser().resolve())
    except Exception:
        return raw


def _parse_auth_time(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def grok_voice_bearer() -> str:
    """只从 Grok 自己的有效 xAI 凭证中取语音识别授权，不返回给前端。"""
    env_key = os.environ.get("XAI_API_KEY", "").strip()
    if env_key:
        return env_key

    store = read_json(GROK_HOME / "auth.json")
    if not isinstance(store, dict):
        raise RuntimeError("找不到有效的 Grok 登录凭证，请先登录 Grok Build。")

    now = datetime.now(timezone.utc)
    candidates: list[tuple[datetime, dict[str, Any]]] = []
    for scope, record in store.items():
        if not isinstance(record, dict):
            continue
        mode = str(record.get("auth_mode") or "").lower()
        issuer = str(record.get("oidc_issuer") or "")
        first_party_login = mode in {"oidc", "external"} and urlparse(issuer).hostname == "auth.x.ai"
        first_party_key = scope == "xai::api_key" and mode == "api_key"
        if not (first_party_login or first_party_key):
            continue
        bearer = record.get("key")
        if not isinstance(bearer, str) or not bearer.strip():
            continue
        expires = _parse_auth_time(record.get("expires_at"))
        if expires is None:
            created = _parse_auth_time(record.get("create_time"))
            expires = created + timedelta(days=30) if created else None
        if expires is not None and expires > now:
            candidates.append((expires, record))

    if not candidates:
        raise RuntimeError("没有有效的 xAI 登录凭证，请重新登录 Grok Build 后重试。")
    if len(candidates) > 1:
        active_user = str(load_account().get("userId") or "")
        matching = [item for item in candidates if str(item[1].get("user_id") or item[1].get("principal_id") or "") == active_user]
        if len(matching) == 1:
            candidates = matching
        else:
            raise RuntimeError("检测到多个 Grok 登录凭证，无法确定当前语音识别账号。")
    return str(candidates[0][1]["key"]).strip()


def grok_voice_stt_url() -> str:
    """按 Grok Runtime 的配置构造原生语音识别 HTTPS 地址。"""
    config = load_toml()
    voice = config.get("voice") if isinstance(config.get("voice"), dict) else {}
    endpoints = config.get("endpoints") if isinstance(config.get("endpoints"), dict) else {}
    api_base = str(voice.get("api_base") or endpoints.get("xai_api_base_url") or "https://api.x.ai").strip()
    parsed = urlparse(api_base if "://" in api_base else "https://" + api_base.lstrip("/"))
    if parsed.scheme.lower() not in {"https", "wss"} or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise RuntimeError("Grok 语音识别地址必须是有效的 HTTPS/WSS 地址。")

    stt_path = str(voice.get("stt_ws_path") or "/v1/stt").strip()
    if not stt_path.startswith("/"):
        stt_path = "/" + stt_path
    if "?" in stt_path or "#" in stt_path:
        raise RuntimeError("Grok 语音识别路径配置无效。")
    base_path = parsed.path.rstrip("/")
    if base_path.endswith("/v1") and stt_path.startswith("/v1/"):
        stt_path = stt_path[3:]

    return urlunparse(("https", parsed.netloc, base_path + stt_path, "", "", ""))


def grok_voice_stt_language(language: str = "") -> str:
    """优先使用界面传入的识别语言，否则回退到 Runtime 配置。"""
    config = load_toml()
    voice = config.get("voice") if isinstance(config.get("voice"), dict) else {}
    requested_language = str(language or "").strip().lower().split("-", 1)[0]
    configured_language = str(voice.get("language") or "").strip().lower()
    if requested_language == "auto":
        return ""
    if requested_language in VOICE_LANGUAGE_CODES:
        return requested_language
    if configured_language == "auto":
        return ""
    return configured_language if configured_language in VOICE_LANGUAGE_CODES else ""


def transcribe_voice_pcm(pcm: bytes, language: str = "", keyterms: list[str] | None = None) -> str:
    """将本地麦克风生成的 16 kHz PCM 封装为 WAV 并交给 Grok Runtime 识别。"""
    if not pcm or len(pcm) % 2:
        raise RuntimeError("没有录到有效的语音数据。")
    if len(pcm) > VOICE_MAX_PCM_BYTES:
        raise RuntimeError("录音超过 3 分钟上限，请分段录入。")
    bearer = grok_voice_bearer()
    url = grok_voice_stt_url()
    selected_language = grok_voice_stt_language(language)
    import io
    import urllib.error as _ue
    import urllib.request as _uq
    import wave

    audio_file = io.BytesIO()
    with wave.open(audio_file, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(VOICE_SAMPLE_RATE)
        wav.writeframes(pcm)

    boundary = f"----grok-build-{uuid.uuid4().hex}"
    body = bytearray()
    if selected_language:
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\n{selected_language}\r\n".encode("utf-8"))
    clean_keyterms: list[str] = []
    seen_keyterms: set[str] = set()
    for term in keyterms or []:
        if not isinstance(term, str):
            continue
        cleaned = " ".join(term.split())[:50]
        normalized = cleaned.casefold()
        if cleaned and normalized not in seen_keyterms:
            clean_keyterms.append(cleaned)
            seen_keyterms.add(normalized)
        if len(clean_keyterms) >= 100:
            break
    for term in clean_keyterms:
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"keyterm\"\r\n\r\n{term}\r\n".encode("utf-8"))
    body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"voice.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode("ascii"))
    body.extend(audio_file.getvalue())
    body.extend(f"\r\n--{boundary}--\r\n".encode("ascii"))
    request = _uq.Request(
        url,
        data=bytes(body),
        headers={"Authorization": f"Bearer {bearer}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with _uq.urlopen(request, timeout=120) as response:
            raw = response.read(1024 * 1024 + 1)
    except _ue.HTTPError as exc:
        if exc.code in {401, 403}:
            raise RuntimeError("Grok 语音识别未授权，请检查 Runtime 登录状态。") from None
        if exc.code == 429:
            raise RuntimeError("Grok 语音识别请求过于频繁，请稍后重试。") from None
        raise RuntimeError("Grok 语音识别服务返回错误，请检查登录状态后重试。") from None
    except (_ue.URLError, TimeoutError, OSError):
        raise RuntimeError("Grok 语音识别响应超时，请重试。") from None
    if len(raw) > 1024 * 1024:
        raise RuntimeError("Grok 语音识别响应过大，请重试。")
    try:
        result = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise RuntimeError("Grok 语音识别返回了无法读取的结果，请重试。") from None
    return str(result.get("text") or "").strip() if isinstance(result, dict) else ""


MARKET_MAX_BYTES = 4 * 1024 * 1024
VOICE_SAMPLE_RATE = 16_000
VOICE_MAX_SECONDS = 180
VOICE_MAX_PCM_BYTES = VOICE_SAMPLE_RATE * 2 * VOICE_MAX_SECONDS
VOICE_LANGUAGE_CODES = {"ar", "ca", "cs", "da", "de", "en", "es", "fil", "fr", "hi", "id", "it", "ja", "ko", "ms", "nl", "pl", "pt", "ru", "sv", "th", "tr", "vi", "zh"}


def normalize_market_url(value: str | None) -> str:
    """校验第三方市场清单地址，只允许带主机名的 HTTP(S) 地址。"""
    url = str(value or "").strip()
    if not url:
        raise RuntimeError("请输入第三方市场清单地址")
    if len(url) > 2048:
        raise RuntimeError("第三方市场地址过长")
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ("http", "https") or not parsed.netloc or not parsed.hostname:
        raise RuntimeError("请输入完整的 http 或 https 清单地址")
    if parsed.username or parsed.password:
        raise RuntimeError("清单地址不能包含账号或密码")
    return url


def fetch_market_json(url: str, timeout: int = 12) -> Any:
    """读取并限制大小，避免把非 JSON 页面或过大响应带入界面。"""
    import urllib.request as _uq

    normalized = normalize_market_url(url)
    req = _uq.Request(normalized, headers={"User-Agent": "GrokBuildWebUI/1.0", "Accept": "application/json"})
    with _uq.urlopen(req, timeout=timeout) as resp:
        raw = resp.read(MARKET_MAX_BYTES + 1)
    if len(raw) > MARKET_MAX_BYTES:
        raise RuntimeError("第三方市场清单超过 4 MB 限制")
    try:
        return json.loads(raw.decode("utf-8-sig"))
    except Exception as exc:
        raise RuntimeError("第三方市场清单不是合法 JSON") from exc


def parse_market_plugins(data: Any) -> list[dict[str, str]]:
    """把常见 marketplace.json 结构归一为页面和 grok 安装器可用的字段。"""
    if isinstance(data, list):
        raw_items = data
    elif isinstance(data, dict):
        raw_items = []
        for key in ("plugins", "items", "packages"):
            candidate = data.get(key)
            if isinstance(candidate, list):
                raw_items = candidate
                break
    else:
        raw_items = []

    out: list[dict[str, str]] = []
    for item in raw_items[:500]:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or item.get("id") or item.get("slug") or "").strip()
        if not name:
            continue
        source = item.get("source")
        path = ""
        if isinstance(source, dict):
            repo = str(
                source.get("repo")
                or source.get("repository")
                or source.get("url")
                or source.get("source")
                or ""
            ).strip()
            path = str(source.get("path") or source.get("subdir") or "").strip()
        else:
            repo = str(
                item.get("repo")
                or item.get("repository")
                or item.get("url")
                or source
                or ""
            ).strip()
        out.append(
            {
                "name": name[:120],
                "description": str(item.get("description") or item.get("summary") or "").strip()[:240],
                "repo": repo[:512],
                "path": path[:200],
            }
        )
    return out


def market_source_name(data: Any, url: str) -> str:
    """为未填写名称的来源提供稳定、可读的默认名称。"""
    if isinstance(data, dict):
        name = str(data.get("name") or data.get("title") or "").strip()
        if name:
            return name[:80]
    host = urlparse(url).hostname or "第三方市场"
    return host.removeprefix("www.")[:80]


def load_market_sources() -> list[dict[str, str]]:
    raw = None
    for path in (MARKET_SOURCES_PATH, MARKET_SOURCES_FALLBACK_PATH):
        if not path.exists():
            continue
        try:
            candidate = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(candidate, list):
            raw = candidate
            break
    if raw is None:
        return []
    sources: list[dict[str, str]] = []
    for item in raw[:24]:
        if not isinstance(item, dict):
            continue
        source_id = str(item.get("id") or "").strip()[:48]
        name = str(item.get("name") or "").strip()[:80]
        url = str(item.get("url") or "").strip()
        if not source_id or not name or not url:
            continue
        try:
            url = normalize_market_url(url)
        except RuntimeError:
            continue
        sources.append({"id": source_id, "name": name, "url": url})
    return sources


def save_market_sources(sources: list[dict[str, str]]) -> None:
    payload = json.dumps(sources[:24], ensure_ascii=False, indent=2)
    last_error: OSError | None = None
    for path in (MARKET_SOURCES_PATH, MARKET_SOURCES_FALLBACK_PATH):
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(payload, encoding="utf-8")
            return
        except OSError as exc:
            last_error = exc
    if last_error:
        raise last_error


SETTINGS_DEFAULTS: dict[str, Any] = {
    "worktreeNew": "never",
    "worktreeFork": "ask",
    "worktreeTrack": "agent",
    "rememberApprovals": True,
    "defaultPermission": "always",
    "questionTimeout": True,
    "subAgents": True,
    "doubleCompression": False,
    "forkModel": "grok-4.7",
    "cancelSubAgent": "ask",
    "startupHints": True,
    "compressionThreshold": 85,
    "loadEnvrc": True,
    "remoteFetch": True,
    "keepSelection": "flash",
    "undoHints": True,
    "planHints": True,
    "imageHints": True,
    "immediateSendHints": True,
    "smallScreenHints": True,
    "commandHints": True,
    "gitignore": False,
    "shellTimeout": 120,
    "shellOutputLimit": 20000,
    "lspTools": False,
    "codeIndex": True,
    "memorySaveEnd": True,
    "memoryWatch": True,
    "memoryMax": 6,
    "memorySimilarity": 0.35,
    "memoryInject": True,
    "telemetry": False,
    "feedback": True,
    "voiceHotkey": "",
    "voiceDictionary": [],
}
LANG_IDS = {
    "zh-CN",
    "zh-TW",
    "zh-TW-TW",
    "zh-HK",
    "en",
    "ja",
    "de",
    "fr",
    "es",
    "ko",
}


def normalize_settings(raw: Any) -> dict[str, Any]:
    data = dict(SETTINGS_DEFAULTS)
    if not isinstance(raw, dict):
        return data
    enums = {
        "worktreeNew": {"never", "ask", "always"},
        "worktreeFork": {"never", "ask", "always"},
        "worktreeTrack": {"agent", "all", "none"},
        "defaultPermission": {"always", "session", "ask"},
        "cancelSubAgent": {"ask", "stop", "continue"},
        "keepSelection": {"flash", "persistent", "none"},
    }
    for key, default in SETTINGS_DEFAULTS.items():
        value = raw.get(key)
        if isinstance(default, bool):
            if isinstance(value, bool):
                data[key] = value
        elif isinstance(default, (int, float)):
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                data[key] = value
        elif isinstance(default, list) and key == "voiceDictionary" and isinstance(value, list):
            terms: list[str] = []
            seen: set[str] = set()
            for item in value:
                if not isinstance(item, str):
                    continue
                term = " ".join(item.split())[:50]
                normalized = term.casefold()
                if term and normalized not in seen:
                    terms.append(term)
                    seen.add(normalized)
                if len(terms) >= 100:
                    break
            data[key] = terms
        elif isinstance(value, str) and (key not in enums or value in enums[key]):
            data[key] = value[:80] if key == "voiceHotkey" else value
    data["compressionThreshold"] = max(50, min(99, int(data["compressionThreshold"])))
    data["shellTimeout"] = max(5, min(3600, int(data["shellTimeout"])))
    data["shellOutputLimit"] = max(1000, min(1000000, int(data["shellOutputLimit"])))
    data["memoryMax"] = max(1, min(100, int(data["memoryMax"])))
    data["memorySimilarity"] = max(0, min(1, float(data["memorySimilarity"])))
    return data


def parse_bool(value: Any, default: bool = False) -> bool:
    """解析 JSON、旧配置和命令行可能产生的布尔值，避免字符串 false 被当成真。"""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value != 0
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "on", "y", "是"}:
            return True
        if normalized in {"0", "false", "no", "off", "n", "否", ""}:
            return False
    return default


def default_state() -> dict[str, Any]:
    return {
        "cwd": str(Path.cwd()),
        "permission": "ask",
        "workMode": "agent",
        "workStyle": "harness",
        "mode": "ask",
        "effort": "high",
        "model": "grok-4.7",
        "theme": "grok-day",
        "lang": "zh-CN",
        "showThinking": True,
        "previewOpen": False,
        "closeAction": "tray",
        "webSearch": True,
        "settings": dict(SETTINGS_DEFAULTS),
    }


def load_state() -> dict[str, Any]:
    raw: dict[str, Any] = {}
    if STATE_PATH.exists():
        try:
            loaded = json.loads(STATE_PATH.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                raw = loaded
        except Exception:
            pass
    data = default_state()
    data.update(raw)
    data["settings"] = normalize_settings(raw.get("settings"))
    data["cwd"] = normalize_cwd(data.get("cwd"))
    if "permission" not in raw:
        if raw.get("mode") in ("always", "full"):
            data["permission"] = "full"
        elif raw.get("mode") == "auto":
            data["permission"] = "auto"
        elif raw.get("mode") == "plan":
            data["workMode"] = "plan"
            data["permission"] = "ask"
    if data.get("workMode") not in ("agent", "plan", "goal"):
        data["workMode"] = "plan" if data.get("mode") == "plan" else "agent"
    if data.get("permission") not in PERMISSIONS:
        data["permission"] = "ask"
    if data.get("effort") not in {e["id"] for e in EFFORTS}:
        data["effort"] = "high"
    if data.get("workStyle") not in ("harness", "classic"):
        data["workStyle"] = "harness"
    if data.get("lang") == "zh-TW":
        data["lang"] = "zh-TW-TW"
    if data.get("lang") not in LANG_IDS:
        data["lang"] = "zh-CN"
    return data


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def encode_cwd(cwd: str) -> str:
    p = str(Path(cwd))
    return (
        p.replace(":", "%3A")
        .replace("\\", "%5C")
        .replace("/", "%2F")
        .replace(" ", "%20")
    )


def session_dirs() -> list[Path]:
    root = GROK_HOME / "sessions"
    if not root.exists():
        return []
    found: list[Path] = []
    for group in root.iterdir():
        if not group.is_dir() or group.name.startswith("."):
            continue
        for child in group.iterdir():
            if child.is_dir() and (child / "summary.json").exists():
                found.append(child)
    return found


_INDEX_LOCK = threading.Lock()
_INDEX: dict[str, Any] = {"t": 0.0, "by_id": {}, "rows": []}


def rebuild_session_index() -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    by_id: dict[str, Path] = {}
    for folder in session_dirs():
        row = read_summary(folder)
        if not row:
            continue
        try:
            row["workspace"] = Path(row.get("cwd") or "").name
        except Exception:
            row["workspace"] = ""
        by_id[str(row["id"])] = folder
        rows.append(row)
    rows.sort(key=lambda x: x.get("updated") or "", reverse=True)
    return {"t": time.time(), "by_id": by_id, "rows": rows[:240]}


def session_index(force: bool = False) -> dict[str, Any]:
    with _INDEX_LOCK:
        if not force and _INDEX["rows"] and (time.time() - float(_INDEX["t"] or 0)) < 4:
            return _INDEX
        data = rebuild_session_index()
        _INDEX.update(data)
        return _INDEX


def invalidate_session_index() -> None:
    with _INDEX_LOCK:
        _INDEX["t"] = 0.0


def load_account() -> dict[str, Any]:
    path = GROK_HOME / "auth.json"
    data = read_json(path)
    rec: dict[str, Any] = {}
    if isinstance(data, dict):
        for val in data.values():
            if isinstance(val, dict) and (val.get("email") or val.get("user_id")):
                rec = val
                break
    first = str(rec.get("first_name") or rec.get("firstName") or "").strip()
    last = str(rec.get("last_name") or rec.get("lastName") or "").strip()
    email = str(rec.get("email") or "").strip()
    name = " ".join(p for p in (first, last) if p) or (email.split("@", 1)[0] if email else "Grok")
    return {
        "name": name,
        "firstName": first,
        "lastName": last,
        "email": email,
        "userId": rec.get("user_id") or rec.get("principal_id") or "",
    }


def weekly_usage() -> dict[str, Any]:
    cutoff = time.time() - 7 * 24 * 3600
    sessions = 0
    turns = 0
    tools = 0
    tokens = 0
    models: dict[str, int] = {}
    idx = session_index(force=True)
    for row in idx["rows"]:
        updated = str(row.get("updated") or row.get("created") or "")
        ts = 0.0
        if updated:
            try:
                ts = time.mktime(time.strptime(updated[:19], "%Y-%m-%dT%H:%M:%S"))
            except Exception:
                ts = 0.0
        if ts and ts < cutoff:
            continue
        sessions += 1
        folder = Path(row.get("path") or "")
        sig = read_json(folder / "signals.json") if folder else None
        if not isinstance(sig, dict):
            sig = {}
        turns += int(sig.get("turnCount") or 0)
        tools += int(sig.get("toolCallCount") or 0)
        tokens += int(sig.get("contextTokensUsed") or 0)
        mid = str(sig.get("primaryModelId") or row.get("model") or "")
        if mid:
            models[mid] = models.get(mid, 0) + 1
    ranked = sorted(models, key=lambda k: models[k], reverse=True)
    return {
        "sessions": sessions,
        "turns": turns,
        "tools": tools,
        "tokens": tokens,
        "models": ranked[:6],
        "days": 7,
    }


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def session_usage(session_id: str) -> dict[str, Any]:
    data: dict[str, Any] = {
        "contextTokensUsed": 0,
        "contextWindowTokens": 0,
        "contextWindowUsage": 0,
        "turnCount": 0,
        "toolCallCount": 0,
        "model": "",
        "turns": [],
    }
    folder = find_session_folder(session_id)
    if folder:
        sig = read_json(folder / "signals.json")
        if isinstance(sig, dict):
            for key in (
                "contextTokensUsed",
                "contextWindowTokens",
                "contextWindowUsage",
                "turnCount",
                "toolCallCount",
            ):
                data[key] = int(sig.get(key) or 0)
            data["model"] = str(sig.get("primaryModelId") or "")
    data["turns"] = list(ACP.turn_usage.get(session_id) or [])[-20:]
    return data


def memory_files() -> dict[str, Any]:
    root = GROK_HOME / "memory"
    root.mkdir(parents=True, exist_ok=True)
    global_path = root / "MEMORY.md"
    if not global_path.exists():
        global_path.write_text(
            "# Global Memory（全局记忆）\n\n> Grok 的记忆系统会自动维护这个文件，也可以手动编辑，下次会话生效。\n",
            encoding="utf-8",
        )
    out: dict[str, Any] = {
        "global": {"path": str(global_path), "text": ""},
        "workspaces": [],
        "agents": None,
    }
    try:
        out["global"]["text"] = global_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        pass
    for child in sorted(root.iterdir()):
        if not child.is_dir() or child.name.startswith("."):
            continue
        mem = child / "MEMORY.md"
        if mem.exists():
            try:
                out["workspaces"].append(
                    {"slug": child.name, "path": str(mem), "text": mem.read_text(encoding="utf-8", errors="replace")}
                )
            except Exception:
                pass
    agents = GROK_HOME / "AGENTS.md"
    if agents.exists():
        try:
            out["agents"] = {"path": str(agents), "text": agents.read_text(encoding="utf-8", errors="replace")}
        except Exception:
            pass
    return out


def write_memory_file(path: str, text: str) -> None:
    target = Path(path).resolve()
    mem_root = (GROK_HOME / "memory").resolve()
    allowed = (
        target == (mem_root / "MEMORY.md").resolve()
        or (mem_root in target.parents and target.name == "MEMORY.md")
        or target == (GROK_HOME / "AGENTS.md").resolve()
    )
    if not allowed:
        raise RuntimeError("只能编辑记忆文件：~/.grok/memory 下的 MEMORY.md 或 AGENTS.md")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


# ---------- config.toml ----------
# 用户消息里被 grok 客户端夹带的上下文块（环境信息、规则、记忆），不该显示给人看。
# 注意：<user_query> 包着的是用户真实输入，只剥标签不删内容。
CONTEXT_TAGS = (
    "user_info",
    "rules",
    "user_rules",
    "environment_context",
    "system-reminder",
    "runtime_meta",
    "session_context",
)
_RE_CTX_BLOCK = re.compile(r"<(" + "|".join(CONTEXT_TAGS) + r")(?:\s[^>]*)?>.*?</\1>\s*", re.S | re.I)
_RE_CTX_OPEN = re.compile(r"<(" + "|".join(CONTEXT_TAGS) + r")(?:\s[^>]*)?>.*\Z", re.S | re.I)
_RE_USER_QUERY = re.compile(r"</?user_query>", re.I)


def clean_user_text(text: str) -> str:
    if not text:
        return ""
    t = _RE_USER_QUERY.sub("", text)
    t = _RE_CTX_BLOCK.sub("", t)
    m = _RE_CTX_OPEN.search(t)
    if m:
        head = t[: m.start()].rstrip()
        # 只有确认还留有正文时才截断，避免把真实提问一起吃掉
        if len(head) >= 20:
            t = head
    return t.strip()


def toml_str(value: str) -> str:
    return '"' + str(value).replace("\\", "\\\\").replace('"', '\\"') + '"'


def set_toml_section(text: str, header: str, body_lines: list[str] | None) -> str:
    """替换或删除一个 [section] 块；body_lines=None 表示删除。"""
    lines = text.splitlines()
    out: list[str] = []
    i, n = 0, len(lines)
    replaced = False
    while i < n:
        line = lines[i]
        if line.strip() == header:
            i += 1
            while i < n and not lines[i].startswith("["):
                i += 1
            if body_lines is not None:
                if out and out[-1].strip():
                    out.append("")
                out.append(header)
                out.extend(body_lines)
                replaced = True
            else:
                replaced = True
            continue
        out.append(line)
        i += 1
    if not replaced and body_lines is not None:
        if out and out[-1].strip():
            out.append("")
        out.append(header)
        out.extend(body_lines)
    return "\n".join(out).rstrip() + "\n"


def set_toml_key(text: str, header: str, key: str, value: str) -> str:
    """只更新指定节中的一个键，保留同一节的其他配置和注释。"""
    lines = text.splitlines()
    assignment = f"{key} = {value}"
    header_index = next((i for i, line in enumerate(lines) if line.strip() == header), None)
    if header_index is None:
        if lines and lines[-1].strip():
            lines.append("")
        lines.extend([header, assignment])
        return "\n".join(lines).rstrip() + "\n"
    section_end = header_index + 1
    while section_end < len(lines) and not lines[section_end].startswith("["):
        section_end += 1
    key_pattern = re.compile(r"^\s*" + re.escape(key) + r"\s*=")
    for index in range(header_index + 1, section_end):
        if key_pattern.match(lines[index]):
            indent = lines[index][: len(lines[index]) - len(lines[index].lstrip())]
            lines[index] = indent + assignment
            return "\n".join(lines).rstrip() + "\n"
    lines.insert(header_index + 1, assignment)
    return "\n".join(lines).rstrip() + "\n"


def load_config_text() -> str:
    try:
        return CONFIG_PATH.read_text(encoding="utf-8")
    except Exception:
        return ""


def save_config_text(text: str) -> None:
    CONFIG_PATH.write_text(text, encoding="utf-8")


def load_toml() -> dict[str, Any]:
    try:
        import tomllib

        return tomllib.loads(load_config_text() or "{}")
    except Exception:
        return {}


def get_memory_enabled() -> bool:
    return bool((load_toml().get("memory") or {}).get("enabled", True))


def set_memory_enabled(enabled: bool) -> None:
    text = set_toml_section(load_config_text(), "[memory]", [f"enabled = {'true' if enabled else 'false'}"])
    save_config_text(text)


def get_auto_update_tui() -> bool:
    return bool((load_toml().get("cli") or {}).get("auto_update", True))


def set_auto_update_tui(enabled: bool) -> None:
    text = set_toml_key(load_config_text(), "[cli]", "auto_update", "true" if enabled else "false")
    save_config_text(text)


def list_custom_models() -> list[dict[str, Any]]:
    data = load_toml()
    rows: list[dict[str, Any]] = []
    for key, val in (data.get("model") or {}).items():
        if isinstance(val, dict):
            rows.append(
                {
                    "id": key,
                    "model": val.get("model") or key,
                    "name": val.get("name") or key,
                    "baseUrl": val.get("base_url") or "",
                    "apiBackend": val.get("api_backend") or "chat_completions",
                    "contextWindow": val.get("context_window") or 0,
                    "hasKey": bool(val.get("api_key")),
                }
            )
    return rows


def provider_source_for_model(model_id: str | None) -> str:
    """只返回模型来源类别，不把配置中的密钥或其他敏感字段送到前端。"""
    value = str(model_id or "").strip()
    if not value:
        return "unknown"
    for item in list_custom_models():
        if value in {str(item.get("id") or ""), str(item.get("model") or "")}:
            return "custom"
    if value in {str(item or "") for item in grok_models()}:
        return "official"
    return "unknown"


def save_custom_model(payload: dict[str, Any]) -> str:
    model_id = str(payload.get("modelId") or "").strip()
    base_url = str(payload.get("baseUrl") or "").strip()
    if not model_id or not base_url:
        raise RuntimeError("模型 ID 和接口地址（Base URL）必填")
    safe = re.sub(r"[^A-Za-z0-9._-]", "-", model_id) or "custom-model"
    lines = [f"model = {toml_str(model_id)}", f"base_url = {toml_str(base_url)}"]
    name = str(payload.get("name") or "").strip()
    if name:
        lines.append(f"name = {toml_str(name)}")
    api_key = str(payload.get("apiKey") or "").strip()
    if not api_key:
        prev = (load_toml().get("model") or {}).get(safe) or {}
        api_key = str(prev.get("api_key") or "")
    if api_key:
        lines.append(f"api_key = {toml_str(api_key)}")
    backend = str(payload.get("apiBackend") or "chat_completions").strip()
    if backend in ("chat_completions", "responses", "messages"):
        lines.append(f'api_backend = "{backend}"')
    ctx = int(payload.get("contextWindow") or 0)
    if ctx > 0:
        lines.append(f"context_window = {ctx}")
    text = set_toml_section(load_config_text(), f"[model.{safe}]", lines)
    save_config_text(text)
    return safe


def remove_custom_model(model_id: str) -> None:
    safe = re.sub(r"[^A-Za-z0-9._-]", "-", model_id)
    text = set_toml_section(load_config_text(), f"[model.{safe}]", None)
    save_config_text(text)


def read_summary(folder: Path) -> dict[str, Any] | None:
    data = read_json(folder / "summary.json")
    if not isinstance(data, dict):
        return None
    info = data.get("info") if isinstance(data.get("info"), dict) else {}
    sid = (
        info.get("id")
        or data.get("id")
        or data.get("session_id")
        or data.get("sessionId")
        or folder.name
    )
    cwd = info.get("cwd") or data.get("cwd") or ""
    mtime = data.get("updated_at") or data.get("last_active_at") or ""
    title = (
        data.get("generated_title")
        or data.get("session_summary")
        or data.get("title")
        or data.get("name")
        or "未命名对话"
    )
    archive_flags = (
        data.get("archived"),
        data.get("webui_archived"),
        data.get("is_archived"),
        data.get("isArchived"),
        data.get("archive"),
    )
    return {
        "id": sid,
        "title": title,
        "cwd": cwd,
        "updated": mtime,
        "created": data.get("created_at") or "",
        "model": data.get("current_model_id") or "",
        "effort": data.get("reasoning_effort") or "",
        "messages": data.get("num_chat_messages") or data.get("num_messages") or 0,
        "parentId": data.get("parent_session_id") or "",
        "manualTitle": parse_bool(data.get("title_is_manual")),
        "archived": any(parse_bool(value) for value in archive_flags),
        "path": str(folder),
    }


def list_sessions(cwd_filter: str | None = None, archived: bool = False) -> list[dict[str, Any]]:
    rows = list(session_index()["rows"])
    rows = [r for r in rows if bool(r.get("archived")) == bool(archived)]
    if not cwd_filter:
        return rows
    try:
        current = normalize_cwd(cwd_filter).lower()
    except Exception:
        current = str(cwd_filter).rstrip("\\/").lower()
    primary: list[dict[str, Any]] = []
    others: list[dict[str, Any]] = []
    for row in rows:
        try:
            a = normalize_cwd(row.get("cwd") or "").lower()
        except Exception:
            a = str(row.get("cwd") or "").rstrip("\\/").lower()
        if a and a == current:
            primary.append(row)
        else:
            others.append(row)
    return primary + others


def _automation_tool_name(update: dict[str, Any]) -> str:
    meta = update.get("_meta") if isinstance(update.get("_meta"), dict) else {}
    tool = meta.get("x.ai/tool") if isinstance(meta.get("x.ai/tool"), dict) else {}
    name = str(tool.get("name") or update.get("toolName") or update.get("title") or "").lower()
    for known in ("scheduler_create", "scheduler_delete"):
        if known in name:
            return known
    return ""


def _automation_payload(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return value
    return value


def _automation_task_id(value: Any) -> str:
    value = _automation_payload(value)
    id_keys = ("task_id", "taskId", "schedule_id", "scheduleId", "id")
    if isinstance(value, dict):
        for key in id_keys:
            item = value.get(key)
            if isinstance(item, (str, int)) and str(item).strip():
                return str(item).strip()
        for item in value.values():
            found = _automation_task_id(item)
            if found:
                return found
    elif isinstance(value, list):
        for item in value:
            found = _automation_task_id(item)
            if found:
                return found
    elif isinstance(value, str):
        match = re.search(r"\b(?:task|schedule)(?:[_\s-]*id)?\s*(?:[:=#]\s*|\s+)([A-Za-z0-9_.:-]+)", value, re.I)
        if not match:
            match = re.search(r"\bid\s*[:=]\s*[\"']?([A-Za-z0-9_.:-]+)", value, re.I)
        if match:
            return match.group(1).rstrip(".,;:)")
    return ""


def list_automations() -> list[dict[str, Any]]:
    created: dict[str, dict[str, Any]] = {}
    cancelled: list[tuple[str, int]] = []
    for folder in session_dirs():
        summary = read_summary(folder) or {}
        session_id = str(summary.get("id") or folder.name)
        path = folder / "updates.jsonl"
        if not path.exists():
            continue
        calls: dict[str, dict[str, Any]] = {}
        try:
            with path.open(encoding="utf-8", errors="replace") as stream:
                for line in stream:
                    if "scheduler_" not in line and '"toolCallId"' not in line:
                        continue
                    try:
                        envelope = json.loads(line)
                    except Exception:
                        continue
                    update = ((envelope.get("params") or {}).get("update") or {})
                    if not isinstance(update, dict):
                        continue
                    kind = update.get("sessionUpdate")
                    call_id = str(update.get("toolCallId") or "")
                    tool_name = _automation_tool_name(update)
                    if kind == "tool_call" and tool_name:
                        calls[call_id] = {
                            "name": tool_name,
                            "input": update.get("rawInput") or update.get("raw_input") or {},
                            "output": update.get("rawOutput"),
                            "status": update.get("status") or "",
                            "created": entry_ts_ms(envelope),
                        }
                    elif kind == "tool_call_update" and call_id:
                        call = calls.get(call_id)
                        if not call and tool_name:
                            call = calls.setdefault(call_id, {"name": tool_name, "input": {}, "output": None, "status": "", "created": entry_ts_ms(envelope)})
                        if call:
                            if update.get("rawInput") is not None:
                                call["input"] = update["rawInput"]
                            if update.get("rawOutput") is not None:
                                call["output"] = update["rawOutput"]
                            if update.get("status"):
                                call["status"] = str(update["status"])
        except OSError:
            continue

        for call in calls.values():
            args = _automation_payload(call.get("input"))
            args = args if isinstance(args, dict) else {}
            if call.get("name") == "scheduler_create":
                task_id = _automation_task_id(call.get("output"))
                if not task_id:
                    continue
                recurring = args.get("recurring", True)
                if isinstance(recurring, str):
                    recurring = recurring.strip().lower() not in ("false", "0", "no", "off")
                created[task_id] = {
                    "id": task_id,
                    "sessionId": session_id,
                    "sessionTitle": summary.get("title") or "未命名对话",
                    "cwd": summary.get("cwd") or "",
                    "prompt": str(args.get("prompt") or ""),
                    "interval": str(args.get("interval") or ""),
                    "recurring": bool(recurring),
                    "created": call.get("created") or 0,
                    "cancelled": False,
                }
            elif call.get("name") == "scheduler_delete":
                status = str(call.get("status") or "").lower()
                task_id = _automation_task_id(args)
                if task_id and any(mark in status for mark in ("complete", "success", "done")):
                    cancelled.append((task_id, int(call.get("created") or 0)))

    for task_id, removed_at in cancelled:
        task = created.get(task_id)
        if task and (not removed_at or not task["created"] or removed_at >= task["created"]):
            task["cancelled"] = True
    return sorted(created.values(), key=lambda item: item.get("created") or 0, reverse=True)


def find_session_folder(session_id: str) -> Path | None:
    if not session_id:
        return None
    idx = session_index()
    hit = idx["by_id"].get(session_id)
    if hit and Path(hit).exists():
        return Path(hit)
    for folder in session_dirs():
        if folder.name == session_id:
            return folder
        row = read_summary(folder)
        if row and row["id"] == session_id:
            return folder
    return None


def entry_ts_ms(obj: dict[str, Any]) -> int:
    """从记录条目里尽量取出真实时间（epoch 毫秒）。"""
    for key in ("ts", "timestamp", "created_at", "createdAt"):
        val = obj.get(key)
        if val in (None, ""):
            continue
        try:
            if isinstance(val, (int, float)):
                return int(val if val > 1e12 else val * 1000)
            if isinstance(val, str):
                if val.replace(".", "", 1).isdigit():
                    num = float(val)
                    return int(num if num > 1e12 else num * 1000)
                dt = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
                return int(dt.timestamp() * 1000)
        except Exception:
            continue
    return 0


def _content_text(content: Any) -> str:
    if isinstance(content, str):
        return clean_user_text(content)
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") in ("text", "input_text", "output_text") or "text" in item:
                text = str(item.get("text") or "")
                if text.startswith("<system-reminder>"):
                    continue
                text = clean_user_text(text)
                if text:
                    parts.append(text)
        return "\n".join(p for p in parts if p).strip()
    if isinstance(content, dict):
        return clean_user_text(str(content.get("text") or ""))
    return ""


_HIST_CACHE: dict[str, tuple[float, int, Any]] = {}


def reconstruct_from_chat_history(folder: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]] | None:
    path = folder / "chat_history.jsonl"
    if not path.exists():
        return None
    try:
        st = path.stat()
        cached = _HIST_CACHE.get(str(path))
        if cached and cached[0] == st.st_mtime and cached[1] == st.st_size:
            return cached[2]
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return None
    if not lines:
        return None
    if len(lines) > 500:
        lines = lines[-500:]
    messages: list[dict[str, Any]] = []
    todos: list[dict[str, Any]] = []
    files: dict[str, dict[str, Any]] = {}
    assistant: dict[str, Any] | None = None

    def flush() -> None:
        nonlocal assistant
        if assistant and (assistant.get("text") or assistant.get("tools")):
            messages.append(assistant)
        assistant = None

    for line in lines:
        raw = line.strip()
        if not raw.startswith("{"):
            continue
        try:
            obj = json.loads(raw)
        except Exception:
            continue
        kind = obj.get("type") or obj.get("role")
        if kind == "user":
            flush()
            text = _content_text(obj.get("content"))
            if text:
                messages.append({"role": "user", "text": text, "ts": entry_ts_ms(obj)})
        elif kind == "assistant":
            flush()
            text = _content_text(obj.get("content"))
            tools = []
            for call in obj.get("tool_calls") or []:
                if not isinstance(call, dict):
                    continue
                name = str(call.get("name") or "tool")
                args_raw = call.get("arguments") or {}
                if isinstance(args_raw, str):
                    try:
                        args_raw = json.loads(args_raw)
                    except Exception:
                        args_raw = {"raw": args_raw}
                tools.append(
                    {
                        "id": call.get("id") or "",
                        "title": name,
                        "kind": name,
                        "status": "completed",
                        "input": args_raw if isinstance(args_raw, dict) else {},
                        "output": {},
                    }
                )
                if "todo" in name.lower() and isinstance(args_raw, dict):
                    found = todos_from_payload(args_raw)
                    if found:
                        todos = found
                path_val = ""
                if isinstance(args_raw, dict):
                    path_val = str(
                        args_raw.get("path")
                        or args_raw.get("target_file")
                        or args_raw.get("file_path")
                        or ""
                    )
                if path_val and name not in ("todo_write", "exit_plan_mode"):
                    files[path_val] = {"path": path_val, "action": "edit" if "replace" in name or "write" in name else "read"}
            assistant = {"role": "assistant", "text": text, "thought": "", "tools": tools, "ts": entry_ts_ms(obj)}
        elif kind == "reasoning":
            continue
        elif kind == "tool_result":
            continue
    flush()
    if not messages:
        result = None
    else:
        result = (messages[-80:], todos, list(files.values())[-40:])
    try:
        st = path.stat()
        _HIST_CACHE[str(path)] = (st.st_mtime, st.st_size, result)
        if len(_HIST_CACHE) > 40:
            for old in list(_HIST_CACHE.keys())[:10]:
                _HIST_CACHE.pop(old, None)
    except Exception:
        pass
    return result


def normalize_todo(item: Any, index: int = 0) -> dict[str, Any] | None:
    if isinstance(item, str) and item.strip():
        return {"id": f"t{index}", "content": item.strip(), "status": "pending"}
    if not isinstance(item, dict):
        return None
    content = (
        item.get("content")
        or item.get("title")
        or item.get("text")
        or item.get("description")
        or ""
    ).strip()
    if not content:
        return None
    status = str(item.get("status") or item.get("state") or "pending").lower()
    if status in ("done", "complete", "completed", "success"):
        status = "completed"
    elif status in ("in_progress", "running", "active", "doing"):
        status = "in_progress"
    elif status in ("cancelled", "canceled", "skipped"):
        status = "cancelled"
    else:
        status = "pending"
    return {
        "id": str(item.get("id") or item.get("priority") or f"t{index}"),
        "content": content,
        "status": status,
        "priority": item.get("priority") or "",
    }


def todos_from_payload(payload: Any) -> list[dict[str, Any]]:
    if payload is None:
        return []
    raw = payload
    if isinstance(payload, dict):
        raw = (
            payload.get("todos")
            or payload.get("entries")
            or payload.get("items")
            or payload.get("tasks")
            or payload.get("plan")
            or payload
        )
    if isinstance(raw, dict) and "content" in raw:
        raw = [raw]
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for i, item in enumerate(raw):
        row = normalize_todo(item, i)
        if row:
            out.append(row)
    return out


def file_from_tool(update: dict[str, Any]) -> dict[str, Any] | None:
    kind = str(
        ((update.get("_meta") or {}).get("x.ai/tool") or {}).get("kind")
        or update.get("kind")
        or ""
    ).lower()
    title = str(update.get("title") or "")
    raw = update.get("rawInput") or update.get("raw_input") or {}
    if not isinstance(raw, dict):
        raw = {}
    path = (
        raw.get("path")
        or raw.get("target_file")
        or raw.get("file_path")
        or raw.get("filePath")
        or raw.get("file")
        or ""
    )
    if not path and title:
        path = title
    if not path:
        return None
    action = "edit"
    if kind in ("read", "search") or "read" in title.lower() or "读取" in title:
        action = "read"
    elif kind in ("write",) or "write" in title.lower() or "写入" in title:
        action = "write"
    elif kind in ("delete",) or "delete" in title.lower():
        action = "delete"
    elif kind in ("execute",) or "command" in title.lower():
        action = "run"
        return None
    return {
        "path": str(path),
        "action": action,
        "title": title,
        "status": update.get("status") or "",
    }


def extract_preview(session_id: str) -> dict[str, Any]:
    folder = find_session_folder(session_id)
    empty = {
        "todos": [],
        "plan": "",
        "files": [],
        "effort": "",
        "model": "",
        "rewind": [],
        "title": "",
        "parentId": "",
    }
    if not folder:
        return empty
    summary = read_summary(folder) or {}
    todos: list[dict[str, Any]] = []
    files: list[dict[str, Any]] = []
    seen_files: dict[str, dict[str, Any]] = {}
    plan_text = ""
    rewind: list[dict[str, Any]] = []

    plan_md = folder / "plan.md"
    if plan_md.exists():
        try:
            plan_text = plan_md.read_text(encoding="utf-8", errors="replace")
        except Exception:
            plan_text = ""
    for name in ("plan.json", "todos.json"):
        payload = read_json(folder / name)
        found = todos_from_payload(payload)
        if found:
            todos = found
    fast = reconstruct_from_chat_history(folder)
    if fast:
        _msgs, fast_todos, fast_files = fast
        if fast_todos:
            todos = fast_todos
        if fast_files:
            files = fast_files
        return {
            "todos": todos,
            "plan": plan_text,
            "files": files[-40:],
            "effort": summary.get("effort") or "",
            "model": summary.get("model") or "",
            "rewind": rewind[-40:],
            "title": summary.get("title") or "",
            "parentId": summary.get("parentId") or "",
            "session": summary,
        }

    updates = folder / "updates.jsonl"
    if updates.exists():
        try:
            lines = updates.read_text(encoding="utf-8", errors="replace").splitlines()
        except Exception:
            lines = []
        if len(lines) > 6000:
            lines = lines[-6000:]
        prompt_i = 0
        last_user = ""
        for line in lines:
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            update = (obj.get("params") or {}).get("update") or obj.get("update") or {}
            kind = update.get("sessionUpdate")
            if kind == "user_message_chunk":
                chunk = ((update.get("content") or {}).get("text")) or ""
                if chunk:
                    last_user += chunk
            elif last_user and kind and kind != "user_message_chunk":
                prompt_i += 1
                rewind.append(
                    {
                        "index": prompt_i,
                        "preview": last_user.strip().replace("\n", " ")[:80],
                    }
                )
                last_user = ""
            if kind == "plan":
                found = todos_from_payload(update.get("entries") or update)
                if found:
                    todos = found
            elif kind in ("tool_call", "tool_call_update"):
                raw = update.get("rawInput") or update.get("raw_input") or {}
                if isinstance(raw, dict) and ("todos" in raw or "entries" in raw):
                    found = todos_from_payload(raw)
                    if found:
                        todos = found
                title = str(update.get("title") or "").lower()
                tool_name = str(
                    ((update.get("_meta") or {}).get("x.ai/tool") or {}).get("name")
                    or update.get("toolName")
                    or ""
                ).lower()
                if "todo" in title or "todo" in tool_name:
                    found = todos_from_payload(raw)
                    if found:
                        todos = found
                card = file_from_tool(update)
                if card:
                    seen_files[card["path"]] = card
        if last_user:
            prompt_i += 1
            rewind.append(
                {
                    "index": prompt_i,
                    "preview": last_user.strip().replace("\n", " ")[:80],
                }
            )
    files = list(seen_files.values())[-40:]
    rp = folder / "rewind_points.jsonl"
    if rp.exists() and not rewind:
        try:
            for i, line in enumerate(rp.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
                if not line.startswith("{"):
                    continue
                obj = json.loads(line)
                rewind.append({"index": obj.get("prompt_index") or i, "preview": f"第 {obj.get('prompt_index') or i} 轮"})
        except Exception:
            pass
    return {
        "todos": todos,
        "plan": plan_text,
        "files": files,
        "effort": summary.get("effort") or "",
        "model": summary.get("model") or "",
        "rewind": rewind[-40:],
        "title": summary.get("title") or "",
        "parentId": summary.get("parentId") or "",
        "session": summary,
    }


def chunk_text(update: dict[str, Any]) -> str:
    content = update.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        if content.get("text"):
            return str(content.get("text") or "")
        inner = content.get("content")
        if isinstance(inner, list):
            return "".join(str(x.get("text") or "") for x in inner if isinstance(x, dict))
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(str(item.get("text") or ""))
            elif item:
                parts.append(str(item))
        return "".join(parts)
    return str(update.get("text") or "")


def reconstruct_history(session_id: str, max_events: int = 2500) -> list[dict[str, Any]]:
    folder = find_session_folder(session_id)
    if not folder:
        return []
    fast = reconstruct_from_chat_history(folder)
    if fast:
        return fast[0]
    path = folder / "updates.jsonl"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if len(lines) > max_events:
        lines = lines[-max_events:]
    messages: list[dict[str, Any]] = []
    assistant: dict[str, Any] | None = None
    tools: dict[str, dict[str, Any]] = {}
    latest_todos: list[dict[str, Any]] = []
    user_ts = 0
    assistant_ts = 0

    def flush_assistant() -> None:
        nonlocal assistant
        if assistant and (assistant.get("text") or assistant.get("thought") or assistant.get("tools") or assistant.get("todos")):
            if assistant_ts:
                assistant["ts"] = assistant_ts
            messages.append(assistant)
        assistant = None
        assistant_ts = 0

    for line in lines:
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        update = (obj.get("params") or {}).get("update") or {}
        kind = update.get("sessionUpdate")
        line_ts = entry_ts_ms(obj)
        if kind == "user_message_chunk":
            flush_assistant()
            if not user_ts:
                user_ts = line_ts
            text = chunk_text(update)
            if messages and messages[-1].get("role") == "user":
                messages[-1]["text"] = (messages[-1].get("text") or "") + text
            else:
                messages.append({"role": "user", "text": text, "ts": user_ts})
        elif kind in ("agent_message_chunk", "agent_thought_chunk"):
            user_ts = 0
            if assistant is None:
                assistant = {"role": "assistant", "text": "", "thought": "", "tools": []}
                assistant_ts = line_ts
            chunk = chunk_text(update)
            if kind == "agent_thought_chunk":
                assistant["thought"] = (assistant.get("thought") or "") + chunk
            else:
                assistant["text"] = (assistant.get("text") or "") + chunk
        elif kind == "tool_call":
            if assistant is None:
                assistant = {"role": "assistant", "text": "", "thought": "", "tools": []}
            tid = update.get("toolCallId") or ""
            card = {
                "id": tid,
                "title": update.get("title") or "工具",
                "kind": ((update.get("_meta") or {}).get("x.ai/tool") or {}).get("kind")
                or update.get("kind")
                or "",
                "status": update.get("status") or "pending",
                "input": update.get("rawInput") or update.get("raw_input") or {},
                "output": update.get("rawOutput") or {},
            }
            tools[tid] = card
            assistant["tools"].append(card)
            raw = card["input"]
            if isinstance(raw, dict) and ("todos" in raw or "entries" in raw):
                found = todos_from_payload(raw)
                if found:
                    latest_todos = found
                    assistant["todos"] = found
        elif kind == "tool_call_update":
            tid = update.get("toolCallId") or ""
            card = tools.get(tid)
            if card:
                if update.get("status"):
                    card["status"] = update["status"]
                if update.get("title"):
                    card["title"] = update["title"]
                if update.get("rawOutput") is not None:
                    card["output"] = update["rawOutput"]
                if update.get("rawInput") is not None:
                    card["input"] = update["rawInput"]
                    found = todos_from_payload(card["input"])
                    if found:
                        latest_todos = found
                        if assistant:
                            assistant["todos"] = found
        elif kind == "plan":
            if assistant is None:
                assistant = {"role": "assistant", "text": "", "thought": "", "tools": []}
            found = todos_from_payload(update.get("entries") or update)
            if found:
                latest_todos = found
                assistant["todos"] = found
            assistant["plan"] = update.get("entries") or update.get("plan") or update
    flush_assistant()
    for m in messages:
        if m.get("role") == "user":
            m["text"] = clean_user_text(m.get("text") or "")
    return messages[-80:]


def browse_path(path: str | None) -> dict[str, Any]:
    if not path:
        drives = []
        if hasattr(os, "listdrives"):
            drives = [{"name": d, "path": d, "type": "drive"} for d in os.listdrives()]
        else:
            for letter in "CDEFGHIJKLMNOPQRSTUVWXYZ":
                d = f"{letter}:\\"
                if Path(d).exists():
                    drives.append({"name": d, "path": d, "type": "drive"})
        home = {"name": "用户目录", "path": str(HOME), "type": "dir"}
        return {"path": "", "parent": None, "entries": [home, *drives]}
    target = Path(path)
    if not target.exists() or not target.is_dir():
        return {"error": "找不到这个文件夹", "path": path, "entries": []}
    entries = []
    try:
        for child in sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
            if child.name.startswith("."):
                continue
            if child.is_dir():
                entries.append({"name": child.name, "path": str(child), "type": "dir"})
            if len(entries) >= 400:
                break
    except PermissionError:
        return {"error": "没有权限打开这个文件夹", "path": str(target), "entries": []}
    parent = str(target.parent) if target.parent != target else None
    return {"path": str(target), "parent": parent, "entries": entries}


def patch_summary(folder: Path, **fields: Any) -> None:
    path = folder / "summary.json"
    data = read_json(path)
    if not isinstance(data, dict):
        data = {"info": {"id": folder.name}}
    data.update(fields)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def delete_session(session_id: str) -> bool:
    folder = find_session_folder(session_id)
    if not folder or not folder.exists():
        return False
    try:
        subprocess.run(
            [grok_bin(), "sessions", "delete", session_id],
            text=True,
            timeout=20,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            creationflags=NO_WINDOW,
            check=False,
        )
    except Exception:
        pass
    # CLI 对“找不到会话”也可能返回 0；只有确认目录已消失才算删除成功。
    if folder.exists():
        try:
            shutil.rmtree(folder)
        except OSError:
            try:
                for child in folder.rglob("*"):
                    try:
                        child.chmod(0o666)
                    except OSError:
                        pass
                folder.chmod(0o777)
                shutil.rmtree(folder)
            except OSError:
                pass
    return not folder.exists()


def fork_session_files(session_id: str, until_prompt: int | None = None) -> str:
    src = find_session_folder(session_id)
    if not src:
        raise RuntimeError("找不到要分叉的对话")
    new_id = str(uuid.uuid4())
    dest = src.parent / new_id
    def _ignore(directory: str, names: list[str]) -> list[str]:
        skip = []
        for n in names:
            if n.endswith(".lock") or n in ("terminal",):
                skip.append(n)
        return skip
    shutil.copytree(src, dest, ignore=_ignore)
    summary = read_json(dest / "summary.json") or {}
    info = summary.get("info") or {}
    old_title = summary.get("generated_title") or summary.get("session_summary") or "未命名对话"
    info["id"] = new_id
    summary["info"] = info
    summary["parent_session_id"] = session_id
    summary["title_is_manual"] = True
    summary["generated_title"] = f"{old_title} · 分支"
    dest.joinpath("summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    if until_prompt and until_prompt > 0:
        truncate_updates(dest, until_prompt)
    return new_id


def truncate_updates(folder: Path, until_prompt: int) -> None:
    path = folder / "updates.jsonl"
    if not path.exists():
        return
    kept: list[str] = []
    prompt_i = 0
    last_user = False
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        raw = line.strip()
        if not raw.startswith("{"):
            kept.append(line)
            continue
        try:
            obj = json.loads(raw)
        except Exception:
            kept.append(line)
            continue
        update = (obj.get("params") or {}).get("update") or {}
        kind = update.get("sessionUpdate")
        if kind == "user_message_chunk":
            if not last_user:
                prompt_i += 1
                last_user = True
            if prompt_i > until_prompt:
                break
        else:
            last_user = False
            if prompt_i >= until_prompt and kind in ("agent_message_chunk", "agent_thought_chunk", "tool_call", "tool_call_update", "plan"):
                kept.append(line)
                continue
            if prompt_i > until_prompt:
                break
        kept.append(line)
    path.write_text("\n".join(kept) + ("\n" if kept else ""), encoding="utf-8")


class EventBus:
    def __init__(self) -> None:
        self._subs: list[queue.Queue] = []
        self._lock = threading.Lock()
        self.turn_events: list[dict[str, Any]] = []
        self.session_id: str | None = None
        self.done = True
        self.error: str | None = None

    def reset_turn(self) -> None:
        with self._lock:
            self.turn_events = []
            self.done = False
            self.error = None

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "events": list(self.turn_events),
                "sessionId": self.session_id,
                "done": self.done,
                "error": self.error,
                "running": not self.done,
            }

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=500)
        with self._lock:
            self._subs.append(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            if q in self._subs:
                self._subs.remove(q)

    def emit(self, event: dict[str, Any]) -> None:
        with self._lock:
            self.turn_events.append(event)
            if event.get("sessionId"):
                self.session_id = event.get("sessionId")
            if event.get("type") == "turn_end":
                self.done = True
            if event.get("type") == "error":
                self.error = event.get("message")
                self.done = True
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(event)
            except queue.Full:
                try:
                    q.get_nowait()
                    q.put_nowait(event)
                except Exception:
                    pass


class AcpBridge:
    def __init__(self, bus: EventBus) -> None:
        self.bus = bus
        self.proc: subprocess.Popen | None = None
        self._id = 0
        self._pending: dict[int, queue.Queue] = {}
        self._write_lock = threading.Lock()
        self.ready = threading.Event()
        self.error: str | None = None
        self.init_result: dict[str, Any] = {}
        self.version = ""
        self._stderr_tail: list[str] = []
        self.live_sessions: set[str] = set()
        self._start_lock = threading.Lock()
        self.process_effort = ""
        self.session_models: dict[str, str] = {}
        self.session_efforts: dict[str, str] = {}
        self.model_catalog: list[dict[str, Any]] = []
        self.turn_usage: dict[str, list[dict[str, Any]]] = {}

    def start(self, effort: str | None = None) -> None:
        with self._start_lock:
            if self.alive() or self.ready.is_set():
                return
            self._start_unlocked(effort)

    def restart(self, effort: str | None = None) -> None:
        with self._start_lock:
            self._stop_unlocked()
            self.ready.clear()
            self.error = None
            self._start_unlocked(effort)

    def _stop_unlocked(self) -> None:
        proc = self.proc
        self.proc = None
        self.live_sessions.clear()
        if proc and proc.poll() is None:
            try:
                proc.terminate()
            except Exception:
                pass
            try:
                proc.kill()
            except Exception:
                pass

    def _start_unlocked(self, effort: str | None = None) -> None:
        env = os.environ.copy()
        env["PYTHONUTF8"] = "1"
        chosen = effort or STATE.get("effort") or "high"
        env["GROK_CONFIG"] = json.dumps({"models": {"default_reasoning_effort": chosen}})
        cmd = [grok_bin(), "agent", "--no-leader", "--reasoning-effort", chosen, "stdio"]
        try:
            if STATE.get("webSearch") is False:
                cmd.insert(2, "--disable-web-search")
        except Exception:
            pass
        creation = 0
        if sys.platform == "win32":
            creation = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]
        try:
            self.proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,
                env=env,
                cwd=str(WEBUI_DIR),
                creationflags=creation,
                close_fds=True,
            )
        except FileNotFoundError:
            self.error = "找不到 grok 命令。请确认已经安装 Grok Build。"
            self.bus.emit({"type": "status", "ok": False, "error": self.error})
            return
        self.process_effort = chosen
        threading.Thread(target=self._read_stdout, daemon=True, name="acp-out").start()
        threading.Thread(target=self._read_stderr, daemon=True, name="acp-err").start()
        try:
            result = self.request(
                "initialize",
                {
                    "protocolVersion": 1,
                    "clientInfo": {"name": "grok-zh-webui", "title": "Grok 中文操作台", "version": "0.2.0"},
                    "clientCapabilities": {
                        "fs": {"readTextFile": False, "writeTextFile": False},
                        "terminal": False,
                    },
                },
                timeout=20,
            )
            self.init_result = result or {}
            self.ready.set()
            self.bus.emit({"type": "status", "ok": True, "init": self.init_result})
        except Exception as exc:
            self.error = f"Grok 代理启动失败：{exc}"
            self.bus.emit({"type": "status", "ok": False, "error": self.error})

    def alive(self) -> bool:
        return bool(self.proc and self.proc.poll() is None)

    def _next_id(self) -> int:
        with self._write_lock:
            self._id += 1
            return self._id

    def _send(self, obj: dict[str, Any]) -> None:
        if not self.proc or not self.proc.stdin:
            raise RuntimeError("Grok 代理还没启动")
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8") + b"\n"
        with self._write_lock:
            self.proc.stdin.write(raw)
            self.proc.stdin.flush()

    def request(self, method: str, params: dict[str, Any] | None = None, timeout: float = 60) -> dict[str, Any]:
        req_id = self._next_id()
        waiter: queue.Queue = queue.Queue(maxsize=1)
        self._pending[req_id] = waiter
        self._send({"jsonrpc": "2.0", "id": req_id, "method": method, "params": params or {}})
        try:
            msg = waiter.get(timeout=timeout)
        except queue.Empty:
            self._pending.pop(req_id, None)
            raise TimeoutError(f"等待 Grok 回复超时：{method}")
        if "error" in msg:
            err = msg["error"]
            if isinstance(err, dict):
                raise RuntimeError(err.get("message") or json.dumps(err, ensure_ascii=False))
            raise RuntimeError(str(err))
        return msg.get("result") or {}

    def notify(self, method: str, params: dict[str, Any] | None = None) -> None:
        self._send({"jsonrpc": "2.0", "method": method, "params": params or {}})

    def respond(self, req_id: Any, result: dict[str, Any]) -> None:
        self._send({"jsonrpc": "2.0", "id": req_id, "result": result})

    def try_request(self, method: str, params: dict[str, Any] | None = None, timeout: float = 10) -> dict[str, Any] | None:
        try:
            return self.request(method, params, timeout=timeout)
        except Exception:
            return None

    def _read_stderr(self) -> None:
        if not self.proc or not self.proc.stderr:
            return
        for raw in iter(self.proc.stderr.readline, b""):
            line = raw.decode("utf-8", "replace").rstrip()
            if not line:
                continue
            self._stderr_tail.append(line)
            if len(self._stderr_tail) > 80:
                self._stderr_tail = self._stderr_tail[-80:]

    def _read_stdout(self) -> None:
        if not self.proc or not self.proc.stdout:
            return
        buf = b""
        while True:
            chunk = self.proc.stdout.read(4096)
            if not chunk:
                break
            buf += chunk
            while True:
                if buf.startswith(b"Content-Length:") or buf.lower().startswith(b"content-length:"):
                    header_end = buf.find(b"\r\n\r\n")
                    if header_end < 0:
                        header_end = buf.find(b"\n\n")
                        if header_end < 0:
                            break
                        sep = 2
                    else:
                        sep = 4
                    header = buf[:header_end].decode("utf-8", "replace")
                    length = 0
                    for row in header.splitlines():
                        if row.lower().startswith("content-length:"):
                            length = int(row.split(":", 1)[1].strip())
                    body_start = header_end + sep
                    if len(buf) < body_start + length:
                        break
                    body = buf[body_start : body_start + length]
                    buf = buf[body_start + length :]
                    self._dispatch_raw(body.decode("utf-8", "replace"))
                    continue
                nl = buf.find(b"\n")
                if nl < 0:
                    break
                line = buf[:nl]
                buf = buf[nl + 1 :]
                text = line.decode("utf-8", "replace").strip()
                if text.startswith("{"):
                    self._dispatch_raw(text)

        self.error = self.error or "Grok 代理已退出"
        self.bus.emit({"type": "status", "ok": False, "error": self.error})

    def _dispatch_raw(self, text: str) -> None:
        try:
            msg = json.loads(text)
        except Exception:
            return
        if not isinstance(msg, dict):
            return
        if "id" in msg and ("result" in msg or "error" in msg) and "method" not in msg:
            waiter = self._pending.pop(msg["id"], None)
            if waiter:
                try:
                    waiter.put_nowait(msg)
                except queue.Full:
                    pass
            return
        method = msg.get("method")
        if method in ("session/update", "_x.ai/session/update", "x.ai/session/update"):
            params = msg.get("params") or {}
            update = params.get("update") or {}
            if update.get("sessionUpdate") == "turn_completed":
                self._record_usage(params.get("sessionId") or "", update.get("usage") or {})
            self.bus.emit(
                {
                    "type": "update",
                    "sessionId": params.get("sessionId"),
                    "update": update,
                }
            )
            return
        if method in ("session/request_permission", "requestPermission"):
            params = msg.get("params") or {}
            self.bus.emit(
                {
                    "type": "permission",
                    "id": msg.get("id"),
                    "sessionId": params.get("sessionId"),
                    "params": params,
                }
            )
            return
        if method:
            if "id" in msg:
                self._send(
                    {
                        "jsonrpc": "2.0",
                        "id": msg["id"],
                        "error": {"code": -32601, "message": f"未实现：{method}"},
                    }
                )

    def _record_usage(self, session_id: str, usage: dict[str, Any]) -> None:
        if not session_id or not isinstance(usage, dict) or not usage:
            return
        entry = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "inputTokens": int(usage.get("inputTokens") or 0),
            "outputTokens": int(usage.get("outputTokens") or 0),
            "totalTokens": int(usage.get("totalTokens") or 0),
            "cachedReadTokens": int(usage.get("cachedReadTokens") or 0),
            "reasoningTokens": int(usage.get("reasoningTokens") or 0),
            "modelCalls": int(usage.get("modelCalls") or 0),
            "apiDurationMs": int(usage.get("apiDurationMs") or 0),
            "costUsd": round(float(usage.get("costUsdTicks") or 0) / 1e9, 4),
            "models": sorted((usage.get("modelUsage") or {}).keys()),
        }
        rows = self.turn_usage.setdefault(session_id, [])
        rows.append(entry)
        if len(rows) > 60:
            del rows[:-60]

    def new_session(
        self,
        cwd: str,
        permission: str,
        work_mode: str,
        model: str | None,
        effort: str | None,
    ) -> dict[str, Any]:
        meta: dict[str, Any] = {"rules": language_rule()}
        if permission == "full":
            meta["yoloMode"] = True
        elif permission == "auto":
            meta["autoMode"] = True
        if effort:
            meta["reasoningEffort"] = effort
            meta["effort"] = effort
        if model:
            meta["model"] = model
        params: dict[str, Any] = {"cwd": cwd, "mcpServers": [], "_meta": meta}
        result = self.request("session/new", params, timeout=30)
        session_id = result.get("sessionId") or result.get("session_id")
        models_info = result.get("models") or {}
        catalog = models_info.get("availableModels") or []
        if catalog:
            self.model_catalog = catalog
        current_model = models_info.get("currentModelId") or ""
        if session_id:
            self.live_sessions.add(session_id)
            if current_model:
                self.session_models[session_id] = current_model
            if model and current_model and model != current_model:
                self.set_model(session_id, model, effort or None)
            self.apply_modes(session_id, permission, work_mode, effort)
        return result

    def load_session(self, session_id: str, cwd: str) -> dict[str, Any]:
        result = self.request(
            "session/load",
            {"sessionId": session_id, "cwd": cwd, "mcpServers": [], "_meta": {"rules": language_rule()}},
            timeout=12,
        )
        if session_id:
            self.live_sessions.add(session_id)
            models_info = result.get("models") or {} if isinstance(result, dict) else {}
            current_model = models_info.get("currentModelId") or ""
            if current_model:
                self.session_models[session_id] = current_model
            catalog = models_info.get("availableModels") or []
            if catalog:
                self.model_catalog = catalog
        return result

    def apply_modes(
        self,
        session_id: str,
        permission: str,
        work_mode: str,
        effort: str | None = None,
        model: str | None = None,
    ) -> None:
        if work_mode == "plan":
            self._try_set_mode(session_id, "plan")
        else:
            mode_id = PERMISSIONS.get(permission, PERMISSIONS["ask"])["modeId"]
            if not self._try_set_mode(session_id, mode_id) and permission == "auto":
                self._try_set_mode(session_id, "acceptEdits")
        wants_model = model or STATE.get("model") or self.session_models.get(session_id)
        wants_effort = effort or STATE.get("effort") or ""
        if not wants_model:
            return
        if wants_model == self.session_models.get(session_id) and wants_effort == self.session_efforts.get(session_id):
            return
        if self.set_model(session_id, wants_model, wants_effort or None):
            if wants_effort:
                self.session_efforts[session_id] = wants_effort

    def set_model(self, session_id: str, model_id: str, effort: str | None = None) -> bool:
        """session/set_model 是唯一支持按会话切换模型 / 思考强度的入口（实测）。"""
        if not session_id or not model_id:
            return False
        params: dict[str, Any] = {"sessionId": session_id, "modelId": model_id}
        if effort:
            params["reasoningEffort"] = effort
        try:
            result = self.request("session/set_model", params, timeout=8)
        except Exception:
            return False
        meta = (result or {}).get("_meta") or {}
        ok_flag = meta.get("model")
        applied = model_id
        if isinstance(ok_flag, dict):
            applied = next(iter(ok_flag.values())) or model_id
        self.session_models[session_id] = str(applied)
        return True

    def apply_effort(self, session_id: str, effort: str) -> bool:
        model_id = self.session_models.get(session_id) or STATE.get("model") or "grok-4.6"
        ok = self.set_model(session_id, model_id, effort)
        if ok:
            self.session_efforts[session_id] = effort
        return ok

    def _try_set_mode(self, session_id: str, mode_id: str) -> bool:
        try:
            self.request("session/set_mode", {"sessionId": session_id, "modeId": mode_id}, timeout=8)
            return True
        except Exception:
            try:
                self.notify("session/set_mode", {"sessionId": session_id, "modeId": mode_id})
                return True
            except Exception:
                return False

    def prompt(self, session_id: str, text: str, images: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        blocks: list[dict[str, Any]] = []
        if text:
            blocks.append({"type": "text", "text": text})
        for img in images or []:
            mime = img.get("mime") or "image/png"
            data = img.get("data") or ""
            path = img.get("path") or ""
            if data:
                blocks.append({"type": "image", "mimeType": mime, "data": data})
            if path:
                blocks.append({"type": "text", "text": f"\n@{path}"})
        if not blocks:
            blocks.append({"type": "text", "text": "请看附图。"})
        return self.request(
            "session/prompt",
            {"sessionId": session_id, "prompt": blocks, "_meta": {"rules": language_rule()}},
            timeout=3600,
        )

    def cancel(self, session_id: str) -> None:
        self.notify("session/cancel", {"sessionId": session_id})

    def set_mode(self, session_id: str, mode_id: str) -> dict[str, Any]:
        return self.request("session/set_mode", {"sessionId": session_id, "modeId": mode_id}, timeout=10)

    def fork(self, session_id: str, cwd: str) -> dict[str, Any] | None:
        for method in ("x.ai/session/fork", "session/fork"):
            result = self.try_request(method, {"sessionId": session_id, "cwd": cwd}, timeout=20)
            if result:
                child = result.get("sessionId") or result.get("session_id")
                if child:
                    self.live_sessions.add(child)
                return result
        return None

    def rewind(self, session_id: str, prompt_index: int) -> dict[str, Any] | None:
        for method in ("x.ai/rewind", "x.ai/rewind/apply", "session/rewind"):
            result = self.try_request(
                method,
                {"sessionId": session_id, "promptIndex": prompt_index, "index": prompt_index},
                timeout=20,
            )
            if result is not None:
                return result or {"ok": True}
        return None

    def answer_permission(self, req_id: Any, option_id: str | None, cancelled: bool = False) -> None:
        if cancelled or not option_id:
            self.respond(req_id, {"outcome": {"outcome": "cancelled"}})
            return
        self.respond(req_id, {"outcome": {"outcome": "selected", "optionId": option_id}})


BUS = EventBus()
ACP = AcpBridge(BUS)
SIDE_BUS = EventBus()
SIDE_ACP = AcpBridge(SIDE_BUS)
STATE = load_state()
LOGIN_PROC: subprocess.Popen | None = None
CACHED = {"version": "", "models": ["grok-4.7", "grok-4.6"]}


def grok_version() -> str:
    return CACHED.get("version") or ""


def grok_models() -> list[str]:
    return CACHED.get("models") or ["grok-4.7", "grok-4.6"]


TERMINAL_HISTORY_LIMIT = 200_000
TERMINAL_INPUT_LIMIT = 32_768
TERMINALS_LOCK = threading.RLock()
TERMINALS: dict[str, "TerminalSession"] = {}


class TerminalSession:
    """单个本地 PowerShell 伪终端会话，只把输出发给订阅者，不写入服务日志。"""

    def __init__(self, session_id: str, cwd: str, rows: int = 32, cols: int = 120) -> None:
        self.session_id = session_id
        self.cwd = cwd
        self.rows = max(8, min(120, int(rows or 32)))
        self.cols = max(20, min(240, int(cols or 120)))
        self.shell = ""
        self.process: Any = None
        self.history = ""
        self.closed = False
        self.exit_code: int | None = None
        self._lock = threading.RLock()
        self._subscribers: set[queue.Queue] = set()

    def start(self) -> None:
        try:
            from winpty import PtyProcess
        except Exception as exc:
            raise RuntimeError("当前桌面版本缺少终端组件，请重新安装后重试") from exc
        shell = shutil.which("pwsh") or shutil.which("powershell.exe") or "powershell.exe"
        startup = (
            "$utf8=[System.Text.UTF8Encoding]::new($false); "
            "[Console]::InputEncoding=$utf8; [Console]::OutputEncoding=$utf8; "
            "$OutputEncoding=$utf8; Remove-Module PSReadLine -ErrorAction SilentlyContinue"
        )
        try:
            self.process = PtyProcess.spawn(
                [shell, "-NoLogo", "-NoProfile", "-NoExit", "-Command", startup],
                cwd=self.cwd,
                dimensions=(self.rows, self.cols),
            )
        except Exception as exc:
            raise RuntimeError(f"无法启动 PowerShell：{exc}") from exc
        self.shell = Path(shell).name
        threading.Thread(target=self._read_loop, daemon=True, name="webui-terminal-reader").start()

    def _publish(self, event: dict[str, Any]) -> None:
        with self._lock:
            subscribers = list(self._subscribers)
        for subscriber in subscribers:
            try:
                subscriber.put_nowait(event)
            except queue.Full:
                try:
                    subscriber.get_nowait()
                    subscriber.put_nowait(event)
                except Exception:
                    pass

    def _read_loop(self) -> None:
        try:
            while True:
                with self._lock:
                    process = self.process
                    if self.closed or process is None:
                        break
                try:
                    chunk = process.read(4096)
                except Exception as exc:
                    if isinstance(exc, (KeyboardInterrupt, SystemExit)):
                        raise
                    chunk = ""
                if isinstance(chunk, bytes):
                    chunk = chunk.decode("utf-8", "replace")
                if chunk:
                    self.append_output(str(chunk))
                    continue
                try:
                    alive = bool(process.isalive())
                except Exception:
                    alive = False
                if not alive:
                    break
                time.sleep(0.03)
        finally:
            with self._lock:
                if self.closed:
                    return
                self.closed = True
                process = self.process
                try:
                    self.exit_code = getattr(process, "exitstatus", None)
                except Exception:
                    self.exit_code = None
            self._publish({"type": "exit", "code": self.exit_code})

    def append_output(self, chunk: str) -> None:
        if not chunk:
            return
        with self._lock:
            self.history = (self.history + chunk)[-TERMINAL_HISTORY_LIMIT:]
        self._publish({"type": "output", "data": chunk})

    def subscribe(self) -> queue.Queue:
        subscriber: queue.Queue = queue.Queue(maxsize=256)
        with self._lock:
            self._subscribers.add(subscriber)
            snapshot = self.history
            closed = self.closed
            exit_code = self.exit_code
        try:
            subscriber.put_nowait({"type": "snapshot", "data": snapshot})
            if closed:
                subscriber.put_nowait({"type": "exit", "code": exit_code})
        except queue.Full:
            pass
        return subscriber

    def unsubscribe(self, subscriber: queue.Queue) -> None:
        with self._lock:
            self._subscribers.discard(subscriber)

    def write(self, data: str) -> None:
        value = str(data or "")[:TERMINAL_INPUT_LIMIT]
        if not value:
            return
        with self._lock:
            process = self.process
            if self.closed or process is None:
                raise RuntimeError("终端会话已关闭")
        try:
            process.write(value)
        except Exception as exc:
            raise RuntimeError("终端输入失败") from exc

    def interrupt(self) -> None:
        with self._lock:
            process = self.process
            if self.closed or process is None:
                return
        try:
            process.sendintr()
        except Exception:
            try:
                process.write("\u0003")
            except Exception:
                pass

    def resize(self, rows: int, cols: int) -> None:
        next_rows = max(8, min(120, int(rows)))
        next_cols = max(20, min(240, int(cols)))
        with self._lock:
            self.rows = next_rows
            self.cols = next_cols
            process = self.process
            if self.closed or process is None:
                return
        try:
            process.setwinsize(next_rows, next_cols)
        except Exception as exc:
            raise RuntimeError("终端尺寸调整失败") from exc

    def is_alive(self) -> bool:
        with self._lock:
            process = self.process
            if process is None or self.closed:
                return False
            try:
                return bool(process.isalive())
            except Exception:
                return False

    def close(self) -> None:
        with self._lock:
            if self.closed and self.process is None:
                return
            self.closed = True
            process = self.process
            self.process = None
        if process is not None:
            try:
                process.terminate(force=True)
            except Exception:
                pass
            try:
                process.close(force=True)
            except Exception:
                pass
        self._publish({"type": "exit", "code": self.exit_code})


def open_terminal_session(cwd: str, rows: int = 32, cols: int = 120) -> TerminalSession:
    with TERMINALS_LOCK:
        for session in TERMINALS.values():
            if session.is_alive():
                return session
        session_id = uuid.uuid4().hex
        session = TerminalSession(session_id, cwd, rows, cols)
        session.start()
        TERMINALS[session_id] = session
        return session


def get_terminal_session(session_id: str) -> TerminalSession | None:
    with TERMINALS_LOCK:
        return TERMINALS.get(str(session_id or ""))


def close_terminal_session(session_id: str) -> bool:
    with TERMINALS_LOCK:
        session = TERMINALS.pop(str(session_id or ""), None)
    if session is None:
        return False
    session.close()
    return True


def close_all_terminals() -> None:
    with TERMINALS_LOCK:
        sessions = list(TERMINALS.values())
        TERMINALS.clear()
    for session in sessions:
        session.close()


def run_grok(args: list[str], timeout: int = 60) -> tuple[bool, str]:
    """运行 grok CLI 子命令，返回 (是否成功, 输出文本)。"""
    try:
        out = subprocess.check_output(
            [grok_bin(), *args],
            text=True,
            timeout=timeout,
            stderr=subprocess.STDOUT,
            creationflags=NO_WINDOW,
        )
        return True, out.strip()
    except subprocess.CalledProcessError as exc:
        return False, (exc.output or "").strip() or f"退出码 {exc.returncode}"
    except Exception as exc:
        return False, str(exc)


def run_doctor() -> dict[str, Any]:
    """运行 grok doctor，并返回前端可直接展示的诊断状态。"""
    command = "grok doctor"
    try:
        result = subprocess.run(
            [grok_bin(), "doctor"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=20,
            creationflags=NO_WINDOW,
        )
        text = (result.stdout or "").strip()
        return {
            "ok": result.returncode == 0,
            "text": text,
            "exitCode": result.returncode,
            "command": command,
            "empty": not bool(text),
        }
    except subprocess.TimeoutExpired as exc:
        output = exc.output or ""
        if isinstance(output, bytes):
            output = output.decode("utf-8", "replace")
        text = str(output).strip()
        return {
            "ok": False,
            "text": text,
            "exitCode": None,
            "command": command,
            "empty": not bool(text),
            "error": "诊断超时，请稍后重试",
        }
    except Exception as exc:
        return {
            "ok": False,
            "text": "",
            "exitCode": None,
            "command": command,
            "empty": True,
            "error": str(exc),
        }


def grok_extensions(cwd: str | None = None) -> dict[str, Any]:
    """读取 Grok 已发现的扩展；只返回界面需要的非敏感字段。"""
    args = [grok_bin()]
    if cwd:
        args.extend(["--cwd", normalize_cwd(cwd)])
    args.extend(["inspect", "--json"])
    try:
        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30,
            creationflags=NO_WINDOW,
        )
        if result.returncode:
            raise RuntimeError(result.stderr.decode("utf-8", "replace").strip() or f"退出码 {result.returncode}")
        data = json.loads(result.stdout.decode("utf-8", "replace"))
    except Exception as exc:
        return {"ok": False, "error": str(exc), "skills": [], "plugins": [], "mcpServers": []}

    def text(value: Any, limit: int = 240) -> str:
        return str(value or "").strip()[:limit]

    def source_label(value: Any) -> str:
        """将 inspect 的来源对象收敛为简洁标签，不把本地路径送到界面。"""
        if isinstance(value, dict):
            return text(value.get("type") or value.get("scope") or "本地", 40)
        return text(value, 40)

    skills = [
        {
            "name": text(item.get("name"), 96),
            "description": text(item.get("description"), 240),
            "source": source_label(item.get("source")),
            "disabled": bool(item.get("disabled", False)),
            "invocableAs": text(item.get("invocableAs"), 120),
        }
        for item in (data.get("skills") or [])
        if isinstance(item, dict) and text(item.get("name"), 96)
    ]
    plugins = [
        {
            "name": text(item.get("name"), 96),
            "scope": text(item.get("scope"), 80),
            "enabled": bool(item.get("enabled", False)),
            "provides": [text(v, 80) for v in (item.get("provides") or []) if text(v, 80)][:12],
        }
        for item in (data.get("plugins") or [])
        if isinstance(item, dict) and text(item.get("name"), 96)
    ]
    mcp_servers = [
        {
            "name": text(item.get("name"), 96),
            "source": source_label(item.get("source") or item.get("scope")),
            "enabled": bool(item.get("enabled", True)),
            "transport": text(item.get("transport"), 40),
            "toolCount": len(item.get("tools") or []) if isinstance(item.get("tools"), list) else 0,
        }
        for item in (data.get("mcpServers") or [])
        if isinstance(item, dict) and text(item.get("name"), 96)
    ]
    return {"ok": True, "skills": skills, "plugins": plugins, "mcpServers": mcp_servers, "refreshedAt": int(time.time())}


def set_skill_enabled(name: str, enabled: bool) -> None:
    """只更新 [skills] 的 disabled 清单，保留该节其余设置。"""
    skill_name = str(name or "").strip()
    if not skill_name:
        raise RuntimeError("缺少 Skill 名称")
    current = load_toml().get("skills") or {}
    disabled = [str(v) for v in (current.get("disabled") or []) if str(v).strip()]
    disabled = [v for v in disabled if v != skill_name] if enabled else list(dict.fromkeys([*disabled, skill_name]))
    replacement = "disabled = [" + ", ".join(toml_str(v) for v in disabled) + "]"
    lines = load_config_text().splitlines()
    start = next((i for i, line in enumerate(lines) if line.strip() == "[skills]"), None)
    if start is None:
        if lines and lines[-1].strip():
            lines.append("")
        lines.extend(["[skills]", replacement])
    else:
        end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("[")), len(lines))
        key_line = next((i for i in range(start + 1, end) if re.match(r"^\s*disabled\s*=", lines[i])), None)
        if key_line is None:
            lines.insert(end, replacement)
        else:
            lines[key_line] = replacement
    save_config_text("\n".join(lines).rstrip() + "\n")


def install_skill(source_path: str) -> str:
    """将本地 Skill 文件夹安全复制到当前 Grok 的发现目录。"""
    raw = str(source_path or "").strip()
    if not raw:
        raise RuntimeError("缺少 Skill 文件夹路径")
    requested = Path(raw).expanduser()
    if requested.is_symlink():
        raise RuntimeError("不支持通过符号链接添加 Skill")
    try:
        source = requested.resolve(strict=True)
    except FileNotFoundError as exc:
        raise RuntimeError("Skill 文件夹不存在") from exc
    if not source.is_dir():
        raise RuntimeError("请选择 Skill 文件夹")
    if not (source / "SKILL.md").is_file():
        raise RuntimeError("Skill 文件夹内必须包含 SKILL.md")

    name = source.name.strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,95}", name):
        raise RuntimeError("Skill 文件夹名称只能包含字母、数字、点、下划线或短横线")
    target_root = (GROK_HOME / "skills").resolve()
    target_root.mkdir(parents=True, exist_ok=True)
    target = (target_root / name).resolve()
    if target == source:
        raise RuntimeError("该 Skill 已在 Grok 目录中")
    if target.exists():
        raise RuntimeError("已存在同名 Skill，请先更换文件夹名称")

    for base, directories, files in os.walk(source, followlinks=False):
        for child in [*directories, *files]:
            if (Path(base) / child).is_symlink():
                raise RuntimeError("Skill 文件夹内不能包含符号链接")
    try:
        shutil.copytree(source, target, symlinks=False)
    except FileExistsError as exc:
        raise RuntimeError("已存在同名 Skill，请先更换文件夹名称") from exc
    except OSError as exc:
        raise RuntimeError(f"复制 Skill 失败：{exc}") from exc
    return name


def refresh_grok_meta() -> None:
    try:
        out = subprocess.check_output([grok_bin(), "--version"], text=True, timeout=8, stderr=subprocess.STDOUT, creationflags=NO_WINDOW)
        CACHED["version"] = out.strip().splitlines()[0]
    except Exception:
        CACHED["version"] = ""
    try:
        out = subprocess.check_output([grok_bin(), "models"], text=True, timeout=12, stderr=subprocess.STDOUT, creationflags=NO_WINDOW)
        models = []
        for line in out.splitlines():
            s = line.strip().lstrip("*").lstrip("-").strip()
            if s.startswith("grok-"):
                models.append(s.split()[0])
        CACHED["models"] = list(dict.fromkeys(["grok-4.7", *models]))
    except Exception:
        CACHED["models"] = ["grok-4.7", "grok-4.6"]


def ensure_agent() -> None:
    if not ACP.alive():
        ACP.ready.clear()
        threading.Thread(target=lambda: ACP.start(STATE.get("effort")), daemon=True, name="acp-start").start()
    if not ACP.ready.wait(timeout=25):
        raise RuntimeError(ACP.error or "Grok 还没准备好，请再试一次")


def save_prompt_images(cwd: str, images: list[Any]) -> list[dict[str, Any]]:
    saved: list[dict[str, Any]] = []
    if not images:
        return saved
    folder = Path(cwd) / ".grok-webui-pastes"
    folder.mkdir(parents=True, exist_ok=True)
    ignore = folder / ".gitignore"
    if not ignore.exists():
        ignore.write_text("*\n", encoding="utf-8")
    stamp = time.strftime("%Y%m%d-%H%M%S")
    for i, item in enumerate(images[:8], start=1):
        if not isinstance(item, dict):
            continue
        mime = str(item.get("mime") or "image/png").lower()
        if not mime.startswith("image/"):
            continue
        ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/webp": ".webp", "image/gif": ".gif"}.get(mime, ".png")
        raw_name = str(item.get("name") or f"paste-{stamp}-{i}{ext}")
        raw_name = re.sub(r"[^A-Za-z0-9._-]+", "_", raw_name)
        if not raw_name.lower().endswith(ext):
            raw_name += ext
        data = str(item.get("data") or "")
        if data.startswith("data:"):
            data = data.split(",", 1)[-1]
        data = re.sub(r"\s+", "", data)
        if not data:
            continue
        try:
            blob = base64.b64decode(data, validate=False)
        except Exception:
            continue
        if not blob or len(blob) > 12 * 1024 * 1024:
            continue
        path = folder / raw_name
        n = 1
        while path.exists():
            path = folder / f"{path.stem}-{n}{path.suffix}"
            n += 1
        path.write_bytes(blob)
        rel = str(Path(".grok-webui-pastes") / path.name)
        saved.append({"name": path.name, "mime": mime, "data": data, "path": rel})
    return saved


def wrap_prompt(text: str, work_mode: str) -> str:
    stripped = text.strip()
    if work_mode == "goal" and not stripped.startswith("/"):
        return f"/goal {stripped}"
    if work_mode == "plan" and not stripped.startswith("/"):
        return stripped
    return stripped


class Handler(BaseHTTPRequestHandler):
    server_version = "GrokZhWebUI/0.2"

    def log_message(self, fmt: str, *args: Any) -> None:
        if sys.stderr is None:
            return
        sys.stderr.write("[webui] " + (fmt % args) + "\n")

    def _send(self, code: int, body: Any, content_type: str = "application/json; charset=utf-8") -> None:
        if isinstance(body, (dict, list)):
            raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str):
            raw = body.encode("utf-8")
        else:
            raw = body
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _static(self, rel: str) -> None:
        path = (STATIC_DIR / rel).resolve()
        if STATIC_DIR not in path.parents and path != STATIC_DIR:
            self._send(403, {"error": "拒绝访问"})
            return
        if not path.exists() or not path.is_file():
            self._send(404, {"error": "没有这个文件"})
            return
        suffix = path.suffix.lower()
        types = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".json": "application/json; charset=utf-8",
        }
        self._send(200, path.read_bytes(), types.get(suffix, "application/octet-stream"))

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        if path in ("/", "/index.html"):
            self._static("index.html")
            return
        if path.startswith("/static/"):
            self._static(path[len("/static/") :])
            return
        if path in ("/app.js", "/styles.css", "/help.js", "/i18n.js", "/logo.svg", "/logo-mark.svg", "/favicon.svg", "/logo-mark.png", "/grok-orbit.png", "/favicon.png"):
            self._static(path.lstrip("/"))
            return
        if path == "/favicon.ico":
            self._static("favicon.png")
            return
        if path == "/api/status":
            self._send(
                200,
                {
                    "grok": grok_bin(),
                    "version": grok_version(),
                    "agentAlive": ACP.alive(),
                    "agentReady": ACP.ready.is_set(),
                    "error": ACP.error,
                    "backend": "acp-noleader",
                    "turn": BUS.snapshot(),
                    "cwd": STATE.get("cwd"),
                    "permission": STATE.get("permission") or "ask",
                    "workMode": STATE.get("workMode") or "agent",
                    "mode": STATE.get("mode") or "ask",
                    "effort": STATE.get("effort") or "high",
                    "theme": STATE.get("theme") or "",
                    "showThinking": bool(STATE.get("showThinking", True)),
                    "previewOpen": bool(STATE.get("previewOpen", False)),
                    "closeAction": STATE.get("closeAction") or "tray",
                    "lang": STATE.get("lang") or "zh-CN",
                    "workStyle": STATE.get("workStyle") or "harness",
                    "settings": normalize_settings(STATE.get("settings")),
                    "user": load_account(),
                    "models": grok_models(),
                    "model": STATE.get("model") or "grok-4.7",
                    "providerSource": provider_source_for_model(STATE.get("model") or "grok-4.7"),
                    "customModels": [
                        {
                            "id": item.get("id"),
                            "model": item.get("model"),
                            "name": item.get("name"),
                            "baseUrl": item.get("baseUrl"),
                            "apiBackend": item.get("apiBackend"),
                            "contextWindow": item.get("contextWindow"),
                            "hasKey": bool(item.get("hasKey")),
                        }
                        for item in list_custom_models()
                    ],
                    "modelCatalog": ACP.model_catalog,
                    "sessionModels": ACP.session_models,
                    "efforts": EFFORTS,
                    "permissions": PERMISSIONS,
                    "init": ACP.init_result,
                },
            )
            return
        if path == "/api/sessions":
            archived = query.get("archived") in ("1", "true", "yes")
            self._send(
                200,
                {
                    "sessions": list_sessions(
                        query.get("cwd") if query.get("filter") == "cwd" else None,
                        archived=archived,
                    )
                },
            )
            return
        if path == "/api/automations":
            self._send(200, {"tasks": list_automations()})
            return
        if path == "/api/me":
            self._send(200, load_account())
            return
        if path == "/api/usage/summary":
            self._send(200, weekly_usage())
            return
        if path.startswith("/api/usage/session/"):
            sid = path.split("/api/usage/session/", 1)[1]
            self._send(200, session_usage(sid))
            return
        if path == "/api/memory":
            self._send(200, memory_files())
            return
        if path.startswith("/api/history/"):
            sid = path.split("/api/history/", 1)[1]
            folder = find_session_folder(sid)
            summary = read_summary(folder) if folder else None
            preview = extract_preview(sid)
            messages = reconstruct_history(sid)
            self._send(
                200,
                {
                    "session": summary,
                    "messages": messages,
                    "preview": preview,
                },
            )
            return
        if path.startswith("/api/preview/"):
            sid = path.split("/api/preview/", 1)[1]
            self._send(200, extract_preview(sid))
            return
        if path == "/api/browse":
            self._send(200, browse_path(query.get("path")))
            return
        if path == "/api/events":
            self._sse()
            return
        if path == "/api/terminal/events":
            self._terminal_sse(query.get("id") or "")
            return
        if path == "/api/turn":
            self._send(200, BUS.snapshot())
            return
        if path == "/api/side-chat/turn":
            self._send(200, SIDE_BUS.snapshot())
            return
        if path == "/api/grok/plugins":
            action_args = query.get("args", "")
            if action_args:
                ok, text = run_grok(["plugin", "list"] + action_args.split(), timeout=30)
            else:
                ok, text = run_grok(["plugin", "list"], timeout=30)
            self._send(200, {"ok": ok, "text": text})
            return
        if path == "/api/grok/mcp":
            ok, text = run_grok(["mcp", "list"], timeout=30)
            self._send(200, {"ok": ok, "text": text})
            return
        if path == "/api/grok/extensions":
            self._send(200, grok_extensions(query.get("cwd")))
            return
        if path == "/api/market/sources":
            self._send(200, {"ok": True, "sources": load_market_sources()})
            return
        if path == "/api/market/list":
            source_id = str(query.get("source") or "").strip()
            if source_id:
                source = next((item for item in load_market_sources() if item["id"] == source_id), None)
                if not source:
                    self._send(404, {"ok": False, "error": "找不到这个第三方市场"})
                    return
                try:
                    parsed = parse_market_plugins(fetch_market_json(source["url"]))
                except Exception:
                    self._send(502, {"ok": False, "items": [], "error": "第三方市场加载失败，请检查地址或网络"})
                    return
                items = [
                    {
                        **item,
                        "market": "source:" + source["id"],
                        "sourceId": source["id"],
                        "marketName": source["name"],
                    }
                    for item in parsed
                ]
                self._send(200, {"ok": True, "items": items, "errors": []})
                return
            items = []
            errors = []
            # 1. Claude Code 官方市场
            try:
                data = fetch_market_json("https://raw.githubusercontent.com/anthropics/claude-code/main/.claude-plugin/marketplace.json")
                parsed = parse_market_plugins(data)
                for it in parsed:
                    it["market"] = "claude"
                items.extend(parsed)
            except Exception as exc:
                errors.append(f"claude: {exc}")
            self._send(200, {"ok": True, "items": items, "errors": errors})
            return
        if path == "/api/config":
            self._send(
                200,
                {
                    "memoryEnabled": get_memory_enabled(),
                    "autoUpdateTui": get_auto_update_tui(),
                    "customModels": list_custom_models(),
                },
            )
            return
        if path == "/api/account":
            acct = load_account()
            self._send(200, {"ok": True, "account": acct, "loggedIn": bool(acct.get("email") or acct.get("userId"))})
            return
        if path == "/api/provider":
            self._send(200, {"customModels": list_custom_models()})
            return
        if path == "/api/doctor":
            self._send(200, run_doctor())
            return
        if path.startswith("/api/export/"):
            sid = path.split("/api/export/", 1)[1]
            msgs = reconstruct_history(sid)
            title = (read_summary(find_session_folder(sid) or Path()) or {}).get("title") or sid
            lines = [f"# {title}", ""]
            for msg in msgs:
                who = "User" if msg.get("role") == "user" else "Grok"
                lines.append(f"## {who}")
                lines.append("")
                lines.append(msg.get("text") or "")
                lines.append("")
            self._send(200, {"markdown": "\n".join(lines), "title": title})
            return
        self._send(404, {"error": "没有这个接口"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == "/api/voice/transcribe":
            origin = self.headers.get("Origin")
            host = self.headers.get("Host") or ""
            if origin and urlparse(origin).netloc.casefold() != host.casefold():
                self._send(403, {"error": "拒绝跨站语音请求。"})
                return
            content_type = (self.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
            if content_type != "application/octet-stream":
                self._send(415, {"error": "语音数据格式不正确。"})
                return
            try:
                length = int(self.headers.get("Content-Length") or "0")
            except ValueError:
                length = 0
            if length <= 0:
                self._send(400, {"error": "没有录到有效的语音数据。"})
                return
            if length > VOICE_MAX_PCM_BYTES:
                self._send(413, {"error": "录音超过 3 分钟上限，请分段录入。"})
                return
            pcm = self.rfile.read(length)
            if len(pcm) != length:
                self._send(400, {"error": "语音数据不完整，请重试。"})
                return
            keyterms: list[str] = []
            encoded_keyterms = self.headers.get("X-Voice-Keyterms") or ""
            if encoded_keyterms:
                try:
                    decoded = json.loads(base64.b64decode(encoded_keyterms, validate=True).decode("utf-8"))
                    if isinstance(decoded, list):
                        keyterms = decoded
                except (ValueError, UnicodeDecodeError):
                    pass
            try:
                text = transcribe_voice_pcm(pcm, self.headers.get("X-Voice-Language") or "", keyterms)
            except RuntimeError as exc:
                self._send(502, {"error": str(exc)})
                return
            except Exception:
                self._send(502, {"error": "Grok 语音识别暂时不可用，请重试。"})
                return
            self._send(200, {"ok": True, "text": text})
            return
        try:
            body = self._read_json()
        except Exception:
            self._send(400, {"error": "请求不是合法 JSON"})
            return
        try:
            if path == "/api/market/sources":
                action = str(body.get("action") or "add").strip().lower()
                sources = load_market_sources()
                if action == "remove":
                    source_id = str(body.get("id") or "").strip()
                    kept = [item for item in sources if item["id"] != source_id]
                    if not source_id or len(kept) == len(sources):
                        raise RuntimeError("找不到这个第三方市场")
                    save_market_sources(kept)
                    self._send(200, {"ok": True, "sources": kept})
                    return
                if action != "add":
                    raise RuntimeError("不支持的市场操作")
                url = normalize_market_url(body.get("url"))
                try:
                    data = fetch_market_json(url)
                    items = parse_market_plugins(data)
                except Exception as exc:
                    raise RuntimeError("第三方市场清单加载失败，请检查地址、网络或 JSON 格式") from exc
                if not items:
                    raise RuntimeError("清单中没有可用插件")
                existing = next((item for item in sources if item["url"] == url), None)
                if existing:
                    source = existing
                else:
                    if len(sources) >= 24:
                        raise RuntimeError("最多保存 24 个第三方市场")
                    source = {
                        "id": uuid.uuid4().hex[:12],
                        "name": str(body.get("name") or market_source_name(data, url)).strip()[:80],
                        "url": url,
                    }
                    if not source["name"]:
                        source["name"] = market_source_name(data, url)
                    sources.append(source)
                    save_market_sources(sources)
                tagged = [
                    {
                        **item,
                        "market": "source:" + source["id"],
                        "sourceId": source["id"],
                        "marketName": source["name"],
                    }
                    for item in items
                ]
                self._send(200, {"ok": True, "source": source, "sources": sources, "items": tagged})
                return
            if path == "/api/state":
                if body.get("cwd"):
                    STATE["cwd"] = normalize_cwd(body["cwd"])
                if body.get("permission") in PERMISSIONS:
                    STATE["permission"] = body["permission"]
                    STATE["mode"] = body["permission"]
                if body.get("workMode") in ("agent", "plan", "goal"):
                    STATE["workMode"] = body["workMode"]
                    if body["workMode"] == "plan":
                        STATE["mode"] = "plan"
                if body.get("mode") in ("ask", "auto", "plan", "always", "full"):
                    STATE["mode"] = body["mode"]
                    if body["mode"] == "plan":
                        STATE["workMode"] = "plan"
                    elif body["mode"] in ("always", "full"):
                        STATE["permission"] = "full"
                    elif body["mode"] in ("ask", "auto"):
                        STATE["permission"] = body["mode"]
                if body.get("effort") in {e["id"] for e in EFFORTS}:
                    STATE["effort"] = body["effort"]
                if isinstance(body.get("model"), str) and body["model"].strip():
                    STATE["model"] = body["model"].strip()
                if body.get("theme") in ("grok-night", "grok-day", "tokyo-night", "graphite", "high-contrast", "oceanic", "sage", "sunset", "violet-night", "light", "dark"):
                    STATE["theme"] = {"light": "grok-day", "dark": "grok-night"}.get(body["theme"], body["theme"])
                if body.get("workStyle") in ("harness", "classic"):
                    STATE["workStyle"] = body["workStyle"]
                next_lang = "zh-TW-TW" if body.get("lang") == "zh-TW" else body.get("lang")
                if next_lang in LANG_IDS:
                    STATE["lang"] = next_lang
                if "showThinking" in body:
                    STATE["showThinking"] = bool(body["showThinking"])
                if "previewOpen" in body:
                    STATE["previewOpen"] = bool(body["previewOpen"])
                if body.get("closeAction") in ("tray", "exit"):
                    STATE["closeAction"] = body["closeAction"]
                if isinstance(body.get("webSearch"), bool):
                    STATE["webSearch"] = body["webSearch"]
                if isinstance(body.get("settings"), dict):
                    STATE["settings"] = normalize_settings({**normalize_settings(STATE.get("settings")), **body["settings"]})
                save_state(STATE)
                sid = body.get("sessionId") or BUS.session_id
                if sid and ACP.alive() and sid in ACP.live_sessions:
                    ACP.apply_modes(sid, STATE["permission"], STATE["workMode"], STATE.get("effort"))
                self._send(200, {"ok": True, "state": STATE})
                return
            if path == "/api/session":
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                STATE["cwd"] = cwd
                save_state(STATE)
                ensure_agent()
                created = ACP.new_session(
                    cwd,
                    STATE.get("permission") or "ask",
                    STATE.get("workMode") or "agent",
                    body.get("model"),
                    STATE.get("effort") or "high",
                )
                sid = created.get("sessionId") or created.get("session_id")
                self._send(200, {"ok": True, "sessionId": sid, "result": created})
                return
            if path == "/api/session/load":
                ensure_agent()
                sid = body.get("sessionId")
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                try:
                    ACP.load_session(sid, cwd)
                    ACP.apply_modes(sid, STATE.get("permission") or "ask", STATE.get("workMode") or "agent", STATE.get("effort"))
                    self._send(200, {"ok": True, "loaded": True, "sessionId": sid})
                except Exception as exc:
                    self._send(200, {"ok": False, "loaded": False, "sessionId": sid, "error": str(exc)})
                return
            if path == "/api/session/delete":
                sid = body.get("sessionId")
                if not sid:
                    raise RuntimeError("缺少 sessionId")
                if sid == BUS.session_id:
                    try:
                        ACP.cancel(sid)
                    except Exception:
                        pass
                    ACP.live_sessions.discard(sid)
                if not delete_session(str(sid)):
                    raise RuntimeError("删除失败：找不到会话或文件仍被占用")
                invalidate_session_index()
                self._send(200, {"ok": True, "deleted": True, "sessionId": sid})
                return
            if path == "/api/sessions/purge-archived":
                rows = [r for r in session_index(force=True)["rows"] if r.get("archived")]
                removed = 0
                for row in rows:
                    try:
                        if delete_session(str(row.get("id") or "")):
                            removed += 1
                    except Exception:
                        pass
                invalidate_session_index()
                self._send(200, {"ok": True, "removed": removed})
                return
            if path == "/api/session/archive":
                sid = body.get("sessionId")
                archived = parse_bool(body.get("archived", True), True)
                if not sid:
                    raise RuntimeError("缺少 sessionId")
                folder = find_session_folder(sid)
                if not folder:
                    raise RuntimeError("找不到对话")
                patch_summary(folder, archived=archived, webui_archived=archived)
                invalidate_session_index()
                self._send(200, {"ok": True, "sessionId": sid, "archived": archived})
                return
            if path == "/api/session/rename":
                sid = body.get("sessionId")
                title = (body.get("title") or "").strip()
                if not sid or not title:
                    raise RuntimeError("缺少标题")
                folder = find_session_folder(sid)
                if not folder:
                    raise RuntimeError("找不到对话")
                patch_summary(folder, generated_title=title, title_is_manual=True, session_summary=title)
                invalidate_session_index()
                self._send(200, {"ok": True, "title": title})
                return
            if path == "/api/session/fork":
                sid = body.get("sessionId")
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                until = body.get("untilPrompt")
                ensure_agent()
                child = None
                if not until:
                    result = ACP.fork(sid, cwd)
                    child = (result or {}).get("sessionId") or (result or {}).get("session_id")
                if not child:
                    child = fork_session_files(sid, until)
                    try:
                        ACP.load_session(child, cwd)
                    except Exception:
                        pass
                invalidate_session_index()
                self._send(200, {"ok": True, "sessionId": child, "parentId": sid})
                return
            if path == "/api/session/rewind":
                sid = body.get("sessionId")
                index = int(body.get("promptIndex") or 0)
                if not sid or index <= 0:
                    raise RuntimeError("缺少回退位置")
                ensure_agent()
                result = ACP.rewind(sid, index)
                if result is None:
                    child = fork_session_files(sid, index)
                    try:
                        ACP.load_session(child, normalize_cwd(body.get("cwd") or STATE.get("cwd")))
                    except Exception:
                        pass
                    self._send(200, {"ok": True, "sessionId": child, "forked": True})
                    return
                self._send(200, {"ok": True, "sessionId": sid, "result": result})
                return
            if path == "/api/prompt":
                text = (body.get("text") or "").strip()
                images_in = body.get("images") if isinstance(body.get("images"), list) else []
                if not text and not images_in:
                    raise RuntimeError("缺少对话内容")
                ensure_agent()
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                permission = body.get("permission") or STATE.get("permission") or "ask"
                work_mode = body.get("workMode") or STATE.get("workMode") or "agent"
                model = body.get("model")
                effort = body.get("effort") or STATE.get("effort") or "high"
                saved_images = save_prompt_images(cwd, images_in)
                if saved_images and not text:
                    text = "请看附图。"
                sid = body.get("sessionId")
                if sid and sid not in ACP.live_sessions:
                    try:
                        ACP.load_session(sid, cwd)
                        ACP.apply_modes(sid, permission, work_mode, effort)
                    except Exception:
                        sid = ""
                if not sid:
                    created = ACP.new_session(cwd, permission, work_mode, model, effort)
                    sid = created.get("sessionId") or created.get("session_id")
                    if not sid:
                        raise RuntimeError("没能建起新对话")
                else:
                    ACP.apply_modes(sid, permission, work_mode, effort)
                BUS.reset_turn()
                BUS.session_id = sid
                BUS.emit({"type": "session_ready", "sessionId": sid})
                prompt_text = wrap_prompt(text, work_mode)

                def _run(active_id: str, prompt_text_inner: str, imgs: list[dict[str, Any]]) -> None:
                    try:
                        ACP.prompt(active_id, prompt_text_inner, imgs)
                        BUS.emit({"type": "turn_end", "sessionId": active_id})
                    except Exception as exc:
                        sys.stderr.write(f"[webui] prompt error: {exc}\n")
                        BUS.emit({"type": "error", "sessionId": active_id, "message": str(exc)})

                threading.Thread(target=_run, args=(sid, prompt_text, saved_images), daemon=True, name="prompt").start()
                self._send(200, {"ok": True, "sessionId": sid, "running": True, "images": [{"path": i.get("path"), "name": i.get("name")} for i in saved_images]})
                return
            if path == "/api/side-chat/prompt":
                text = (body.get("text") or "").strip()
                if not text:
                    raise RuntimeError("缺少对话内容")
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                if not os.path.isdir(cwd):
                    raise RuntimeError("项目文件夹不存在")
                SIDE_ACP.start(body.get("effort") or STATE.get("effort"))
                if not SIDE_ACP.ready.wait(20):
                    raise RuntimeError(SIDE_ACP.error or "侧边聊天服务未就绪")
                sid = body.get("sessionId") or ""
                if sid and sid not in SIDE_ACP.live_sessions:
                    try:
                        SIDE_ACP.load_session(sid, cwd)
                    except Exception:
                        sid = ""
                if not sid:
                    created = SIDE_ACP.new_session(cwd, "ask", "agent", body.get("model"), body.get("effort") or STATE.get("effort"))
                    sid = created.get("sessionId") or created.get("session_id") or ""
                if not sid:
                    raise RuntimeError("没能建起侧边聊天")
                SIDE_BUS.reset_turn()
                SIDE_BUS.session_id = sid
                SIDE_BUS.emit({"type": "session_ready", "sessionId": sid})
                def _side_run(active_id: str, prompt: str) -> None:
                    try:
                        SIDE_ACP.prompt(active_id, prompt)
                        SIDE_BUS.emit({"type": "turn_end", "sessionId": active_id})
                    except Exception as exc:
                        SIDE_BUS.emit({"type": "error", "sessionId": active_id, "message": str(exc)})
                threading.Thread(target=_side_run, args=(sid, text), daemon=True, name="side-chat").start()
                self._send(200, {"ok": True, "sessionId": sid, "running": True})
                return
            if path == "/api/terminal/open":
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                if not os.path.isdir(cwd):
                    raise RuntimeError("项目文件夹不存在")
                try:
                    rows = int(body.get("rows") or 32)
                    cols = int(body.get("cols") or 120)
                except (TypeError, ValueError) as exc:
                    raise RuntimeError("终端尺寸无效") from exc
                session = open_terminal_session(cwd, rows, cols)
                self._send(
                    200,
                    {
                        "ok": True,
                        "id": session.session_id,
                        "cwd": session.cwd,
                        "rows": session.rows,
                        "cols": session.cols,
                        "shell": session.shell,
                    },
                )
                return
            if path == "/api/terminal/input":
                session = get_terminal_session(str(body.get("id") or ""))
                if session is None:
                    raise RuntimeError("找不到终端会话")
                data = body.get("data")
                if body.get("interrupt") or data == "\u0003":
                    session.interrupt()
                elif isinstance(data, str):
                    session.write(data)
                else:
                    raise RuntimeError("终端输入无效")
                self._send(200, {"ok": True})
                return
            if path == "/api/terminal/resize":
                session = get_terminal_session(str(body.get("id") or ""))
                if session is None:
                    raise RuntimeError("找不到终端会话")
                try:
                    session.resize(int(body.get("rows") or 32), int(body.get("cols") or 120))
                except (TypeError, ValueError) as exc:
                    raise RuntimeError("终端尺寸无效") from exc
                self._send(200, {"ok": True, "rows": session.rows, "cols": session.cols})
                return
            if path == "/api/terminal/close":
                session_id = str(body.get("id") or "")
                if not close_terminal_session(session_id):
                    raise RuntimeError("找不到终端会话")
                self._send(200, {"ok": True, "closed": True, "id": session_id})
                return
            if path == "/api/browser/open":
                self._send(501, {"ok": False, "supported": False, "error": "当前版本不支持内置浏览器"})
                return
            if path == "/api/cancel":
                try:
                    ACP.cancel(body.get("sessionId") or BUS.session_id)
                except Exception:
                    pass
                BUS.emit({"type": "turn_end", "sessionId": body.get("sessionId")})
                self._send(200, {"ok": True})
                return
            if path == "/api/mode":
                ensure_agent()
                sid = body.get("sessionId") or BUS.session_id
                permission = body.get("permission") or STATE.get("permission")
                work_mode = body.get("workMode") or STATE.get("workMode")
                if body.get("permission") in PERMISSIONS:
                    STATE["permission"] = body["permission"]
                if body.get("workMode") in ("agent", "plan", "goal"):
                    STATE["workMode"] = body["workMode"]
                save_state(STATE)
                if sid:
                    ACP.apply_modes(sid, STATE["permission"], STATE["workMode"], STATE.get("effort"))
                self._send(200, {"ok": True, "permission": STATE["permission"], "workMode": STATE["workMode"]})
                return
            if path == "/api/effort":
                effort = body.get("effort")
                if effort not in {e["id"] for e in EFFORTS}:
                    raise RuntimeError("不支持的思考强度")
                STATE["effort"] = effort
                save_state(STATE)
                sid = body.get("sessionId") or BUS.session_id
                if sid and ACP.alive():
                    ACP.apply_effort(sid, effort)
                self._send(200, {"ok": True, "effort": effort})
                return
            if path == "/api/model":
                model = (body.get("model") or "").strip()
                if not model:
                    raise RuntimeError("缺少模型")
                STATE["model"] = model
                save_state(STATE)
                sid = body.get("sessionId") or BUS.session_id
                applied = False
                if sid and ACP.alive():
                    applied = ACP.set_model(sid, model)
                self._send(200, {"ok": True, "model": model, "applied": applied})
                return
            if path == "/api/memory":
                mem_path = body.get("path") or ""
                text = body.get("text")
                if not mem_path or not isinstance(text, str):
                    raise RuntimeError("缺少记忆文件路径或内容")
                write_memory_file(mem_path, text)
                self._send(200, {"ok": True})
                return
            if path == "/api/config":
                if isinstance(body.get("memoryEnabled"), bool):
                    set_memory_enabled(body["memoryEnabled"])
                    threading.Thread(
                        target=lambda: ACP.restart(STATE.get("effort")),
                        daemon=True,
                        name="acp-restart",
                    ).start()
                if isinstance(body.get("autoUpdateTui"), bool):
                    set_auto_update_tui(body["autoUpdateTui"])
                self._send(
                    200,
                    {
                        "ok": True,
                        "memoryEnabled": get_memory_enabled(),
                        "autoUpdateTui": get_auto_update_tui(),
                    },
                )
                return
            if path == "/api/provider":
                action = body.get("action") or "save"
                if action == "remove":
                    model_id = str(body.get("modelId") or "").strip()
                    if not model_id:
                        raise RuntimeError("缺少模型 ID")
                    remove_custom_model(model_id)
                else:
                    save_custom_model(body)
                refresh_grok_meta()

                def _restart() -> None:
                    try:
                        ACP.restart(STATE.get("effort"))
                    except Exception:
                        pass

                threading.Thread(target=_restart, daemon=True, name="acp-restart").start()
                self._send(200, {"ok": True, "customModels": list_custom_models(), "reloading": True})
                return
            if path == "/api/market/translate":
                q = str(body.get("q") or "").strip()
                if not q:
                    self._send(200, {"ok": True, "text": ""})
                    return
                target_languages = {
                    "zh-CN": "zh-CN",
                    "zh-TW": "zh-TW",
                    "zh-TW-TW": "zh-TW",
                    "zh-HK": "zh-TW",
                    "en": "en",
                    "ja": "ja",
                    "de": "de",
                    "fr": "fr",
                    "es": "es",
                    "ko": "ko",
                }
                requested_language = str(body.get("language") or "zh-CN")
                target_language = target_languages.get(requested_language)
                if target_language is None:
                    self._send(200, {"ok": False, "text": "", "error": "不支持的目标语言"})
                    return
                cache_path = WEBUI_DIR / "market-translations.json"
                cache = read_json(cache_path) or {}
                cache_language = "zh" if target_language == "zh-CN" else target_language
                key = cache_language + ":" + q
                if key in cache:
                    self._send(200, {"ok": True, "text": cache[key], "cached": True})
                    return
                import urllib.parse as _up
                import urllib.request as _uq

                text = ""
                gtx = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + target_language + "&dt=t&q=" + _up.quote(q[:600])
                try:
                    req = _uq.Request(gtx, headers={"User-Agent": "Mozilla/5.0"})
                    with _uq.urlopen(req, timeout=3) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                    text = "".join(seg[0] for seg in (data[0] or []) if seg and seg[0])
                except Exception:
                    pass
                if not text:
                    # 备用源（国内可达），失败则返回英文原文
                    try:
                        mm = "https://api.mymemory.translated.net/get?q=" + _up.quote(q[:500]) + "&langpair=en|" + target_language
                        req = _uq.Request(mm, headers={"User-Agent": "Mozilla/5.0"})
                        with _uq.urlopen(req, timeout=6) as resp:
                            data = json.loads(resp.read().decode("utf-8"))
                        text = str((data.get("responseData") or {}).get("translatedText") or "")
                        if "MYMEMORY WARNING" in text.upper():
                            text = text.split("MYMEMORY WARNING")[0].strip()
                    except Exception as exc:
                        self._send(200, {"ok": True, "text": "", "untranslated": True, "error": str(exc)})
                        return
                cache[key] = text
                try:
                    cache_path.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                except Exception:
                    pass
                self._send(200, {"ok": True, "text": text})
                return
            if path == "/api/grok/plugins":
                action = body.get("action")
                name = body.get("name") or ""
                url = body.get("url") or ""
                mapping = {
                    "enable": ["plugin", "enable", name],
                    "disable": ["plugin", "disable", name],
                    "uninstall": ["plugin", "uninstall", name],
                    "install": ["plugin", "install", url or name],
                    "update": ["plugin", "update"],
                }
                if action not in mapping or (action in ("enable", "disable", "uninstall") and not name):
                    raise RuntimeError("参数不完整")
                ok, text = run_grok(mapping[action], timeout=180)
                self._send(200, {"ok": ok, "text": text})
                return
            if path == "/api/grok/mcp":
                action = body.get("action")
                name = body.get("name") or ""
                if action == "add":
                    if not name:
                        raise RuntimeError("缺少服务器名称")
                    args = ["mcp", "add", "--scope", "user", name]
                    cmd_or_url = body.get("commandOrUrl") or ""
                    if cmd_or_url:
                        args.append(cmd_or_url)
                    extra = str(body.get("args") or "").split()
                    if extra:
                        args.append("--")
                        args.extend(extra)
                    ok, text = run_grok(args, timeout=60)
                elif action in ("remove", "enable", "disable"):
                    if not name:
                        raise RuntimeError("缺少服务器名称")
                    ok, text = run_grok(["mcp", action, name], timeout=30)
                elif action == "doctor":
                    ok, text = run_grok(["mcp", "doctor"], timeout=60)
                else:
                    raise RuntimeError("不支持的操作")
                self._send(200, {"ok": ok, "text": text})
                return
            if path == "/api/grok/skills":
                action = str(body.get("action") or "")
                if action == "install":
                    name = install_skill(str(body.get("path") or ""))
                    self._send(200, {"ok": True, "name": name})
                    return
                if action not in ("enable", "disable"):
                    raise RuntimeError("不支持的操作")
                set_skill_enabled(str(body.get("name") or ""), enabled=action == "enable")
                self._send(200, {"ok": True})
                return
            if path == "/api/account/logout":
                ok, text = run_grok(["logout"], timeout=30)
                self._send(200, {"ok": ok, "text": text})
                return
            if path == "/api/account/login-start":
                global LOGIN_PROC
                try:
                    if LOGIN_PROC and LOGIN_PROC.poll() is None:
                        LOGIN_PROC.kill()
                except Exception:
                    pass
                log_path = WEBUI_DIR / "login-output.log"
                flag = getattr(subprocess, "CREATE_NO_WINDOW", 0)
                LOGIN_PROC = subprocess.Popen(
                    [grok_bin(), "login", "--device-auth"],
                    stdout=open(log_path, "w", encoding="utf-8"),
                    stderr=subprocess.STDOUT,
                    creationflags=flag,
                )
                self._send(200, {"ok": True})
                return
            if path == "/api/account/login-status":
                log_path = WEBUI_DIR / "login-output.log"
                text = ""
                try:
                    text = log_path.read_text(encoding="utf-8", errors="replace")[-1200:]
                except Exception:
                    pass
                running = bool(LOGIN_PROC and LOGIN_PROC.poll() is None)
                code = LOGIN_PROC.poll() if LOGIN_PROC else None
                self._send(200, {"ok": True, "text": text, "running": running, "code": code})
                return
            if path == "/api/open-in":
                target = body.get("target") or ""
                cwd = normalize_cwd(body.get("cwd") or STATE.get("cwd"))
                if not os.path.isdir(cwd):
                    raise RuntimeError("项目文件夹不存在")
                local = os.environ.get("LOCALAPPDATA", "")
                flag = getattr(subprocess, "CREATE_NO_WINDOW", 0)
                exe = {
                    "vscode": [local + "\\Programs\\Microsoft VS Code\\Code.exe",
                               "C:\\Program Files\\Microsoft VS Code\\Code.exe"],
                    "cursor": [local + "\\Programs\\cursor\\Cursor.exe",
                               local + "\\Programs\\Cursor\\Cursor.exe"],
                }.get(target)
                try:
                    if target == "explorer":
                        subprocess.Popen(["explorer", cwd])
                    elif target == "terminal":
                        wt = shutil.which("wt")
                        if wt:
                            subprocess.Popen([wt, "-d", cwd])
                        else:
                            subprocess.Popen(["powershell", "-NoExit", "-Command", "Set-Location", "-LiteralPath", cwd])
                    elif exe:
                        found = next((c for c in exe if os.path.isfile(c)), None)
                        if not found:
                            raise RuntimeError("未检测到安装")
                        subprocess.Popen([found, cwd])
                    else:
                        raise RuntimeError("不支持的目标")
                    self._send(200, {"ok": True})
                except RuntimeError:
                    raise
                except Exception as exc:
                    raise RuntimeError(str(exc))
                return
            if path == "/api/clear-pastes":
                import shutil as _shutil
                cwd = STATE.get("cwd") or ""
                target = os.path.join(cwd, ".grok-webui-pastes")
                removed = 0
                if os.path.isdir(target):
                    _shutil.rmtree(target, ignore_errors=True)
                    removed = 1
                self._send(200, {"ok": True, "removed": removed})
                return
            if path == "/api/agent/restart":
                threading.Thread(
                    target=lambda: ACP.restart(STATE.get("effort")),
                    daemon=True,
                    name="acp-restart",
                ).start()
                self._send(200, {"ok": True, "reloading": True})
                return
            if path == "/api/permission":
                ACP.answer_permission(body.get("id"), body.get("optionId"), bool(body.get("cancelled")))
                self._send(200, {"ok": True})
                return
        except Exception as exc:
            self._send(500, {"ok": False, "error": str(exc)})
            return
        self._send(404, {"error": "没有这个接口"})

    def _sse(self) -> None:
        q = BUS.subscribe()
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        try:
            hello = {
                "type": "hello",
                "agentAlive": ACP.alive(),
                "agentReady": ACP.ready.is_set(),
                "error": ACP.error,
            }
            self.wfile.write(f"data: {json.dumps(hello, ensure_ascii=False)}\n\n".encode("utf-8"))
            self.wfile.flush()
            last_ping = time.time()
            while True:
                try:
                    event = q.get(timeout=1)
                    self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode("utf-8"))
                    self.wfile.flush()
                except queue.Empty:
                    try:
                        if time.time() - last_ping > 15:
                            self.wfile.write(b": ping\n\n")
                            self.wfile.flush()
                            last_ping = time.time()
                    except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                        break
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                    break
        finally:
            BUS.unsubscribe(q)

    def _terminal_sse(self, session_id: str) -> None:
        session = get_terminal_session(session_id)
        if session is None:
            self._send(404, {"ok": False, "error": "找不到终端会话"})
            return
        subscriber = session.subscribe()
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            last_ping = time.time()
            while True:
                try:
                    event = subscriber.get(timeout=1)
                    self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode("utf-8"))
                    self.wfile.flush()
                    if event.get("type") == "exit":
                        break
                except queue.Empty:
                    try:
                        if time.time() - last_ping > 15:
                            self.wfile.write(b": ping\n\n")
                            self.wfile.flush()
                            last_ping = time.time()
                    except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                        break
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                    break
        finally:
            session.unsubscribe(subscriber)


def start_server(port: int = 3088) -> ThreadingHTTPServer:
    """供桌面壳（desktop.py）调用：启动 HTTP 服务与 ACP 代理。"""
    refresh_grok_meta()
    threading.Thread(target=lambda: ACP.start(STATE.get("effort")), daemon=True, name="acp-boot").start()
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    try:
        httpd.socket.set_inheritable(False)
    except Exception:
        pass
    return httpd


def main() -> None:
    parser = argparse.ArgumentParser(description="Grok Build 中文操作台")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3088)
    parser.add_argument("--open", action="store_true", help="启动后打开浏览器")
    parser.add_argument("--cwd", default="", help="默认工作目录")
    args = parser.parse_args()
    if args.host not in ("127.0.0.1", "localhost"):
        print("为了安全，只允许绑定 127.0.0.1", file=sys.stderr)
        sys.exit(2)
    if args.cwd:
        STATE["cwd"] = args.cwd
        save_state(STATE)
    refresh_grok_meta()
    threading.Thread(target=lambda: ACP.start(STATE.get("effort")), daemon=True, name="acp-boot").start()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    try:
        httpd.socket.set_inheritable(False)
    except Exception:
        pass
    url = f"http://{args.host}:{args.port}/"
    print(f"Grok 中文操作台：{url}")
    print("按 Ctrl+C 结束。这个网页只在本机可用，不会暴露到公网。")
    if args.open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已关闭。")
        close_all_terminals()
        httpd.server_close()


if __name__ == "__main__":
    main()

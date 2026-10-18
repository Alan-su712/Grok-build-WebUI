#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grok Build WebUI 的 macOS 桌面入口。"""

from __future__ import annotations

import base64
import os
import socket
import sys
import threading
import time
import urllib.request
from pathlib import Path


def _resource_root() -> Path:
    candidates = []
    frozen_root = getattr(sys, "_MEIPASS", "")
    if frozen_root:
        candidates.append(Path(frozen_root))
    resource_path = os.environ.get("RESOURCEPATH")
    if resource_path:
        candidates.append(Path(resource_path))
    candidates.append(Path(__file__).resolve().parent)
    return next((root for root in candidates if (root / "static").is_dir()), candidates[-1])


WEBUI_DIR = _resource_root()
GROK_HOME = Path(os.environ.get("GROK_HOME", Path.home() / ".grok"))
STATE_DIR = Path(os.environ.get("GROK_WEBUI_STATE_DIR", GROK_HOME / "webui"))
STATE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("GROK_WEBUI_DIR", str(WEBUI_DIR))
os.environ.setdefault("GROK_WEBUI_STATE_DIR", str(STATE_DIR))
os.environ.setdefault("PYTHONUTF8", "1")
sys.path.insert(0, str(WEBUI_DIR))

import server  # noqa: E402
import webview  # noqa: E402

SPLASH_MESSAGES = {
    "zh-CN": "正在准备工作区",
    "zh-TW": "正在準備工作區",
    "zh-TW-TW": "正在準備工作區",
    "zh-HK": "正在準備工作區",
    "en": "Preparing your workspace",
    "ja": "ワークスペースを準備しています",
    "de": "Arbeitsbereich wird vorbereitet",
    "fr": "Préparation de l’espace de travail",
    "es": "Preparando el espacio de trabajo",
    "ko": "작업 공간 준비 중",
}


def _free_port() -> int:
    for port in range(3088, 3100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _splash_html() -> str:
    logo_path = WEBUI_DIR / "static" / "grok-build-wordmark-main.png"
    logo = ""
    if logo_path.is_file():
        encoded = base64.b64encode(logo_path.read_bytes()).decode("ascii")
        logo = f'<img src="data:image/png;base64,{encoded}" alt="Grok Build">'
    dark = str(server.STATE.get("theme") or "") in {
        "grok-night", "dark", "tokyo-night", "graphite", "high-contrast", "violet-night"
    }
    message = SPLASH_MESSAGES.get(str(server.STATE.get("lang") or "zh-CN"), SPLASH_MESSAGES["zh-CN"])
    background, foreground, muted, track = (
        ("#171717", "#f4f3f0", "#a6a5a2", "#363634")
        if dark else ("#f5f5f4", "#262624", "#6c6b68", "#deddda")
    )
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{height:100%;margin:0}}body{{display:grid;place-items:center;background:{background};color:{foreground};font:14px -apple-system,BlinkMacSystemFont,sans-serif}}
main{{width:min(320px,calc(100vw - 48px));text-align:center}}.brand{{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px}}
.brand img{{display:block;width:min(140px,calc(100vw - 112px));height:auto}}.tag{{padding:3px 7px;border:1px solid {track};border-radius:999px;color:{muted};font-size:11px}}
p{{margin:0;color:{muted};font-size:12px}}.track{{height:2px;margin:24px auto 0;overflow:hidden;border-radius:2px;background:{track}}}
.track:after{{content:"";display:block;width:34%;height:100%;background:{muted};animation:move 1.6s ease-in-out infinite}}
@keyframes move{{from{{transform:translateX(-100%)}}to{{transform:translateX(320%)}}}}
@media(prefers-reduced-motion:reduce){{.track:after{{animation:none;transform:translateX(0)}}}}
</style></head><body><main><div class="brand">{logo}<span class="tag">WebUI</span></div><p>{message}</p><div class="track"></div></main></body></html>"""


class Api:
    """提供 macOS 原生窗口控制与文件选择器。"""

    def __init__(self) -> None:
        self.window = None
        self.maximized = False

    def win_min(self) -> None:
        if self.window:
            self.window.minimize()

    def win_toggle(self) -> None:
        if not self.window:
            return
        if self.maximized:
            self.window.restore()
            self.maximized = False
        else:
            self.window.maximize()
            self.maximized = True

    def win_state(self) -> str:
        return "max" if self.maximized else "normal"

    def win_close(self) -> None:
        if self.window:
            self.window.destroy()

    def win_drag(self) -> None:
        return None

    def pick_folder(self, initial_path: str = "") -> str:
        if not self.window:
            return ""
        directory = initial_path if os.path.isdir(initial_path) else str(Path.home())
        selected = self.window.create_file_dialog(webview.FileDialog.FOLDER, directory=directory)
        return str(selected[0]) if selected else ""

    def pick_file(self, initial_path: str = "") -> str:
        if not self.window:
            return ""
        initial = Path(initial_path) if initial_path else Path.home()
        directory = str(initial if initial.is_dir() else initial.parent if initial.parent.is_dir() else Path.home())
        selected = self.window.create_file_dialog(webview.FileDialog.OPEN, directory=directory)
        return str(selected[0]) if selected else ""


def main() -> None:
    port = _free_port()
    url = f"http://127.0.0.1:{port}/?host=desktop&platform=macos"
    api = Api()
    window = webview.create_window(
        "Grok Build WebUI",
        html=_splash_html(),
        js_api=api,
        width=1440,
        height=900,
        min_size=(980, 640),
        resizable=True,
        frameless=False,
        shadow=True,
        text_select=True,
        zoomable=False,
        background_color="#f4f6f8",
    )
    api.window = window
    httpd = {"server": None}

    def on_closing() -> bool:
        server.close_all_terminals()
        active_server = httpd["server"]
        if active_server:
            active_server.shutdown()
            active_server.server_close()
        return True

    window.events.closing += on_closing

    def boot() -> None:
        try:
            active_server = server.start_server(port)
            httpd["server"] = active_server
            threading.Thread(target=active_server.serve_forever, daemon=True, name="webui-http").start()
            for _ in range(200):
                try:
                    urllib.request.urlopen(url, timeout=1).close()
                    if window.events.shown.wait(0.1):
                        window.load_url(url)
                        return
                except Exception:
                    time.sleep(0.1)
            raise RuntimeError("本地服务未能及时启动")
        except Exception:
            try:
                window.load_html(
                    "<!doctype html><meta charset='utf-8'><main style='font:15px -apple-system;padding:40px'>"
                    "<h2>无法启动 Grok Build WebUI</h2><p>请确认本机 Grok Build Runtime 可正常运行，然后重试。</p></main>"
                )
            except Exception:
                pass

    threading.Thread(target=boot, daemon=True, name="webui-boot").start()
    webview.start(
        private_mode=False,
        storage_path=str(STATE_DIR / "webview"),
    )
    server.close_all_terminals()


if __name__ == "__main__":
    main()

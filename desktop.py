#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grok Build WebUI 桌面壳：系统标题栏 + 托盘 + 遮罩启动。"""

from __future__ import annotations

import base64
import ctypes
import os
import socket
import sys
import threading
import time
import urllib.request


def _set_process_dpi_awareness() -> None:
    """让 WinForms 和 Edge WebView 使用每显示器 DPI，避免系统位图缩放。"""
    if sys.platform != "win32":
        return
    try:
        context = ctypes.c_void_p(-4)  # DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2
        if ctypes.windll.user32.SetProcessDpiAwarenessContext(context):
            return
    except Exception:
        pass
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)  # PROCESS_PER_MONITOR_DPI_AWARE
    except Exception:
        pass


_set_process_dpi_awareness()

_GROK_ROOT = os.environ.get("GROK_HOME", os.path.join(os.path.expanduser("~"), ".grok"))
if getattr(sys, "frozen", False):
    bundle_root = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(sys.executable)))
    os.environ.setdefault("GROK_WEBUI_DIR", bundle_root)
    os.environ.setdefault("GROK_WEBUI_STATE_DIR", os.path.join(_GROK_ROOT, "webui"))
WEBUI_DIR = os.environ.get("GROK_WEBUI_DIR", os.path.join(_GROK_ROOT, "webui"))
STATE_DIR = os.environ.get("GROK_WEBUI_STATE_DIR", WEBUI_DIR)
if os.path.isdir(WEBUI_DIR):
    os.environ.setdefault("PYTHONUTF8", "1")
    os.environ["GROK_WEBUI_FLUENT_SCROLLBARS"] = "1"
    sys.path.insert(0, WEBUI_DIR)

os.makedirs(STATE_DIR, exist_ok=True)
_LOG = os.path.join(STATE_DIR, "desktop-boot.log")
_FRAME_HELPER = None


def _log(msg: str) -> None:
    try:
        with open(_LOG, "a", encoding="utf-8") as f:
            f.write(time.strftime("[%H:%M:%S] ") + msg + "\n")
    except Exception:
        pass


def _set_round_corners(window: "webview.Window") -> None:
    """请求 Windows 11 使用原生圆角，不接管任何窗口消息。"""
    if sys.platform != "win32":
        return
    try:
        hwnd = int(window.native.Handle.ToInt64())
        value = ctypes.c_int(2)  # DWMWCP_ROUND
        setter = ctypes.windll.dwmapi.DwmSetWindowAttribute
        setter.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_void_p, ctypes.c_uint]
        setter.restype = ctypes.c_long
        result = setter(hwnd, 33, ctypes.byref(value), ctypes.sizeof(value))  # DWMWA_WINDOW_CORNER_PREFERENCE
        if result != 0:
            _log("round corners unavailable: " + str(result))
    except Exception as exc:
        _log("round corners setup failed: " + repr(exc))


def _install_hidden_caption(window: "webview.Window") -> None:
    """隐藏系统非客户区，同时保留由托管窗口过程转发的系统缩放行为。"""
    global _FRAME_HELPER
    try:
        if _FRAME_HELPER is None:
            import clr
            from System import IntPtr

            roots = []
            frozen_root = getattr(sys, "_MEIPASS", "")
            if frozen_root:
                roots.append(frozen_root)
            roots.append(os.path.dirname(os.path.abspath(__file__)))
            roots.append(WEBUI_DIR)
            dll_path = next(
                (os.path.join(root, "HiddenCaptionFrame.dll") for root in roots if os.path.isfile(os.path.join(root, "HiddenCaptionFrame.dll"))),
                None,
            )
            if not dll_path:
                raise FileNotFoundError("HiddenCaptionFrame.dll")
            clr.AddReference(dll_path)
            from GrokBuildWindow import HiddenCaptionFrame

            _FRAME_HELPER = HiddenCaptionFrame

        from System import IntPtr
        from System import Action
        from System.Windows.Forms import FormBorderStyle

        hwnd = IntPtr(int(window.native.Handle.ToInt64()))
        form = window.native

        def _apply():
            try:
                # WinForms 只负责记录无边框的客户区尺寸；辅助层随后补回原生窗口样式。
                form.FormBorderStyle = getattr(FormBorderStyle, "None")
                if not _FRAME_HELPER.Install(hwnd):
                    raise RuntimeError("hidden caption install returned false")
                _FRAME_HELPER.Refresh(hwnd)
                _log("hidden caption installed")
            except Exception as exc:
                _log("hidden caption apply failed: " + repr(exc))

        window.native.BeginInvoke(Action(_apply))
    except Exception as exc:
        _log("hidden caption failed: " + repr(exc))

_log("import server...")
import server  # noqa: E402
_log("import webview...")
import webview  # noqa: E402
_log("imports done")

SPLASH_TEMPLATE = """<!doctype html>
<html lang="__LANG__">
<head>
<meta charset="utf-8">
<style>
  html, body { height: 100%; margin: 0; }
  body {
    background: __BG__;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", sans-serif;
    color: __TEXT__;
    -webkit-user-select: none; user-select: none;
  }
  .wrap { width: min(320px, calc(100vw - 48px)); text-align: center; animation: arrive .55s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes arrive { from { opacity: .72; transform: translateY(7px); } }
  .logo-lockup {
    display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 auto 24px;
  }
  .logo {
    width: min(140px, calc(100vw - 112px)); height: auto; margin: 0; display: block;
    filter: __MARK_FILTER__;
  }
  .logo-tag {
    flex: none; border: 1px solid __TRACK__; border-radius: 999px; padding: 3px 6px;
    color: __MUTED__; font-size: 11px; font-weight: 500; line-height: 1.1; white-space: nowrap;
  }
  h1 { font-size: 16px; font-weight: 560; margin: 0 0 8px; letter-spacing: -.02em; }
  p { color: __MUTED__; font-size: 12px; line-height: 1.6; margin: 0; }
  .progress { height: 2px; margin: 25px auto 0; overflow: hidden; border-radius: 2px; background: __TRACK__; }
  .progress::after {
    content: ""; display: block; width: 34%; height: 100%; border-radius: inherit;
    background: __ACCENT__; animation: travel 1.65s cubic-bezier(.6,0,.4,1) infinite;
  }
  @keyframes travel { from { transform: translateX(-10%); } to { transform: translateX(310%); } }
  @media (prefers-reduced-motion: reduce) { .wrap, .progress::after { animation: none; } .progress::after { transform: translateX(0); } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="logo-lockup">
      <img class="logo" src="__LOGO__" alt="">
      <span class="logo-tag">WebUI</span>
    </div>
    <h1>__TITLE__</h1>
    <p>__MESSAGE__</p>
    <div class="progress" aria-hidden="true"></div>
  </div>
</body>
</html>"""

SPLASH_COPY = {
    "zh-CN": ("zh-CN", "正在准备工作区", "很快就好"),
    "zh-TW": ("zh-TW", "正在準備工作區", "很快就好"),
    "zh-TW-TW": ("zh-TW", "正在準備工作區", "很快就好"),
    "zh-HK": ("zh-HK", "正在準備工作區", "很快就好"),
    "en": ("en", "Getting your workspace ready", "Almost ready"),
    "ja": ("ja", "ワークスペースを準備中", "もうすぐです"),
    "de": ("de", "Arbeitsbereich wird vorbereitet", "Gleich geht’s los"),
    "fr": ("fr", "Préparation de l’espace de travail", "C’est pour bientôt"),
    "es": ("es", "Preparando el espacio de trabajo", "Enseguida estará listo"),
    "ko": ("ko", "작업 공간 준비 중", "곧 준비됩니다"),
}


def splash_html() -> str:
    logo = ""
    path = os.path.join(WEBUI_DIR, "static", "grok-build-wordmark-main.png")
    if os.path.isfile(path):
        with open(path, "rb") as f:
            logo = "data:image/png;base64," + base64.b64encode(f.read()).decode()
    lang, title, message = SPLASH_COPY.get(server.STATE.get("lang"), SPLASH_COPY["zh-CN"])
    theme = str(server.STATE.get("theme") or "grok-day")
    dark = theme in {"grok-night", "dark", "tokyo-night", "graphite", "high-contrast", "violet-night"}
    palette = {
        "__BG__": "#171717" if dark else "#f5f5f4",
        "__TEXT__": "#f4f3f0" if dark else "#262624",
        "__MUTED__": "#a6a5a2" if dark else "#6c6b68",
        "__TRACK__": "#363634" if dark else "#deddda",
        "__ACCENT__": "#c6c5c1" if dark else "#85847f",
        "__MARK_FILTER__": "invert(1)" if dark else "none",
    }
    html = SPLASH_TEMPLATE.replace("__LOGO__", logo)
    html = html.replace("__LANG__", lang).replace("__TITLE__", title).replace("__MESSAGE__", message)
    for placeholder, value in palette.items():
        html = html.replace(placeholder, value)
    return html


def find_free_port(start: int = 3088, tries: int = 12) -> int:
    for port in range(start, start + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return start


def make_tray(window: "webview.Window"):
    import pystray
    from PIL import Image

    img = Image.open(os.path.join(WEBUI_DIR, "static", "logo-mark.png"))

    def show_window(icon, item):
        window.show()

    def quit_app(icon, item):
        icon.stop()
        try:
            server.close_all_terminals()
            window.destroy()
        finally:
            os._exit(0)

    menu = pystray.Menu(
        pystray.MenuItem("显示主窗口", show_window, default=True),
        pystray.MenuItem("退出", quit_app),
    )
    icon = pystray.Icon("GrokBuildWebUI", img, "Grok Build WebUI", menu=menu)
    icon.run_detached()
    return icon


_WIN = {"w": None, "max": False}


class Api:
    """暴露给前端 pywebview.api 的窗口控制。"""

    def __init__(self):
        self._drag_lock = threading.Lock()
        self._dragging = False

    def win_min(self):
        if not _WIN["w"]:
            return
        try:
            from System import Action
            from System.Windows.Forms import FormWindowState

            form = _WIN["w"].native

            def _minimize():
                # 保持原生可调整大小样式，交由 Windows 播放缩到任务栏的动画。
                form.WindowState = getattr(FormWindowState, "Minimized")

            form.Invoke(Action(_minimize))
        except Exception as exc:
            _log("animated minimize failed: " + repr(exc))
            _WIN["w"].minimize()

    def win_toggle(self):
        if not _WIN["w"]:
            return
        try:
            from System import Action
            from System.Windows.Forms import FormWindowState

            form = _WIN["w"].native

            def _toggle():
                # 原生可调整大小样式会让最大化、还原沿用 Windows 的 DWM 动画。
                is_maximized = (
                    form.WindowState == getattr(FormWindowState, "Maximized")
                    or _WIN["max"]
                )
                if is_maximized:
                    form.WindowState = getattr(FormWindowState, "Normal")
                    _WIN["max"] = False
                else:
                    form.WindowState = getattr(FormWindowState, "Maximized")
                    _WIN["max"] = True

            form.Invoke(Action(_toggle))
        except Exception as exc:
            _log("animated maximize toggle failed: " + repr(exc))
            if _WIN["max"]:
                _WIN["w"].restore()
                _WIN["max"] = False
            else:
                _WIN["w"].maximize()
                _WIN["max"] = True

    def win_drag(self):
        if not _WIN["w"]:
            return
        try:
            form = _WIN["w"].native
            hwnd = int(form.Handle.ToInt64())
            with self._drag_lock:
                if self._dragging:
                    return
                self._dragging = True

            def _drag_loop():
                try:
                    from ctypes import wintypes

                    user32 = ctypes.windll.user32
                    get_cursor = user32.GetCursorPos
                    get_cursor.argtypes = [ctypes.POINTER(wintypes.POINT)]
                    get_cursor.restype = ctypes.c_bool
                    get_rect = user32.GetWindowRect
                    get_rect.argtypes = [ctypes.c_void_p, ctypes.POINTER(wintypes.RECT)]
                    get_rect.restype = ctypes.c_bool
                    set_pos = user32.SetWindowPos
                    set_pos.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_uint]
                    set_pos.restype = ctypes.c_bool
                    get_button = user32.GetAsyncKeyState
                    get_button.argtypes = [ctypes.c_int]
                    get_button.restype = ctypes.c_short
                    is_zoomed = user32.IsZoomed
                    is_zoomed.argtypes = [ctypes.c_void_p]
                    is_zoomed.restype = ctypes.c_bool
                    show_window = user32.ShowWindow
                    show_window.argtypes = [ctypes.c_void_p, ctypes.c_int]
                    show_window.restype = ctypes.c_bool

                    if is_zoomed(ctypes.c_void_p(hwnd)):
                        show_window(ctypes.c_void_p(hwnd), 9)  # SW_RESTORE
                        _WIN["max"] = False
                        time.sleep(0.05)

                    start_cursor = wintypes.POINT()
                    start_rect = wintypes.RECT()
                    if not get_cursor(ctypes.byref(start_cursor)) or not get_rect(ctypes.c_void_p(hwnd), ctypes.byref(start_rect)):
                        return

                    while get_button(0x01) & 0x8000:
                        cursor = wintypes.POINT()
                        if not get_cursor(ctypes.byref(cursor)):
                            break
                        dx = cursor.x - start_cursor.x
                        dy = cursor.y - start_cursor.y
                        set_pos(
                            ctypes.c_void_p(hwnd),
                            None,
                            start_rect.left + dx,
                            start_rect.top + dy,
                            0,
                            0,
                            0x0001 | 0x0004 | 0x0010,  # SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE
                        )
                        time.sleep(0.008)
                finally:
                    with self._drag_lock:
                        self._dragging = False

            threading.Thread(target=_drag_loop, daemon=True, name="window-drag").start()
        except Exception as exc:
            _log("native drag failed: " + repr(exc))

    def win_state(self):
        return "max" if _WIN["max"] else "normal"

    def win_close(self):
        if not _WIN["w"]:
            return
        if server.STATE.get("closeAction") != "exit":
            _WIN["w"].hide()
        else:
            _WIN["w"].destroy()

    def _pick_native_path(self, kind: str, initial_path: str = "") -> str:
        """在桌面 UI 线程中打开 Windows 原生文件选择器。"""
        initial_path = str(initial_path or "")
        window = _WIN.get("w")
        if not window:
            return ""

        result = {"path": ""}
        done = threading.Event()
        form = window.native

        def _show():
            try:
                if kind == "folder":
                    from webview.platforms.winforms import OpenFolderDialog

                    initial = initial_path if os.path.isdir(initial_path) else os.path.expanduser("~")
                    picked = OpenFolderDialog.show(
                        parent=form,
                        initialDirectory=initial,
                        title="选择工作区文件夹",
                    )
                    if picked:
                        result["path"] = str(picked[0])
                else:
                    from System.Windows.Forms import DialogResult, OpenFileDialog

                    dialog = OpenFileDialog()
                    try:
                        initial = initial_path if os.path.isdir(initial_path) else os.path.dirname(initial_path)
                        if initial and os.path.isdir(initial):
                            dialog.InitialDirectory = initial
                        dialog.Title = "选择文件"
                        dialog.Filter = "所有文件 (*.*)|*.*"
                        dialog.CheckFileExists = True
                        dialog.Multiselect = False
                        if dialog.ShowDialog(form) == DialogResult.OK:
                            result["path"] = str(dialog.FileName)
                    finally:
                        dialog.Dispose()
            except Exception as exc:
                _log("native picker failed: " + repr(exc))
            finally:
                done.set()

        try:
            from System import Action

            form.BeginInvoke(Action(_show))
            done.wait()
        except Exception as exc:
            _log("native picker dispatch failed: " + repr(exc))
        return result["path"]

    def pick_folder(self, initial_path: str = "") -> str:
        return self._pick_native_path("folder", initial_path)

    def pick_file(self, initial_path: str = "") -> str:
        return self._pick_native_path("file", initial_path)


def main() -> None:
    _log("main enter")
    port = find_free_port()
    url = f"http://127.0.0.1:{port}/?host=desktop"
    _log("create_window native-caption...")
    api = Api()
    window = webview.create_window(
        "Grok Build WebUI",
        html=splash_html(),
        js_api=api,
        width=1280,
        height=800,
        resizable=True,
        fullscreen=False,
        min_size=(980, 640),
        background_color="#f4f6f8",
        frameless=False,
        easy_drag=False,
        shadow=True,
        text_select=True,
        zoomable=False,
        draggable=False,
    )
    _WIN["w"] = window
    tray_holder: dict = {}

    def on_closing() -> bool:
        # 返回 False 拦截关闭：退出到托盘，后台任务继续跑
        if server.STATE.get("closeAction") != "exit":
            window.hide()
            icon = tray_holder.get("icon")
            if icon is not None:
                try:
                    if not server.STATE.get("trayHinted"):
                        icon.notify("已最小化到任务托盘，双击图标恢复，右键可退出", "Grok Build WebUI")
                        server.STATE["trayHinted"] = True
                        server.save_state(server.STATE)
                except Exception:
                    pass
            return False
        server.close_all_terminals()
        return True

    window.events.closing += on_closing

    def boot() -> None:
        _log("boot: starting server")
        httpd = server.start_server(port)
        _log("boot: server up")
        threading.Thread(target=httpd.serve_forever, daemon=True, name="httpd").start()
        for _ in range(200):
            try:
                urllib.request.urlopen(url, timeout=1)
                break
            except Exception:
                time.sleep(0.1)
        _log("boot: healthy, waiting for window shown")
        if not window.events.shown.wait(60):
            _log("boot: window did not become visible")
            return
        _log("boot: window shown, handing off to UI thread")
        # 托盘和切主界面必须在 UI 线程上执行；BeginInvoke 异步投递避免 GIL 死锁
        try:
            from System import Action

            form = window.native

            def on_ui():
                _log("ui: load tray + main page")
                try:
                    tray_holder["icon"] = make_tray(window)
                except Exception as exc:
                    _log("tray failed: " + repr(exc))
                try:
                    # 客户区铺满到窗口边缘时，避免 WinForms 根窗口的启动色露出黑边。
                    from System.Drawing import Color
                    form.BackColor = Color.FromArgb(244, 246, 248)
                except Exception as exc:
                    _log("frame background setup failed: " + repr(exc))
                _set_round_corners(window)

                def load_main_page():
                    try:
                        window.load_url(url)
                    except Exception as exc:
                        _log("main page load failed: " + repr(exc))

                threading.Thread(target=load_main_page, daemon=True, name="load-main").start()

            form.BeginInvoke(Action(on_ui))
        except Exception as exc:
            _log("ui handoff failed: " + repr(exc))
            window.load_url(url)

    _log("webview.start")
    threading.Thread(target=boot, daemon=True, name="boot").start()

    def on_loaded():
        _log("loaded")
        _install_hidden_caption(window)

    window.events.loaded += on_loaded
    webview.start()
    _log("webview.start returned")
    os._exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        try:
            with open(os.path.join(WEBUI_DIR, "desktop-crash.log"), "a", encoding="utf-8") as f:
                f.write(traceback.format_exc())
        except Exception:
            pass
        raise

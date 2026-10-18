# Grok Build WebUI

Languages: [简体中文](README.md) · [繁體中文](README.zh-TW.md) · English · [日本語](README.ja.md)

Grok Build WebUI is a multilingual browser interface for the local Grok Build Runtime. It provides chat, model, approval, plan and goal, automation, and plugin controls; tasks are still executed by the local runtime. The UI supports Simplified Chinese, Traditional Chinese (Taiwan and Hong Kong), English, Japanese, Korean, German, French, and Spanish. The selected UI language is also sent as a session instruction so Grok can answer in that language by default.

> **Independent project:** This community project is not affiliated with, sponsored by, or endorsed by xAI, Grok, or the official Grok Build product. Grok, xAI, and related marks belong to their respective owners. This project does not include or resell the Grok Runtime.

Author: **Alan-su712** · [GitHub repository](https://github.com/Alan-su712/Grok-build-webui)

## Browser mode: install with npm from GitHub

Requirements: Windows 10/11, Node.js 18+, Python 3.10+, and the local Grok Build Runtime. Sign in to your Grok account or configure a supported API connection in the first-run setup.

In PowerShell:

```powershell
npm install --global https://github.com/Alan-su712/Grok-build-webui/archive/refs/heads/main.tar.gz
grok-build-webui --open
```

The default address is `http://127.0.0.1:3088/`. To choose another port, run `grok-build-webui --port 3089 --open`. Press `Ctrl+C` to stop. This uses npm to download the public GitHub source archive; the package has not been published to the npm public registry.

If Python is not on `PATH`, set `$env:GROK_BUILD_PYTHON = "C:\path\to\python.exe"` before starting. The embedded PowerShell terminal is optional and requires `py -3 -m pip install "pywinpty>=3,<4"`.

## Windows desktop downloads

The release includes a portable `GrokBuildWebUI.exe`, a folder-picker installer, and a compact ZIP. The ZIP contains the portable app and documentation in four languages without duplicating the installer. The portable app does not require Python or Node.js, but the local Grok Build Runtime must already be installed. The installer asks for a destination folder and creates a Start menu shortcut; it does not install the Runtime. App settings are stored in `%USERPROFILE%\.grok\webui`.

To build the Windows x64 release yourself:

```powershell
python -m pip install -r requirements-desktop.txt
python -m PyInstaller --clean --noconfirm GrokBuildWebUI.spec
.\installer\build-installer.ps1
.\installer\package-release.ps1
```

The ZIP, portable app, and installer are created in `release`. The installer build uses the Windows IExpress utility.

## Run the desktop app from source

```powershell
git clone https://github.com/Alan-su712/Grok-build-webui.git
cd Grok-build-webui
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-desktop.txt
python desktop.py
```

## Run browser mode from source

```powershell
py -3 server.py --open --port 3088
```

Browser mode is not a static-only site: the local Python service connects to the local Runtime. It binds only to `127.0.0.1` by default and is not exposed to a LAN or the public internet. User settings are stored in `%USERPROFILE%\.grok\webui`; uninstalling the npm package does not remove them.

## Project information

- Version: `1.0.0`
- Author: Alan-su712
- Repository: [github.com/Alan-su712/Grok-build-webui](https://github.com/Alan-su712/Grok-build-webui)
- No open-source license has been selected yet. Do not assume that the source may be redistributed or used commercially until a license is added. Third-party dependencies and assets retain their own licenses.

## Security

Do not expose this unauthenticated local service through a reverse proxy or port forwarding. Never commit API keys, authentication files, conversation history, personal settings, or runtime logs.

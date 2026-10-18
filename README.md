# Grok Build WebUI

![版本](https://img.shields.io/badge/version-1.0.0-596f8a) ![平台](https://img.shields.io/badge/platform-Windows%2010%2F11%20%2B%20macOS-596f8a)

语言：简体中文（本页） · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md)

Grok Build WebUI 是一个面向本机 Grok Build Runtime 的多语言网页操作界面。它让用户在浏览器中管理对话、模型、权限批准、计划与目标、自动化任务和插件；实际任务仍由本机 Grok Runtime 执行。支持简体中文、繁体中文（台湾／香港）、英语、日语、韩语、德语、法语和西班牙语。界面语言也会作为会话规则，指导 Grok 默认使用相同语言回答。

> **独立项目声明：**本项目由社区独立开发，与 xAI、Grok 或 Grok Build 官方无隶属、赞助或认可关系。Grok、xAI 及相关标识归其各自权利人所有。本项目不包含、不转售 Grok Runtime，也不代表 xAI。

作者：**Alan-su712** · [GitHub 仓库](https://github.com/Alan-su712/Grok-build-webui)

## 适用场景

- 使用本机 Grok Build Runtime，通过浏览器运行本地 WebUI。
- 在 Windows 桌面窗口中使用同一套界面。
- 在 macOS 桌面应用中使用同一套界面。
- 通过 Grok 账号登录，或在 Runtime 支持的情况下配置兼容 API。

浏览器模式不是静态网页：它会在本机启动 Python 服务，以便安全地访问 Runtime、对话和本地文件。服务默认只绑定 `127.0.0.1`，不会对局域网或公网开放。

## 浏览器模式：使用 npm 从 GitHub 安装

### 前置条件

- Windows 10／11，或 macOS 12 及以上版本。
- Node.js 18 或更新版本。
- Python 3.10 或更新版本，并能从命令行启动。
- 已安装本机 Grok Build Runtime。若使用账号方式，请先完成 Grok 登录；API 接入方式需在 WebUI 中填写自己的服务地址与密钥。

### 安装与启动

在 PowerShell 或 macOS「终端」中执行：

```sh
npm install --global https://github.com/Alan-su712/Grok-build-webui/archive/refs/heads/main.tar.gz
grok-build-webui --open
```

默认打开 `http://127.0.0.1:3088/`。自定义端口：

```powershell
grok-build-webui --port 3089 --open
```

按 `Ctrl+C` 停止服务。此安装方式通过 npm 下载 GitHub 源码归档；目前尚未发布到 npm 官方公共注册表。

如果在 Windows 上 Python 不在 `PATH` 中，可先指定解释器：

```powershell
$env:GROK_BUILD_PYTHON = "C:\路径\到\python.exe"
grok-build-webui --open
```

如果在 macOS 上 Python 不在 `PATH` 中，可在终端指定解释器：

```sh
export GROK_BUILD_PYTHON="$(command -v python3)"
grok-build-webui --open
```

浏览器模式的聊天、设置和本地 Runtime 接入不依赖桌面壳。内嵌 PowerShell 终端组件仅适用于 Windows：

```powershell
py -3 -m pip install "pywinpty>=3,<4"
```

## Windows 桌面版发行文件

发行文件包含独立运行的 `GrokBuildWebUI.exe`、目录选择式安装程序和一个精简 ZIP。ZIP 内含便携 EXE 与四种语言的说明文件，不重复塞入安装程序。独立 EXE 不需要安装 Python 或 Node.js，但仍需本机已安装 Grok Build Runtime，并确保系统有 Microsoft Edge WebView2 Runtime；若缺少，可从 [微软官方下载页](https://developer.microsoft.com/microsoft-edge/webview2/) 安装 Evergreen Runtime。我们的安装程序不会安装 Grok Runtime 或 WebView2 Runtime。安装程序会询问目标文件夹，并在开始菜单创建快捷方式。应用设置保存在 `%USERPROFILE%\.grok\webui`。

若要自行构建桌面发行文件，请在 Windows x64 上执行：

```powershell
python -m pip install -r requirements-desktop.txt
python -m PyInstaller --clean --noconfirm GrokBuildWebUI.spec
.\installer\build-installer.ps1
.\installer\package-release.ps1
```

ZIP、独立 EXE 和安装程序会生成在 `release` 文件夹中。安装程序构建使用 Windows 自带的 IExpress。

## macOS 桌面版

Mac 版提供 Apple 芯片（`arm64`）和 Intel 芯片（`x64`）两种原生应用，每种都打包为 `.dmg` 与 `.zip`。从 [GitHub Releases](https://github.com/Alan-su712/Grok-build-webui/releases) 下载与设备架构匹配的文件：打开 `.dmg` 后将应用拖入「应用程序」，或解压 ZIP 后移动 `Grok Build WebUI.app`。桌面应用自带 Python 环境，不需要另外安装 Python 或 Node.js；仍须先安装本机 Grok Build Runtime。Mac 版使用系统文件选择器，不提供 Windows PowerShell 内嵌终端。

目前 Mac 包未使用 Apple Developer ID 签名或公证。首次打开时，按住 Control 键点按应用并选择「打开」，再确认 macOS 提示。应用窗口关闭时程序退出。

若要在 Mac 上自行构建 `.app`、`.dmg` 与 `.zip`：

```sh
python3 -m venv .venv-macos
source .venv-macos/bin/activate
python -m pip install -r requirements-macos-desktop.txt
bash installer/build-macos.sh
```

产物会写入 `release` 文件夹，文件名带有芯片架构与版本号。仓库的 `macOS Desktop Release` 工作流程可在 GitHub Actions 中手动运行；选择现有 Release 标签后，会分别在 Apple 芯片与 Intel 构建机上打包并将两种架构的 `.dmg` 和 `.zip` 附加到该 Release。

### 更新与卸载

重新运行 npm 安装命令以更新到 GitHub `main` 分支的最新内容；卸载命令：

```powershell
npm uninstall --global grok-build-webui
```

用户设置在 Windows 保存在 `%USERPROFILE%\.grok\webui`，在 macOS 保存在 `~/.grok/webui`；Grok Runtime 的账号与配置仍由本机 `.grok` 目录管理。卸载 npm 包不会删除这些用户数据。

## 从源码运行桌面版

```powershell
git clone https://github.com/Alan-su712/Grok-build-webui.git
cd Grok-build-webui
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-desktop.txt
python desktop.py
```

如果 PowerShell 阻止激活虚拟环境，也可以不激活，直接执行：

```powershell
py -3 -m pip install -r requirements-desktop.txt
py -3 desktop.py
```

## 从源码启动浏览器版

也可以不安装 npm 包，直接在仓库目录启动：

```powershell
py -3 server.py --open --port 3088
```

`server.py` 使用 Python 标准库提供本地服务；Windows 内嵌终端功能需要额外安装 `pywinpty`。无论使用哪种方式，都需要本机 Grok Build Runtime 执行模型任务。

## 开发与桌面打包

安装桌面依赖后，可用 PyInstaller 根据 `GrokBuildWebUI.spec` 生成可直接运行的单文件 Windows 桌面程序：

```powershell
python -m pip install -r requirements-desktop.txt
python -m PyInstaller --clean --noconfirm GrokBuildWebUI.spec
```

构建产物为 `dist/GrokBuildWebUI.exe`。应用静态资源内置于程序中；用户设置与运行日志保存在 `%USERPROFILE%\.grok\webui`。请勿将 `state.json`、`.grok` 用户目录、API 密钥、登录状态、运行日志或浏览器配置提交到仓库。

## 项目信息

- 版本：`1.0.0`
- 作者：Alan-su712
- 仓库：[github.com/Alan-su712/Grok-build-webui](https://github.com/Alan-su712/Grok-build-webui)
- GitHub 项目简介建议：`Independent multilingual browser UI for the local Grok Build Runtime. Not affiliated with or endorsed by xAI.`
- 许可：仓库尚未指定开源许可证；在许可证补充前，不应假定本项目源码可被再分发或用于商业用途。第三方依赖及资源仍受各自许可证约束。

## 安全说明

服务只允许绑定本机回环地址。不要通过反向代理、端口转发或修改代码将未加认证的本地服务公开到网络。不要提交 API Key、认证文件、会话记录、用户设置或运行日志。

# Grok Build WebUI

![版本](https://img.shields.io/badge/version-1.0.0-596f8a) ![平台](https://img.shields.io/badge/platform-Windows%2010%2F11-596f8a)

语言：简体中文（本页） · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md)

Grok Build WebUI 是一个面向本机 Grok Build Runtime 的多语言网页操作界面。它让用户在浏览器中管理对话、模型、权限批准、计划与目标、自动化任务和插件；实际任务仍由本机 Grok Runtime 执行。支持简体中文、繁体中文（台湾／香港）、英语、日语、韩语、德语、法语和西班牙语。界面语言也会作为会话规则，指导 Grok 默认使用相同语言回答。

> **独立项目声明：**本项目由社区独立开发，与 xAI、Grok 或 Grok Build 官方无隶属、赞助或认可关系。Grok、xAI 及相关标识归其各自权利人所有。本项目不包含、不转售 Grok Runtime，也不代表 xAI。

作者：**Alan-su712** · [GitHub 仓库](https://github.com/Alan-su712/Grok-build-webui)

## 浏览器模式：通过 npm 从 GitHub 安装

需要 Windows 10／11、Node.js 18 或更新版本、Python 3.10 或更新版本，以及已安装的本机 Grok Build Runtime。

在 PowerShell 中执行：

~~~powershell
npm install --global https://github.com/Alan-su712/Grok-build-webui/archive/refs/heads/main.tar.gz
grok-build-webui --open
~~~

默认打开 http://127.0.0.1:3088/。自定义端口可运行 grok-build-webui --port 3089 --open。按 Ctrl+C 停止服务。此方式通过 npm 下载 GitHub 源码归档；目前尚未发布到 npm 官方公共注册表。

浏览器模式不是纯静态网页：本机 Python 服务负责连接 Runtime。服务默认只绑定 127.0.0.1，不对局域网或公网开放。用户设置保存在 %USERPROFILE%\.grok\webui；卸载 npm 包不会删除这些设置。

## 桌面版源码安装

~~~powershell
git clone https://github.com/Alan-su712/Grok-build-webui.git
cd Grok-build-WebUI
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-desktop.txt
python desktop.py
~~~

## 源码启动浏览器版

~~~powershell
py -3 server.py --open --port 3088
~~~

## 项目信息

- 版本：1.0.0
- 作者：Alan-su712
- 仓库：[github.com/Alan-su712/Grok-build-webui](https://github.com/Alan-su712/Grok-build-webui)
- 尚未指定开源许可证；在许可证补充前，不应假定源码可被再分发或用于商业用途。第三方组件遵循各自许可证。

## 安全说明

不要通过反向代理、端口转发或修改代码将未加认证的本地服务公开到网络。不要提交 API Key、认证文件、会话记录、用户设置或运行日志。

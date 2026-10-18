# Grok Build WebUI

言語：[简体中文](README.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · 日本語

Grok Build WebUI は、ローカルの Grok Build Runtime 向け多言語ブラウザーインターフェースです。チャット、モデル、承認、Plan／Goal、オートメーション、プラグインをブラウザーから管理できます。タスクの実行には引き続きローカル Runtime を使用します。UI は簡体字中国語、繁体字中国語（台湾／香港）、英語、日本語、韓国語、ドイツ語、フランス語、スペイン語に対応し、選択した UI 言語をセッションルールにも反映して、Grok が既定で同じ言語で回答するようにします。

> **独立プロジェクト：**本プロジェクトはコミュニティが独立して開発しており、xAI、Grok、公式 Grok Build 製品との提携・後援・推奨関係はありません。Grok、xAI および関連する標章は各権利者に帰属します。本プロジェクトに Grok Runtime は含まれず、再販売も行いません。

作者：**Alan-su712** · [GitHub リポジトリ](https://github.com/Alan-su712/Grok-build-webui)

## ブラウザーモード：GitHub から npm でインストール

必要なもの：Windows 10／11、Node.js 18 以上、Python 3.10 以上、およびローカル Grok Build Runtime。初回セットアップで Grok アカウントにログインするか、対応する API 接続を設定してください。

PowerShell で実行：

```powershell
npm install --global https://github.com/Alan-su712/Grok-build-webui/archive/refs/heads/main.tar.gz
grok-build-webui --open
```

既定の URL は `http://127.0.0.1:3088/` です。ポートを変更するには `grok-build-webui --port 3089 --open` を実行します。`Ctrl+C` で停止します。この方法は npm を使って GitHub の公開ソースアーカイブをダウンロードします。現時点では npm 公開レジストリには公開していません。

Python が `PATH` にない場合は、起動前に `$env:GROK_BUILD_PYTHON = "C:\path\to\python.exe"` を設定します。内蔵 PowerShell ターミナルはオプションで、利用するには `py -3 -m pip install "pywinpty>=3,<4"` が必要です。

## Windows デスクトップ版の配布ファイル

配布物には、ポータブル版 `GrokBuildWebUI.exe`、保存先フォルダーを選べるセットアッププログラム、コンパクトな ZIP が含まれます。ZIP にはポータブル版と 4 言語の説明書が入り、セットアップを重複して含めません。ポータブル版に Python や Node.js は不要ですが、ローカル Grok Build Runtime と Microsoft Edge WebView2 Runtime が必要です。WebView2 がない場合は、[Microsoft の公式ダウンロードページ](https://developer.microsoft.com/microsoft-edge/webview2/)から Evergreen Runtime をインストールしてください。このセットアップはどちらの Runtime もインストールしません。セットアップでは保存先を選択し、スタートメニューにショートカットを作成します。アプリ設定は `%USERPROFILE%\.grok\webui` に保存されます。

Windows x64 版を自分でビルドする場合：

```powershell
python -m pip install -r requirements-desktop.txt
python -m PyInstaller --clean --noconfirm GrokBuildWebUI.spec
.\installer\build-installer.ps1
.\installer\package-release.ps1
```

ZIP、ポータブル版、インストーラーは `release` フォルダーに生成されます。インストーラーの作成には Windows 標準の IExpress を使用します。

## ソースからデスクトップ版を実行

```powershell
git clone https://github.com/Alan-su712/Grok-build-webui.git
cd Grok-build-webui
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-desktop.txt
python desktop.py
```

## ソースからブラウザーモードを実行

```powershell
py -3 server.py --open --port 3088
```

ブラウザーモードは静的ページだけではありません。ローカル Python サービスが Runtime と連携します。既定では `127.0.0.1` のみで待ち受け、LAN やインターネットには公開されません。ユーザー設定は `%USERPROFILE%\.grok\webui` に保存され、npm パッケージをアンインストールしても削除されません。

## プロジェクト情報

- バージョン：`1.0.0`
- 作者：Alan-su712
- リポジトリ：[github.com/Alan-su712/Grok-build-webui](https://github.com/Alan-su712/Grok-build-webui)
- オープンソースライセンスはまだ選択されていません。追加されるまでは、再配布や商用利用が許可されているとみなさないでください。サードパーティの依存関係とアセットには各ライセンスが適用されます。

## セキュリティ

認証されていないローカルサービスをリバースプロキシやポート転送で公開しないでください。API キー、認証ファイル、会話履歴、個人設定、実行ログをリポジトリにコミットしないでください。

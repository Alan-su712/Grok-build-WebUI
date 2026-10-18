# Grok Build WebUI

語言：[简体中文](README.md) · 繁體中文（本頁） · [English](README.en.md) · [日本語](README.ja.md)

Grok Build WebUI 是面向本機 Grok Build Runtime 的多語言網頁操作介面。使用者可在瀏覽器中管理對話、模型、權限核准、計畫與目標、自動化工作及外掛；實際工作仍由本機 Grok Runtime 執行。介面支援簡體中文、繁體中文（台灣／香港）、英文、日文、韓文、德文、法文及西班牙文，並會依介面語言引導 Grok 使用相同語言回覆。

> **獨立專案聲明：**本專案由社群獨立開發，與 xAI、Grok 或 Grok Build 官方沒有隸屬、贊助或認可關係。Grok、xAI 及相關標識均屬各自權利人所有。本專案不包含或轉售 Grok Runtime，也不代表 xAI。

作者：**Alan-su712** · [GitHub 專案](https://github.com/Alan-su712/Grok-build-webui)

## 瀏覽器模式：透過 npm 從 GitHub 安裝

需求：Windows 10／11、Node.js 18 以上、Python 3.10 以上，以及已安裝的本機 Grok Build Runtime。登入帳號或 API 接入方式請於首次啟動後選擇。

在 PowerShell 執行：

```powershell
npm install --global https://github.com/Alan-su712/Grok-build-webui/archive/refs/heads/main.tar.gz
grok-build-webui --open
```

預設網址為 `http://127.0.0.1:3088/`。自訂連接埠可使用 `grok-build-webui --port 3089 --open`。按 `Ctrl+C` 停止服務。此方式是 npm 從 GitHub 公開下載原始碼封存檔；目前尚未發布至 npm 官方公共套件庫。

若找不到 Python，先設定 `$env:GROK_BUILD_PYTHON = "C:\路徑\到\python.exe"` 再啟動。內嵌 PowerShell 終端是選用功能，需另外執行 `py -3 -m pip install "pywinpty>=3,<4"`。

## Windows 桌面版發行檔

發行檔包含可直接執行的 `GrokBuildWebUI.exe`、可選擇安裝資料夾的安裝程式，以及精簡 ZIP。ZIP 內含便攜程式與四種語言的說明文件，不重複附上安裝程式。獨立程式不需要安裝 Python 或 Node.js，但仍須先安裝本機 Grok Build Runtime，並確保系統已安裝 Microsoft Edge WebView2 Runtime。若缺少 WebView2，可至[微軟官方下載頁](https://developer.microsoft.com/microsoft-edge/webview2/)安裝 Evergreen Runtime；本專案安裝程式不會安裝這兩種 Runtime。安裝程式會詢問目標資料夾，並在開始功能表建立捷徑。應用程式設定保存在 `%USERPROFILE%\.grok\webui`。

若要自行建置 Windows x64 發行檔，請執行：

```powershell
python -m pip install -r requirements-desktop.txt
python -m PyInstaller --clean --noconfirm GrokBuildWebUI.spec
.\installer\build-installer.ps1
.\installer\package-release.ps1
```

ZIP、獨立程式及安裝程式會產生於 `release` 資料夾。安裝程式使用 Windows 內建的 IExpress 建置。

## 桌面版原始碼安裝

```powershell
git clone https://github.com/Alan-su712/Grok-build-webui.git
cd Grok-build-webui
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-desktop.txt
python desktop.py
```

## 從原始碼啟動瀏覽器版

```powershell
py -3 server.py --open --port 3088
```

瀏覽器版不是純靜態頁面：Python 服務負責呼叫本機 Runtime。服務預設只監聽 `127.0.0.1`，不會開放至區域網路或公網。使用者設定保存在 `%USERPROFILE%\.grok\webui`；npm 卸載不會刪除此資料。

## 專案資訊

- 版本：`1.0.0`
- 作者：Alan-su712
- 專案：[github.com/Alan-su712/Grok-build-webui](https://github.com/Alan-su712/Grok-build-webui)
- 尚未指定開源授權；補上授權前，請勿假定原始碼可再散布或商用。第三方依賴及資源仍依其各自授權條款。

## 安全

請勿將本機服務透過反向代理或連接埠轉送公開到網路，也不要提交 API Key、認證檔、對話紀錄、個人設定或執行日誌。

#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

case "$(uname -m)" in
  arm64) ARCH="arm64"; PYI_ARCH="arm64" ;;
  x86_64) ARCH="x64"; PYI_ARCH="x86_64" ;;
  *) echo "不支持的 Mac 架构：$(uname -m)" >&2; exit 2 ;;
esac

VERSION="$(python -c "import json; print(json.load(open('package.json', encoding='utf-8'))['version'])")"
DMG_STAGE="$(mktemp -d "${TMPDIR:-/tmp}/grok-build-webui.dmg.XXXXXX")"
trap 'rm -rf "$DMG_STAGE"' EXIT
mkdir -p release

python -m PyInstaller --clean --noconfirm --windowed \
  --name "Grok Build WebUI" \
  --osx-bundle-identifier com.alansu712.grokbuildwebui \
  --target-arch "$PYI_ARCH" \
  --icon static/logo-mark.png \
  --add-data "static:static" \
  --add-data "market-translations.json:." \
  --collect-data webview \
  --hidden-import webview.platforms.cocoa \
  desktop_macos.py

APP="dist/Grok Build WebUI.app"
ZIP="release/Grok-Build-WebUI-macOS-${ARCH}-v${VERSION}.zip"
DMG="release/Grok-Build-WebUI-macOS-${ARCH}-v${VERSION}.dmg"
rm -f "$ZIP" "$DMG"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$ZIP"
ditto "$APP" "$DMG_STAGE/Grok Build WebUI.app"
ln -s /Applications "$DMG_STAGE/Applications"
hdiutil create -volname "Grok Build WebUI" -srcfolder "$DMG_STAGE" -ov -format UDZO "$DMG" >/dev/null

echo "已生成：$ZIP"
echo "已生成：$DMG"

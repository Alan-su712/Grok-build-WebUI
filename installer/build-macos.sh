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
ICONSET="$(mktemp -d "${TMPDIR:-/tmp}/grok-build-webui.iconset.XXXXXX")"
DMG_STAGE="$(mktemp -d "${TMPDIR:-/tmp}/grok-build-webui.dmg.XXXXXX")"
trap 'rm -rf "$ICONSET" "$DMG_STAGE"' EXIT
mkdir -p "$ICONSET" release

for SIZE in 16 32 128 256 512; do
  sips -z "$SIZE" "$SIZE" static/logo-mark.png --out "$ICONSET/icon_${SIZE}x${SIZE}.png" >/dev/null
done
sips -z 32 32 static/logo-mark.png --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 64 64 static/logo-mark.png --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 256 256 static/logo-mark.png --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 512 512 static/logo-mark.png --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 1024 1024 static/logo-mark.png --out "$ICONSET/icon_512x512@2x.png" >/dev/null
mkdir -p build
rm -f build/GrokBuildWebUI.icns
iconutil -c icns "$ICONSET" -o build/GrokBuildWebUI.icns

python -m PyInstaller --clean --noconfirm --windowed \
  --name "Grok Build WebUI" \
  --osx-bundle-identifier com.alansu712.grokbuildwebui \
  --target-arch "$PYI_ARCH" \
  --icon build/GrokBuildWebUI.icns \
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

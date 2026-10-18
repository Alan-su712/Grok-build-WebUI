$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
Set-Location $here
Write-Host "正在启动 Grok 中文操作台..."
python "$here\server.py" --open --port 3088

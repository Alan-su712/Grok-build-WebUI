$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

$sourceExe = Join-Path $PSScriptRoot 'GrokBuildWebUI.exe'
if (-not (Test-Path -LiteralPath $sourceExe -PathType Leaf)) {
    [System.Windows.Forms.MessageBox]::Show('安装文件不完整，请重新下载安装包。', 'Grok Build WebUI', 'OK', 'Error') | Out-Null
    exit 1
}

$defaultPath = Join-Path $env:LOCALAPPDATA 'Programs\Grok Build WebUI'
New-Item -ItemType Directory -Path $defaultPath -Force | Out-Null
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = '选择 Grok Build WebUI 的安装文件夹。'
$dialog.SelectedPath = $defaultPath
$dialog.ShowNewFolderButton = $true

if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    exit 0
}

$installDir = $dialog.SelectedPath
$targetExe = Join-Path $installDir 'GrokBuildWebUI.exe'
if (Test-Path -LiteralPath $targetExe) {
    [System.Windows.Forms.MessageBox]::Show('所选文件夹中已存在 GrokBuildWebUI.exe。为避免覆盖，请选择其他文件夹。', 'Grok Build WebUI', 'OK', 'Warning') | Out-Null
    exit 1
}

try {
    Copy-Item -LiteralPath $sourceExe -Destination $targetExe
    $startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Grok Build WebUI.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($startMenu)
    $shortcut.TargetPath = $targetExe
    $shortcut.WorkingDirectory = $installDir
    $shortcut.Description = 'Grok Build WebUI'
    $shortcut.Save()
    [System.Windows.Forms.MessageBox]::Show('Grok Build WebUI 已安装。可从开始菜单启动。', '安装完成', 'OK', 'Information') | Out-Null
}
catch {
    [System.Windows.Forms.MessageBox]::Show(('安装失败：' + $_.Exception.Message), 'Grok Build WebUI', 'OK', 'Error') | Out-Null
    exit 1
}

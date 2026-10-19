param(
    [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$distDirectory = Join-Path $repositoryRoot 'dist'
$portableExe = Join-Path $distDirectory 'GrokBuildWebUI.exe'
if (-not (Test-Path -LiteralPath $portableExe -PathType Leaf)) {
    throw '找不到 dist\GrokBuildWebUI.exe。请先按照 README 完成 PyInstaller 构建。'
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $distDirectory 'GrokBuildWebUI-Setup-v1.0.0.exe'
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $OutputPath) {
    throw "安装程序已存在，未覆盖：$OutputPath"
}

$iexpress = Join-Path $env:WINDIR 'System32\iexpress.exe'
if (-not (Test-Path -LiteralPath $iexpress -PathType Leaf)) {
    throw '未找到 Windows IExpress，无法生成安装程序。'
}

$payloadDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('GrokBuildWebUI-Setup-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $payloadDirectory | Out-Null
$completed = $false
try {
    Copy-Item -LiteralPath $portableExe -Destination (Join-Path $payloadDirectory 'GrokBuildWebUI.exe')
    $installScript = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'install.ps1') -Raw
    $installScriptPath = Join-Path $payloadDirectory 'install.ps1'
    $utf8WithBom = [System.Text.UTF8Encoding]::new($true)
    [System.IO.File]::WriteAllText($installScriptPath, $installScript, $utf8WithBom)

    $sedPath = Join-Path $payloadDirectory 'GrokBuildWebUI.sed'
    $packageOutput = Join-Path $payloadDirectory 'GrokBuildWebUI-Setup.exe'
    $sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName="$packageOutput"
FriendlyName="Grok Build WebUI Setup"
AppLaunched=powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -STA -File install.ps1
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
FILE0="GrokBuildWebUI.exe"
FILE1="install.ps1"
[SourceFiles]
SourceFiles0=$payloadDirectory\
[SourceFiles0]
%FILE0%=
%FILE1%=
"@
[System.IO.File]::WriteAllText($sedPath, $sed, [System.Text.Encoding]::ASCII)

    $process = Start-Process -FilePath $iexpress -ArgumentList @('/N', $sedPath) -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        throw "IExpress 构建失败，退出代码：$($process.ExitCode)"
    }
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while (-not (Test-Path -LiteralPath $packageOutput -PathType Leaf) -and [DateTime]::UtcNow -lt $deadline) {
        Start-Sleep -Milliseconds 250
    }
    if (-not (Test-Path -LiteralPath $packageOutput -PathType Leaf)) {
        throw 'IExpress 未生成预期的临时安装程序。'
    }

    Copy-Item -LiteralPath $packageOutput -Destination $OutputPath
    $completed = $true
    Get-Item -LiteralPath $OutputPath | Select-Object FullName, Length
}
finally {
    if ($completed -and (Test-Path -LiteralPath $payloadDirectory)) {
        Remove-Item -LiteralPath $payloadDirectory -Recurse -Force
    } elseif (Test-Path -LiteralPath $payloadDirectory) {
        Write-Output "打包失败的 IExpress 输入已保留供诊断：$payloadDirectory"
    }
}

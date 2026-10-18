param(
    [string]$ReleaseDirectory = ''
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$distDirectory = Join-Path $repositoryRoot 'dist'
$releaseDirectory = if ([string]::IsNullOrWhiteSpace($ReleaseDirectory)) {
    Join-Path $repositoryRoot 'release'
} else {
    [System.IO.Path]::GetFullPath($ReleaseDirectory)
}
$portableExe = Join-Path $distDirectory 'GrokBuildWebUI.exe'
$setupExe = Join-Path $distDirectory 'GrokBuildWebUI-Setup-v1.0.0.exe'
foreach ($path in @($portableExe, $setupExe)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "找不到构建产物：$path"
    }
}

$packageName = 'GrokBuildWebUI-v1.0.0'
$packageDirectory = Join-Path $releaseDirectory $packageName
$portableOutput = Join-Path $releaseDirectory 'GrokBuildWebUI-v1.0.0.exe'
$setupOutput = Join-Path $releaseDirectory 'GrokBuildWebUI-Setup-v1.0.0.exe'
$zipOutput = Join-Path $releaseDirectory 'GrokBuildWebUI-v1.0.0-windows-x64.zip'
foreach ($path in @($packageDirectory, $zipOutput)) {
    if (Test-Path -LiteralPath $path) {
        throw "發行檔案已存在，未覆蓋：$path"
    }
}

New-Item -ItemType Directory -Path $packageDirectory -Force | Out-Null
foreach ($pair in @(
    [PSCustomObject]@{ Source = $portableExe; Destination = $portableOutput },
    [PSCustomObject]@{ Source = $setupExe; Destination = $setupOutput }
)) {
    $source = $pair.Source
    $destination = $pair.Destination
    if (Test-Path -LiteralPath $destination -PathType Leaf) {
        $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
        $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
        if ($sourceHash -ne $destinationHash) {
            throw "發行檔與目前建置產物不一致，未覆蓋：$destination"
        }
    } else {
        Copy-Item -LiteralPath $source -Destination $destination
    }
}
Copy-Item -LiteralPath $portableExe -Destination (Join-Path $packageDirectory 'GrokBuildWebUI.exe')
foreach ($document in @('README.md', 'README.en.md', 'README.ja.md', 'README.zh-TW.md', 'NOTICE.md')) {
    Copy-Item -LiteralPath (Join-Path $repositoryRoot $document) -Destination $packageDirectory
}
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'static\fonts\NOTICE.md') -Destination (Join-Path $packageDirectory 'MiSans-FONT-NOTICE.md')
Compress-Archive -Path (Join-Path $packageDirectory '*') -DestinationPath $zipOutput -CompressionLevel Optimal

Get-Item -LiteralPath $portableOutput, $setupOutput, $zipOutput | Select-Object FullName, Length

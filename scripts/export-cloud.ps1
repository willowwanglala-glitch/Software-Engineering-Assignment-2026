# Export cloud DB import JSON (no Node.js / npm required)
# Usage: powershell -File scripts/export-cloud.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourceDir = Join-Path $Root 'data\source'
$OutDir = Join-Path $Root 'data\export\cloud-import'
$TplDir = Join-Path $Root 'scripts\templates'

function Read-JsonFile($path) {
  if (-not (Test-Path $path)) { throw "Missing: $path" }
  return (Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Ensure-Array($data) {
  if ($null -eq $data) { return @() }
  if ($data -isnot [System.Array]) { return @($data) }
  return $data
}

function Write-Utf8NoBom($path, $content) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
}

$meta = Read-JsonFile (Join-Path $SourceDir 'meta.json')
$directions = Ensure-Array (Read-JsonFile (Join-Path $SourceDir 'directions.json'))
$universities = Ensure-Array (Read-JsonFile (Join-Path $SourceDir 'universities.json'))
$faqs = Ensure-Array (Read-JsonFile (Join-Path $SourceDir 'faqs.json'))
$essaySamples = Ensure-Array (Read-JsonFile (Join-Path $SourceDir 'essay-samples.json'))
$examTypes = Ensure-Array (Read-JsonFile (Join-Path $TplDir 'exam-types.json'))
$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$dirMap = @{}
foreach ($d in $directions) { $dirMap[$d.directionId] = $d.directionName }

$univExport = @()
foreach ($u in $universities) {
  $obj = [ordered]@{}
  $u.PSObject.Properties | ForEach-Object { $obj[$_.Name] = $_.Value }
  $obj['examTypes'] = $examTypes
  $ids = @()
  if ($u.directionIds) { $ids = Ensure-Array $u.directionIds }
  if (-not $ids.Count) { $ids = @($directions | ForEach-Object { $_.directionId }) }
  $obj['directions'] = @($ids | ForEach-Object {
    if ($dirMap.ContainsKey($_)) {
      @{ directionId = $_; directionName = $dirMap[$_] }
    }
  } | Where-Object { $_ })
  $obj['createdAt'] = $now
  $univExport += [pscustomobject]$obj
}

$faqExport = @($faqs | ForEach-Object {
  $o = $_ | Select-Object *
  $o | Add-Member -NotePropertyName createdAt -NotePropertyValue $now -Force
  $o
})

$essayExport = @($essaySamples | ForEach-Object {
  $o = $_ | Select-Object *
  $o | Add-Member -NotePropertyName createdAt -NotePropertyValue $now -Force
  $o
})

# 云控制台要求 JSON Lines：每行一条 JSON 对象（不是数组）
function Write-JsonLines($path, $items) {
  $lines = foreach ($item in $items) {
    (ConvertTo-Json -InputObject $item -Depth 25 -Compress)
  }
  Write-Utf8NoBom $path (($lines -join "`n") + "`n")
}

Write-JsonLines (Join-Path $OutDir 'universities.json') $univExport
Write-JsonLines (Join-Path $OutDir 'faqs.json') $faqExport
Write-JsonLines (Join-Path $OutDir 'essay_samples.json') $essayExport

$readmeTpl = Get-Content (Join-Path $TplDir 'export-readme.md') -Raw -Encoding UTF8
$readme = $readmeTpl -replace '\{\{TIME\}\}', (Get-Date).ToUniversalTime().ToString('o') `
  -replace '\{\{VERSION\}\}', $meta.version `
  -replace '\{\{UNIV\}\}', $univExport.Count `
  -replace '\{\{FAQ\}\}', $faqExport.Count `
  -replace '\{\{ESSAY\}\}', $essayExport.Count
Write-Utf8NoBom (Join-Path $OutDir 'README.md') $readme

Write-Host "Done -> $OutDir"
Write-Host "  universities: $($univExport.Count)"
Write-Host "  faqs:         $($faqExport.Count)"
Write-Host "  essays:       $($essayExport.Count)"

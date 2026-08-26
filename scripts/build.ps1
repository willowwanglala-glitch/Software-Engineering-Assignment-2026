# 英语考研宝 — 数据构建脚本（无需 Node.js / npm）
# 用法: powershell -ExecutionPolicy Bypass -File scripts/build.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourceDir = Join-Path $Root 'data\source'

function Read-JsonFile($name) {
  $path = Join-Path $SourceDir $name
  if (-not (Test-Path $path)) { throw "缺少文件: $path" }
  $raw = Get-Content $path -Raw -Encoding UTF8
  return ($raw | ConvertFrom-Json)
}

function Ensure-Array($data) {
  if ($null -eq $data) { return @() }
  if ($data -isnot [System.Array]) { return @($data) }
  return $data
}

function To-JsJson($obj) {
  # 与 Node JSON.stringify(obj, null, 2) 一致
  # 必须用 -InputObject：管道传入数组时 ConvertTo-Json 会逐元素序列化并可能输出空
  $json = ConvertTo-Json -InputObject $obj -Depth 20 -Compress:$false
  if ([string]::IsNullOrWhiteSpace($json)) {
    throw 'To-JsJson 输出为空，拒绝写入以避免损坏目标文件'
  }
  return $json
}

function Write-Utf8NoBom($path, $content) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
}

function Read-Template($name) {
  $path = Join-Path $Root "scripts\templates\$name"
  if (-not (Test-Path $path)) { throw "缺少模板: $path" }
  return Get-Content $path -Raw -Encoding UTF8
}

Write-Host '读取数据源...'
$meta = Read-JsonFile 'meta.json'
$directions = Ensure-Array (Read-JsonFile 'directions.json')
$universities = Ensure-Array (Read-JsonFile 'universities.json')
$faqs = Ensure-Array (Read-JsonFile 'faqs.json')
$essaySamples = Ensure-Array (Read-JsonFile 'essay-samples.json')

Write-Host "  院校 $($universities.Count) | FAQ $($faqs.Count) | 范文 $($essaySamples.Count)"

# --- 生成 catalog.js ---
$catalogHeader = (Read-Template 'catalog-header.js') -replace '\{\{VERSION\}\}', $meta.version -replace '\{\{UPDATED_AT\}\}', $meta.updatedAt

$directionsJson = To-JsJson $directions
$universitiesJson = To-JsJson $universities
$catalogSuffix = Read-Template 'catalog-suffix.js'

$catalogJs = $catalogHeader +
  "const DIRECTIONS = $directionsJson;`n`n" +
  "const UNIVERSITY_RAW = $universitiesJson;" +
  $catalogSuffix
$catalogTargets = @(
  (Join-Path $Root 'miniprogram\utils\catalog.js'),
  (Join-Path $Root 'cloudfunctions\backendApi\catalog.js')
)
foreach ($t in $catalogTargets) {
  Write-Utf8NoBom $t $catalogJs
  Write-Host "生成 $t"
}

# --- 生成 seedData.js ---
$seedHeader = (Read-Template 'seed-header.js') -replace '\{\{VERSION\}\}', $meta.version -replace '\{\{UPDATED_AT\}\}', $meta.updatedAt

$faqsJson = To-JsJson $faqs
$essaySamplesJson = To-JsJson $essaySamples
$seedSuffix = Read-Template 'seed-suffix.js'

$seedJs = $seedHeader +
  "const FAQS = $faqsJson;`n`n" +
  "const ESSAY_SAMPLES = $essaySamplesJson;" +
  $seedSuffix
$seedTargets = @(
  (Join-Path $Root 'miniprogram\utils\seedData.js'),
  (Join-Path $Root 'cloudfunctions\backendApi\seedData.js')
)
foreach ($t in $seedTargets) {
  Write-Utf8NoBom $t $seedJs
  Write-Host "生成 $t"
}

# manifest
$exportDir = Join-Path $Root 'data\export'
New-Item -ItemType Directory -Force -Path $exportDir | Out-Null
$manifest = @{
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  version = $meta.version
  counts = @{
    directions = $directions.Count
    universities = $universities.Count
    faqs = $faqs.Count
    essaySamples = $essaySamples.Count
  }
}
$manifestJson = $manifest | ConvertTo-Json -Depth 5
Write-Utf8NoBom (Join-Path $exportDir 'manifest.json') $manifestJson

Write-Host ''
Write-Host '构建完成!' -ForegroundColor Green

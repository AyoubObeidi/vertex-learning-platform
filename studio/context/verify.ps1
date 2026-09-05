<#
.SYNOPSIS
  Checks that the Sanity Context MCP endpoint is live and serving our config.

.DESCRIPTION
  Reads SANITY_CONTEXT_MCP_URL and SANITY_API_READ_TOKEN out of web/.env.local
  and runs the two checks from README.md:

    1. tools/list        -- is the endpoint reachable, and is the Studio deployed?
    2. /initial-context   -- is our search config actually being applied?

  In PowerShell `curl` is an alias for Invoke-WebRequest, which does not take
  curl's -H or -d. That is why this exists rather than a one-line curl: use
  `curl.exe` if you want the bash form verbatim.

.EXAMPLE
  pwsh studio/context/verify.ps1
#>
[CmdletBinding()]
param(
  # Defaults to web/.env.local relative to the repository root.
  [string]$EnvFile
)

$ErrorActionPreference = 'Stop'

if (-not $EnvFile) {
  $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  $EnvFile = Join-Path $repoRoot 'web\.env.local'
}

if (-not (Test-Path $EnvFile)) {
  throw "No env file at $EnvFile. Copy the web block of .env.example into it first."
}

$values = @{}
foreach ($line in Get-Content $EnvFile) {
  if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') {
    $values[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}

$url = $values['SANITY_CONTEXT_MCP_URL']
$token = $values['SANITY_API_READ_TOKEN']

if (-not $url) { throw "SANITY_CONTEXT_MCP_URL is not set in $EnvFile" }
if (-not $token) { throw "SANITY_API_READ_TOKEN is not set in $EnvFile" }

Write-Host "Endpoint: $url" -ForegroundColor Cyan

# --- 1. tools/list ----------------------------------------------------------
# A "deployed Studio applications" error here means `npx sanity deploy` has not
# been run for this dataset -- a schema-only deploy is not enough.
$headers = @{
  Authorization = "Bearer $token"
  Accept        = 'application/json, text/event-stream'
}

$response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers `
  -ContentType 'application/json' `
  -Body '{"jsonrpc":"2.0","method":"tools/list","id":1}'

if ($response.error) {
  Write-Host "tools/list failed: $($response.error.message)" -ForegroundColor Red
  exit 1
}

$tools = @($response.result.tools | ForEach-Object { $_.name })
Write-Host "Tools: $($tools -join ', ')" -ForegroundColor Green

foreach ($expected in 'initial_context', 'groq_query', 'schema_explorer') {
  if ($tools -notcontains $expected) {
    Write-Host "Missing expected tool: $expected" -ForegroundColor Red
    exit 1
  }
}

# --- 2. initial-context -----------------------------------------------------
# This is exactly what the search route injects into the system prompt, so it is
# the fastest way to confirm an edit to agent-context.mjs actually landed.
$initialContext = Invoke-RestMethod -Uri "$url/initial-context" `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Initial context: $($initialContext.Length) bytes" -ForegroundColor Green

if ($initialContext -notmatch 'A lesson does not store its course') {
  Write-Host "Our instructions are NOT being applied -- check the slug on the URL." -ForegroundColor Red
  exit 1
}

Write-Host "Search config is applied." -ForegroundColor Green

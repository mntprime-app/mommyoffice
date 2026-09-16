# Sets requireSignedURLs=false on ALL Cloudflare Stream videos.
# Run this ONCE after switching /api/stream/token to direct embed mode.
# Enrollment security is enforced by the Supabase gate in /api/stream/token.
#
# Run from mommyoffice folder: .\disable-signed-urls.ps1

$lines    = Get-Content ".env.local"
$apiToken = ($lines | Where-Object { $_ -match "^CF_STREAM_API_TOKEN=" }) -replace "^CF_STREAM_API_TOKEN=", ""
$accountId = "642ba259ca6ae24cd02dc58ef37bf84e"
$headers  = @{ "Authorization" = "Bearer $apiToken"; "Content-Type" = "application/json" }

if (-not $apiToken) {
    Write-Host "ERROR: CF_STREAM_API_TOKEN not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching CF Stream video list..." -ForegroundColor Cyan
$listResp = Invoke-RestMethod `
    -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/stream?limit=50" `
    -Method GET -Headers $headers

if (-not $listResp.success) {
    Write-Host "ERROR: CF API call failed:" -ForegroundColor Red
    $listResp.errors | ForEach-Object { Write-Host $_ }
    exit 1
}

Write-Host "Setting requireSignedURLs=false on $($listResp.result.Count) video(s)..." -ForegroundColor Cyan

foreach ($video in $listResp.result) {
    $r = Invoke-RestMethod `
        -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/stream/$($video.uid)" `
        -Method POST -Headers $headers `
        -Body '{"requireSignedURLs":false}'

    $ok = $r.result.requireSignedURLs -eq $false
    $name = if ($video.meta.name) { $video.meta.name } else { $video.uid }
    Write-Host "  $(if ($ok) { '✅ OK' } else { '❌ FAILED' }) — $name" `
        -ForegroundColor $(if ($ok) { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "Done. CF videos no longer require signed tokens." -ForegroundColor Green
Write-Host "Security: /api/stream/token Supabase enrollment gate is still enforced." -ForegroundColor Cyan

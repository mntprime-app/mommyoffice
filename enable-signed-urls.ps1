# Re-enables requireSignedURLs on ALL CF Stream videos — proper production security
# Run from mommyoffice folder: .\enable-signed-urls.ps1

$lines     = Get-Content ".env.local"
$apiToken  = ($lines | Where-Object { $_ -match "^CF_STREAM_API_TOKEN=" }) -replace "^CF_STREAM_API_TOKEN=", ""
$accountId = "642ba259ca6ae24cd02dc58ef37bf84e"
$headers   = @{ "Authorization" = "Bearer $apiToken"; "Content-Type" = "application/json" }

if (-not $apiToken) { Write-Host "ERROR: CF_STREAM_API_TOKEN not found" -ForegroundColor Red; exit 1 }

$listResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/stream?limit=50" -Method GET -Headers $headers
Write-Host "Enabling requireSignedURLs on $($listResp.result.Count) videos..." -ForegroundColor Cyan

foreach ($video in $listResp.result) {
    $r = Invoke-RestMethod `
        -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/stream/$($video.uid)" `
        -Method POST -Headers $headers `
        -Body '{"requireSignedURLs":true}'
    $ok = $r.result.requireSignedURLs -eq $true
    Write-Host "  $(if ($ok) { 'OK' } else { 'FAILED' }) - $($video.meta.name)" -ForegroundColor $(if ($ok) { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "Done. Videos now require valid signed tokens to play." -ForegroundColor Green

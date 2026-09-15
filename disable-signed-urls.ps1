# Disables requireSignedURLs on ALL CF Stream videos so direct embed works
# Run from mommyoffice folder: .\disable-signed-urls.ps1

$lines     = Get-Content ".env.local"
$apiToken  = ($lines | Where-Object { $_ -match "^CF_STREAM_API_TOKEN=" }) -replace "^CF_STREAM_API_TOKEN=", ""
$accountId = "642ba259ca6ae24cd02dc58ef37bf84e"
$headers   = @{ "Authorization" = "Bearer $apiToken"; "Content-Type" = "application/json" }

if (-not $apiToken) { Write-Host "ERROR: CF_STREAM_API_TOKEN not found" -ForegroundColor Red; exit 1 }

Write-Host "Fetching CF Stream video list..." -ForegroundColor Cyan
$listResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/stream?limit=50" -Method GET -Headers $headers

if (-not $listResp.success) {
    Write-Host "ERROR: $($listResp.errors | ConvertTo-Json)" -ForegroundColor Red; exit 1
}

Write-Host "Found $($listResp.result.Count) video(s)." -ForegroundColor Cyan
Write-Host ""

foreach ($video in $listResp.result) {
    $uid  = $video.uid
    $name = $video.meta.name
    $req  = $video.requireSignedURLs
    Write-Host "  $name ($uid)" -ForegroundColor White
    Write-Host "  requireSignedURLs: $req" -ForegroundColor $(if ($req) { "Yellow" } else { "Green" })

    if ($req) {
        $r = Invoke-RestMethod `
            -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/stream/$uid" `
            -Method POST -Headers $headers `
            -Body '{"requireSignedURLs":false}'
        $ok = $r.result.requireSignedURLs -eq $false
        Write-Host "  Disabled: $(if ($ok) { 'OK' } else { 'FAILED' })" -ForegroundColor $(if ($ok) { "Green" } else { "Red" })
    } else {
        Write-Host "  Already public - no change needed" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "Done. Videos are now publicly embeddable (access still gated by MO enrollment check)." -ForegroundColor Green

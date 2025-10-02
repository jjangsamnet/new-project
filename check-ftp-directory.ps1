# FTP Directory Check Script

$ftpServer = "ftp://data4u4u.mycafe24.com"
$ftpUsername = "data4u4u"
$ftpPassword = "wkd23772377"

$credential = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)

# Test different common paths
$pathsToTest = @(
    "/",
    "/www",
    "/public_html",
    "/html",
    "/htdocs",
    "/web"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing FTP Directory Paths" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($path in $pathsToTest) {
    try {
        $ftpUri = "$ftpServer$path"
        Write-Host "Testing: $ftpUri" -ForegroundColor Yellow

        $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
        $ftpRequest.Credentials = $credential
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory

        $response = $ftpRequest.GetResponse()
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $files = $reader.ReadToEnd()
        $reader.Close()
        $response.Close()

        Write-Host "  SUCCESS! Contents:" -ForegroundColor Green
        Write-Host $files -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Recommendation:" -ForegroundColor Cyan
Write-Host "Use the path that shows SUCCESS above" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

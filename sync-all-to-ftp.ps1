# Sync All Files to FTP Server
# This script uploads all necessary files to ensure server is up-to-date

$ftpServer = "ftp://data4u4u.mycafe24.com"
$ftpUsername = "data4u4u"
$ftpPassword = "wkd23772377"
$localPath = $PSScriptRoot

$credential = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)

# All files to upload
$filesToUpload = @(
    "index.html",
    "lms.html",
    "admin.html",
    "course-learning.html",
    "firebase-test.html",
    "script.js",
    "lms-script.js",
    "admin-script.js",
    "course-learning-script.js",
    "firebase-service.js",
    "firebase-config.js",
    "firebase-config.example.js",
    "firebase-app-check.js",
    "crypto-utils.js",
    "error-handler.js",
    "validation-utils.js",
    "url-sanitizer.js",
    "file-validator.js",
    "rate-limiter.js",
    "loading-indicator.js",
    "admin-config.example.js",
    "styles.css",
    "lms-styles.css",
    "admin-styles.css",
    "course-learning-styles.css"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Full Sync to FTP Server" -ForegroundColor Cyan
Write-Host "Server: $ftpServer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalFiles = $filesToUpload.Count
$successCount = 0
$failCount = 0
$skippedCount = 0

foreach ($file in $filesToUpload) {
    $localFile = Join-Path $localPath $file

    if (!(Test-Path $localFile)) {
        Write-Host "SKIP: $file (not found)" -ForegroundColor DarkGray
        $skippedCount++
        continue
    }

    try {
        $ftpUri = "$ftpServer/$file"
        Write-Host "Uploading: $file..." -ForegroundColor Yellow -NoNewline

        $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
        $ftpRequest.Credentials = $credential
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftpRequest.UseBinary = $true
        $ftpRequest.KeepAlive = $false

        $fileContent = [System.IO.File]::ReadAllBytes($localFile)
        $ftpRequest.ContentLength = $fileContent.Length

        $requestStream = $ftpRequest.GetRequestStream()
        $requestStream.Write($fileContent, 0, $fileContent.Length)
        $requestStream.Close()

        $response = $ftpRequest.GetResponse()
        $fileSize = [math]::Round($fileContent.Length / 1KB, 2)
        Write-Host " OK ($fileSize KB)" -ForegroundColor Green
        $response.Close()

        $successCount++
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $failCount++
    }

    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sync Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total:    $totalFiles files" -ForegroundColor White
Write-Host "Success:  $successCount files" -ForegroundColor Green
Write-Host "Failed:   $failCount files" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "Skipped:  $skippedCount files" -ForegroundColor DarkGray
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "WARNING: Some files failed to upload" -ForegroundColor Yellow
} else {
    Write-Host "SUCCESS: All files synced!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Website: http://data4u4u.mycafe24.com/lms.html" -ForegroundColor Cyan

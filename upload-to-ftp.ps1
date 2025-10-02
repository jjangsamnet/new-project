# FTP Upload Script for Cafe24 Hosting
# Usage: Run .\upload-to-ftp.ps1 in PowerShell

$ftpServer = "ftp://data4u4u.mycafe24.com"
$ftpUsername = "data4u4u"
$ftpPassword = "wkd23772377"
$localPath = $PSScriptRoot
$remotePath = ""

# Files to upload
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
    "admin-config.example.js",
    "crypto-utils.js",
    "error-handler.js",
    "validation-utils.js",
    "loading-indicator.js",
    "url-sanitizer.js",
    "file-validator.js",
    "rate-limiter.js",
    "styles.css",
    "lms-styles.css",
    "admin-styles.css",
    "course-learning-styles.css"
)

$credential = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FTP Upload Starting: $ftpServer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($file in $filesToUpload) {
    $localFile = Join-Path $localPath $file

    if (Test-Path $localFile) {
        try {
            $ftpUri = "$ftpServer$remotePath/$file"
            Write-Host "Uploading: $file -> $ftpUri" -ForegroundColor Yellow

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
            Write-Host "  Success: $($response.StatusDescription.Trim())" -ForegroundColor Green
            $response.Close()

            $successCount++
        }
        catch {
            Write-Host "  Failed: $_" -ForegroundColor Red
            $failCount++
        }
    }
    else {
        Write-Host "  File not found: $file" -ForegroundColor DarkYellow
        $failCount++
    }

    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Upload Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Success: $successCount files" -ForegroundColor Green
Write-Host "Failed: $failCount files" -ForegroundColor Red
Write-Host ""
Write-Host "IMPORTANT: Create these files on the server:" -ForegroundColor Yellow
Write-Host "1. firebase-config.local.js" -ForegroundColor Yellow
Write-Host "2. admin-config.local.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access Cafe24 File Manager: https://www.cafe24.com" -ForegroundColor Cyan

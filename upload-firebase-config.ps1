# Upload Firebase Config to FTP Server

$ftpServer = "ftp://data4u4u.mycafe24.com"
$ftpUsername = "data4u4u"
$ftpPassword = "wkd23772377"
$localPath = $PSScriptRoot

$credential = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)

# Firebase config content
$firebaseConfigContent = @"
// 로컬 Firebase 설정 파일
// 이 파일은 .gitignore에 의해 Git에서 제외됩니다.

const firebaseConfigLocal = {
    apiKey: "AIzaSyAW1hX726N0EQv6uW0_6yUyGCsWylYlEEI",
    authDomain: "lms-26168.firebaseapp.com",
    databaseURL: "https://lms-26168-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "lms-26168",
    storageBucket: "lms-26168.firebasestorage.app",
    messagingSenderId: "264403082469",
    appId: "1:264403082469:web:74f35eaec8e2c2f322080c",
    measurementId: "G-9XGFHD0R9P"
};

// 이 설정은 firebase-config.js에서 자동으로 로드됩니다.
"@

# Admin config content
$adminConfigContent = @"
// 관리자 계정 설정 파일 (로컬 개발 환경 전용)
// 이 파일은 Git에 커밋하지 마세요!

window.ADMIN_CONFIG = {
    // localStorage 모드에서 사용할 관리자 계정
    username: 'jjangsam',
    password: '16181618wkd'
};
"@

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Uploading Config Files to Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Upload firebase-config.local.js
try {
    $ftpUri = "$ftpServer/firebase-config.local.js"
    Write-Host "Uploading: firebase-config.local.js" -ForegroundColor Yellow

    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
    $ftpRequest.Credentials = $credential
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $ftpRequest.UseBinary = $true
    $ftpRequest.KeepAlive = $false

    $fileContent = [System.Text.Encoding]::UTF8.GetBytes($firebaseConfigContent)
    $ftpRequest.ContentLength = $fileContent.Length

    $requestStream = $ftpRequest.GetRequestStream()
    $requestStream.Write($fileContent, 0, $fileContent.Length)
    $requestStream.Close()

    $response = $ftpRequest.GetResponse()
    Write-Host "  Success: firebase-config.local.js uploaded" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "  Failed: $_" -ForegroundColor Red
}

# Upload admin-config.local.js
try {
    $ftpUri = "$ftpServer/admin-config.local.js"
    Write-Host "Uploading: admin-config.local.js" -ForegroundColor Yellow

    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
    $ftpRequest.Credentials = $credential
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $ftpRequest.UseBinary = $true
    $ftpRequest.KeepAlive = $false

    $fileContent = [System.Text.Encoding]::UTF8.GetBytes($adminConfigContent)
    $ftpRequest.ContentLength = $fileContent.Length

    $requestStream = $ftpRequest.GetRequestStream()
    $requestStream.Write($fileContent, 0, $fileContent.Length)
    $requestStream.Close()

    $response = $ftpRequest.GetResponse()
    Write-Host "  Success: admin-config.local.js uploaded" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "  Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Config Upload Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your website is now live at:" -ForegroundColor Green
Write-Host "http://data4u4u.mycafe24.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pages available:" -ForegroundColor Yellow
Write-Host "- http://data4u4u.mycafe24.com/index.html (Project Management)" -ForegroundColor Gray
Write-Host "- http://data4u4u.mycafe24.com/lms.html (Learning Management System)" -ForegroundColor Gray
Write-Host "- http://data4u4u.mycafe24.com/admin.html (Admin Dashboard)" -ForegroundColor Gray
Write-Host "- http://data4u4u.mycafe24.com/course-learning.html (Course Learning)" -ForegroundColor Gray

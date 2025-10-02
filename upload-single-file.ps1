# Upload Single File to FTP Server

param(
    [Parameter(Mandatory=$true)]
    [string]$FileName
)

$ftpServer = "ftp://data4u4u.mycafe24.com"
$ftpUsername = "data4u4u"
$ftpPassword = "wkd23772377"
$localPath = $PSScriptRoot

$credential = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)

$localFile = Join-Path $localPath $FileName

if (!(Test-Path $localFile)) {
    Write-Host "Error: File not found - $localFile" -ForegroundColor Red
    exit 1
}

try {
    $ftpUri = "$ftpServer/$FileName"
    Write-Host "Uploading: $FileName -> $ftpUri" -ForegroundColor Yellow

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
    Write-Host "Success: $($response.StatusDescription.Trim())" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "Failed: $_" -ForegroundColor Red
    exit 1
}

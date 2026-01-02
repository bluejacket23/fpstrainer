# Quick script to help you add FFmpeg layer
# This opens the AWS Lambda Console to the frame-extractor function

Write-Host "Finding frame-extractor Lambda function..." -ForegroundColor Cyan

# Get the function name from amplify_outputs or construct it
$functionName = "amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda"

Write-Host ""
Write-Host "To add FFmpeg layer:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions" -ForegroundColor White
Write-Host "2. Search for: frame-extractor" -ForegroundColor White
Write-Host "3. Click on the function" -ForegroundColor White
Write-Host "4. Scroll to 'Layers' section" -ForegroundColor White
Write-Host "5. Click 'Add a layer'" -ForegroundColor White
Write-Host "6. Choose 'Specify an ARN'" -ForegroundColor White
Write-Host "7. Enter: arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4" -ForegroundColor White
Write-Host "8. Click 'Add'" -ForegroundColor White
Write-Host ""
Write-Host "OR try 'AWS layers' and search for 'ffmpeg'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Function name: $functionName" -ForegroundColor Green

# Try to open the console (may not work on all systems)
$consoleUrl = "https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions"
Write-Host ""
Write-Host "Opening AWS Lambda Console..." -ForegroundColor Cyan
Start-Process $consoleUrl


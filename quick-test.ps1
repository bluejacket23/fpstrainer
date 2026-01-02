# Quick verification script before testing
Write-Host "`n=== Pre-Flight Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if frontend is running
Write-Host "1. Frontend Status:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Frontend is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Frontend not running. Start it with: npm run dev" -ForegroundColor Red
}

Write-Host "`n2. Next Steps:" -ForegroundColor Yellow
Write-Host "   a) Verify environment variables are set in Lambda functions" -ForegroundColor White
Write-Host "   b) Check S3 trigger is configured for frame-extractor" -ForegroundColor White
Write-Host "   c) Start frontend: npm run dev" -ForegroundColor White
Write-Host "   d) Upload a test video" -ForegroundColor White
Write-Host "   e) Watch CloudWatch logs" -ForegroundColor White

Write-Host "`n3. Quick Links:" -ForegroundColor Yellow
Write-Host "   Lambda Console: https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions" -ForegroundColor Cyan
Write-Host "   CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups" -ForegroundColor Cyan
Write-Host "   DynamoDB Tables: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables" -ForegroundColor Cyan
Write-Host "   S3 Bucket: https://console.aws.amazon.com/s3/buckets/amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom?region=us-east-2" -ForegroundColor Cyan

Write-Host "`n4. Test Video:" -ForegroundColor Yellow
Write-Host "   - Use a short MP4 (10-60 seconds)" -ForegroundColor White
Write-Host "   - Upload via frontend at http://localhost:3000" -ForegroundColor White
Write-Host "   - Watch CloudWatch logs for processing" -ForegroundColor White

Write-Host "`n=== Ready to Test! ===" -ForegroundColor Green
Write-Host "See TEST_PIPELINE.md for detailed instructions" -ForegroundColor Cyan

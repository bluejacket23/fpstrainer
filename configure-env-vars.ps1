# Script to help configure Lambda function environment variables
# After adding FFmpeg layer, run this to set up all environment variables

Write-Host "=== Lambda Function Environment Variables Setup ===" -ForegroundColor Cyan
Write-Host ""

# Get values from amplify_outputs.json
$outputs = Get-Content "amplify_outputs.json" | ConvertFrom-Json
$bucketName = $outputs.storage.bucket_name
$region = $outputs.auth.aws_region

# Table name format: OpsCoachReport-<stack-id>
# The table name is typically: OpsCoachReport-<timestamp>-<random>
# We'll need to find it in DynamoDB console or construct it
$stackId = "amplify-opscoach-lukec-sandbox-a38e0e22ed"
$tableName = "OpsCoachReport-$stackId"

# Function names
$uploadInitFunction = "amplify-opscoach-lukec-sandbox-a38e0e22ed-function-upload-init-lambda"
$getReportFunction = "amplify-opscoach-lukec-sandbox-a38e0e22ed-function-get-report-lambda"
$aiAnalysisFunction = "amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda"
$frameExtractorFunction = "amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda"

Write-Host "Configuration Values:" -ForegroundColor Yellow
Write-Host "  Bucket Name: $bucketName" -ForegroundColor White
Write-Host "  Region: $region" -ForegroundColor White
Write-Host "  Table Name: $tableName (verify in DynamoDB console)" -ForegroundColor White
Write-Host ""

Write-Host "=== Environment Variables to Set ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. upload-init Function:" -ForegroundColor Yellow
Write-Host "   TABLE_NAME = $tableName" -ForegroundColor White
Write-Host "   BUCKET_NAME = $bucketName" -ForegroundColor White
Write-Host ""

Write-Host "2. get-report Function:" -ForegroundColor Yellow
Write-Host "   TABLE_NAME = $tableName" -ForegroundColor White
Write-Host ""

Write-Host "3. ai-analysis Function:" -ForegroundColor Yellow
Write-Host "   TABLE_NAME = $tableName" -ForegroundColor White
Write-Host "   BUCKET_NAME = $bucketName" -ForegroundColor White
Write-Host "   OPENAI_API_KEY = (already set from secrets)" -ForegroundColor Green
Write-Host ""

Write-Host "4. frame-extractor Function:" -ForegroundColor Yellow
Write-Host "   BUCKET_NAME = $bucketName" -ForegroundColor White
Write-Host "   AI_FUNCTION_NAME = $aiAnalysisFunction" -ForegroundColor White
Write-Host ""

Write-Host "=== Quick Setup Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: AWS Console (Easiest)" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.aws.amazon.com/lambda/home?region=$region" -ForegroundColor White
Write-Host "2. For each function above, click it → Configuration → Environment variables" -ForegroundColor White
Write-Host "3. Add the variables listed above" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: AWS CLI (Faster if you have it configured)" -ForegroundColor Yellow
Write-Host "Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "# upload-init" -ForegroundColor Gray
Write-Host "aws lambda update-function-configuration --function-name $uploadInitFunction --environment Variables={TABLE_NAME=$tableName,BUCKET_NAME=$bucketName} --region $region" -ForegroundColor White
Write-Host ""
Write-Host "# get-report" -ForegroundColor Gray
Write-Host "aws lambda update-function-configuration --function-name $getReportFunction --environment Variables={TABLE_NAME=$tableName} --region $region" -ForegroundColor White
Write-Host ""
Write-Host "# ai-analysis" -ForegroundColor Gray
Write-Host "aws lambda update-function-configuration --function-name $aiAnalysisFunction --environment Variables={TABLE_NAME=$tableName,BUCKET_NAME=$bucketName} --region $region" -ForegroundColor White
Write-Host ""
Write-Host "# frame-extractor" -ForegroundColor Gray
Write-Host "aws lambda update-function-configuration --function-name $frameExtractorFunction --environment Variables={BUCKET_NAME=$bucketName,AI_FUNCTION_NAME=$aiAnalysisFunction} --region $region" -ForegroundColor White
Write-Host ""

Write-Host "=== Important: Find Actual Table Name ===" -ForegroundColor Red
Write-Host "The table name might be different. Check DynamoDB console:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/dynamodbv2/home?region=$region#tables" -ForegroundColor White
Write-Host "Look for a table starting with 'OpsCoachReport'" -ForegroundColor White
Write-Host ""

# Try to open the Lambda console
Write-Host "Opening Lambda Console..." -ForegroundColor Cyan
Start-Process "https://console.aws.amazon.com/lambda/home?region=$region#/functions"


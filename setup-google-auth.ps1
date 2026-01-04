# ============================================
# FPSTrainer - Google OAuth Setup Script
# ============================================
# This script helps you set up Google Sign-In for FPSTrainer
# 
# Prerequisites:
# 1. AWS CLI installed and configured
# 2. Google Cloud Console account

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FPSTrainer - Google OAuth Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get region
$region = "us-east-2"  # Your Amplify region

Write-Host "This script will help you set up Google Sign-In." -ForegroundColor Yellow
Write-Host ""
Write-Host "STEP 1: Create Google OAuth Credentials" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host ""
Write-Host "2. If you don't have a project, create one:" -ForegroundColor White
Write-Host "   - Click 'Create Project'" -ForegroundColor Gray
Write-Host "   - Name it 'FPSTrainer'" -ForegroundColor Gray
Write-Host "   - Click 'Create'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure OAuth Consent Screen:" -ForegroundColor White
Write-Host "   - Go to 'OAuth consent screen' in the left menu" -ForegroundColor Gray
Write-Host "   - Choose 'External' user type, click Create" -ForegroundColor Gray
Write-Host "   - App name: 'FPSTrainer'" -ForegroundColor Gray
Write-Host "   - User support email: Your email" -ForegroundColor Gray
Write-Host "   - Developer contact: Your email" -ForegroundColor Gray
Write-Host "   - Click 'Save and Continue'" -ForegroundColor Gray
Write-Host "   - On Scopes page, click 'Add or Remove Scopes'" -ForegroundColor Gray
Write-Host "   - Select: email, profile, openid" -ForegroundColor Gray
Write-Host "   - Click 'Save and Continue' through the rest" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Create OAuth Client ID:" -ForegroundColor White
Write-Host "   - Go to 'Credentials' in the left menu" -ForegroundColor Gray
Write-Host "   - Click '+ CREATE CREDENTIALS' -> 'OAuth client ID'" -ForegroundColor Gray
Write-Host "   - Application type: 'Web application'" -ForegroundColor Gray
Write-Host "   - Name: 'FPSTrainer Web'" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Add Authorized JavaScript origins:" -ForegroundColor White
Write-Host "   - http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - https://fpstrainer.com" -ForegroundColor Cyan
Write-Host "   - https://www.fpstrainer.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Add Authorized redirect URIs (IMPORTANT!):" -ForegroundColor White
Write-Host "   You'll need to add your Cognito callback URL." -ForegroundColor Yellow
Write-Host "   After running 'npx ampx sandbox' or deploying, check Cognito for the exact URL." -ForegroundColor Yellow
Write-Host "   It will look like:" -ForegroundColor Gray
Write-Host "   https://YOUR-COGNITO-DOMAIN.auth.us-east-2.amazoncognito.com/oauth2/idpresponse" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Also add:" -ForegroundColor White
Write-Host "   - http://localhost:3000/" -ForegroundColor Cyan
Write-Host "   - http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "   - https://fpstrainer.com/" -ForegroundColor Cyan
Write-Host "   - https://fpstrainer.com/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "7. Click 'Create' and copy the Client ID and Client Secret" -ForegroundColor White
Write-Host ""

# Prompt for credentials
Write-Host "STEP 2: Enter Your Google OAuth Credentials" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

$clientId = Read-Host "Enter your Google Client ID"
$clientSecret = Read-Host "Enter your Google Client Secret"

if ([string]::IsNullOrWhiteSpace($clientId) -or [string]::IsNullOrWhiteSpace($clientSecret)) {
    Write-Host ""
    Write-Host "Error: Both Client ID and Client Secret are required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 3: Storing Secrets in AWS Secrets Manager" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Create/update secrets in AWS Secrets Manager
Write-Host "Creating GOOGLE_CLIENT_ID secret..." -ForegroundColor Yellow

# Check if secret exists, create or update
$existingSecret = $null
try {
    $existingSecret = aws secretsmanager describe-secret --secret-id "GOOGLE_CLIENT_ID" --region $region 2>$null | ConvertFrom-Json
} catch {}

if ($existingSecret) {
    # Update existing secret
    aws secretsmanager put-secret-value `
        --secret-id "GOOGLE_CLIENT_ID" `
        --secret-string $clientId `
        --region $region
    Write-Host "  Updated existing GOOGLE_CLIENT_ID secret" -ForegroundColor Green
} else {
    # Create new secret
    aws secretsmanager create-secret `
        --name "GOOGLE_CLIENT_ID" `
        --description "Google OAuth Client ID for FPSTrainer" `
        --secret-string $clientId `
        --region $region
    Write-Host "  Created GOOGLE_CLIENT_ID secret" -ForegroundColor Green
}

Write-Host "Creating GOOGLE_CLIENT_SECRET secret..." -ForegroundColor Yellow

$existingSecret = $null
try {
    $existingSecret = aws secretsmanager describe-secret --secret-id "GOOGLE_CLIENT_SECRET" --region $region 2>$null | ConvertFrom-Json
} catch {}

if ($existingSecret) {
    # Update existing secret
    aws secretsmanager put-secret-value `
        --secret-id "GOOGLE_CLIENT_SECRET" `
        --secret-string $clientSecret `
        --region $region
    Write-Host "  Updated existing GOOGLE_CLIENT_SECRET secret" -ForegroundColor Green
} else {
    # Create new secret
    aws secretsmanager create-secret `
        --name "GOOGLE_CLIENT_SECRET" `
        --description "Google OAuth Client Secret for FPSTrainer" `
        --secret-string $clientSecret `
        --region $region
    Write-Host "  Created GOOGLE_CLIENT_SECRET secret" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx ampx sandbox" -ForegroundColor White
Write-Host "   This will deploy with Google Sign-In enabled" -ForegroundColor Gray
Write-Host ""
Write-Host "2. After deployment, check the Cognito User Pool for the callback URL" -ForegroundColor White
Write-Host "   Go to: AWS Console -> Cognito -> User Pools -> Your Pool -> App Integration" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Add the Cognito callback URL to Google Cloud Console:" -ForegroundColor White
Write-Host "   Format: https://YOUR-DOMAIN.auth.us-east-2.amazoncognito.com/oauth2/idpresponse" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test Google Sign-In on your local dev server (npm run dev)" -ForegroundColor White
Write-Host ""



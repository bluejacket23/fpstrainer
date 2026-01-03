# FPSTrainer Stripe Environment Setup Script
# Run this script after filling in your Stripe credentials

# ============================================
# FILL IN YOUR VALUES HERE
# ============================================

$STRIPE_SECRET_KEY = "sk_test_YOUR_STRIPE_SECRET_KEY_HERE"
$STRIPE_WEBHOOK_SECRET = "whsec_YOUR_WEBHOOK_SECRET_HERE"
$STRIPE_PRICE_ID_ROOKIE = "price_YOUR_ROOKIE_PRICE_ID"
$STRIPE_PRICE_ID_COMPETITIVE = "price_YOUR_COMPETITIVE_PRICE_ID"
$STRIPE_PRICE_ID_ELITE = "price_YOUR_ELITE_PRICE_ID"
$STRIPE_PRICE_ID_PRO = "price_YOUR_PRO_PRICE_ID"
$STRIPE_PRICE_ID_GOD = "price_YOUR_GOD_PRICE_ID"
$FRONTEND_URL = "https://your-app-url.com"
$USER_TABLE_NAME = "User-YOUR_TABLE_ID"

# ============================================
# DO NOT MODIFY BELOW THIS LINE
# ============================================

Write-Host "Setting up Stripe environment variables for Lambda functions..." -ForegroundColor Cyan

function Update-LambdaEnv {
    param (
        [string]$FunctionNamePattern,
        [hashtable]$EnvVars
    )
    
    Write-Host ""
    Write-Host "Searching for Lambda functions matching pattern: $FunctionNamePattern" -ForegroundColor Yellow
    
    $functions = aws lambda list-functions --query "Functions[?contains(FunctionName, '$FunctionNamePattern')].FunctionName" --output text
    
    if ($functions) {
        foreach ($functionName in $functions.Split("`t")) {
            if ($functionName -and $functionName.Trim()) {
                Write-Host "Updating function: $functionName" -ForegroundColor Green
                
                $envJson = $EnvVars | ConvertTo-Json -Compress
                
                try {
                    aws lambda update-function-configuration --function-name $functionName --environment "Variables=$envJson" --output text | Out-Null
                    Write-Host "  Updated successfully" -ForegroundColor Green
                } catch {
                    Write-Host "  Failed to update: $_" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  No functions found matching pattern" -ForegroundColor Yellow
    }
}

$checkoutEnv = @{
    STRIPE_SECRET_KEY = $STRIPE_SECRET_KEY
    STRIPE_PRICE_ID_ROOKIE = $STRIPE_PRICE_ID_ROOKIE
    STRIPE_PRICE_ID_COMPETITIVE = $STRIPE_PRICE_ID_COMPETITIVE
    STRIPE_PRICE_ID_ELITE = $STRIPE_PRICE_ID_ELITE
    STRIPE_PRICE_ID_PRO = $STRIPE_PRICE_ID_PRO
    STRIPE_PRICE_ID_GOD = $STRIPE_PRICE_ID_GOD
    FRONTEND_URL = $FRONTEND_URL
    USER_TABLE_NAME = $USER_TABLE_NAME
}

$webhookEnv = @{
    STRIPE_SECRET_KEY = $STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET = $STRIPE_WEBHOOK_SECRET
    STRIPE_PRICE_ID_ROOKIE = $STRIPE_PRICE_ID_ROOKIE
    STRIPE_PRICE_ID_COMPETITIVE = $STRIPE_PRICE_ID_COMPETITIVE
    STRIPE_PRICE_ID_ELITE = $STRIPE_PRICE_ID_ELITE
    STRIPE_PRICE_ID_PRO = $STRIPE_PRICE_ID_PRO
    STRIPE_PRICE_ID_GOD = $STRIPE_PRICE_ID_GOD
    USER_TABLE_NAME = $USER_TABLE_NAME
}

$cancelEnv = @{
    STRIPE_SECRET_KEY = $STRIPE_SECRET_KEY
    USER_TABLE_NAME = $USER_TABLE_NAME
}

$portalEnv = @{
    STRIPE_SECRET_KEY = $STRIPE_SECRET_KEY
    FRONTEND_URL = $FRONTEND_URL
    USER_TABLE_NAME = $USER_TABLE_NAME
}

Update-LambdaEnv -FunctionNamePattern "checkout-session" -EnvVars $checkoutEnv
Update-LambdaEnv -FunctionNamePattern "stripe-webhook" -EnvVars $webhookEnv
Update-LambdaEnv -FunctionNamePattern "cancel-subscription" -EnvVars $cancelEnv
Update-LambdaEnv -FunctionNamePattern "customer-portal" -EnvVars $portalEnv

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create products in Stripe Dashboard and update the price IDs above"
Write-Host "2. Set up webhook endpoint in Stripe Dashboard"
Write-Host "3. Update the webhook secret above"
Write-Host "4. Run this script again if you made changes"
Write-Host "5. Test the checkout flow with test card: 4242424242424242"

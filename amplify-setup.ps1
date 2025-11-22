# Complete Amplify Setup Script
cd C:\Users\lukec\OpsCoach\opscoach

# Auth setup - Email signin
Write-Host "Setting up Authentication..."
$authInput = @"
1
1
"@

# API setup - GraphQL API
Write-Host "Setting up GraphQL API..."
$apiInput = @"
1
2
opscoach
1
1
1
"@

# Storage setup
Write-Host "Setting up Storage..."
$storageInput = @"
1
"@

# Function setup - Upload Init
Write-Host "Setting up Lambda Functions..."
$functionInput = @"
1
uploadInit
1
"@

# Create input files
$authInput | Out-File -FilePath "auth-input.txt" -Encoding ASCII
$apiInput | Out-File -FilePath "api-input.txt" -Encoding ASCII
$storageInput | Out-File -FilePath "storage-input.txt" -Encoding ASCII
$functionInput | Out-File -FilePath "function-input.txt" -Encoding ASCII

# Run commands
Get-Content "auth-input.txt" | & amplify add auth
Get-Content "api-input.txt" | & amplify add api
Get-Content "storage-input.txt" | & amplify add storage
Get-Content "function-input.txt" | & amplify add function

# Deploy
Write-Host "Deploying resources..."
amplify push --yes

Write-Host "Setup complete! Your backend is deployed."

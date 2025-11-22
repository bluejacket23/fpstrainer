# Amplify Gen 1 Setup Script
cd C:\Users\lukec\OpsCoach\opscoach

# Add Auth
Write-Host "Adding Authentication..."
$authInput = @"
1
1
"@ | Out-File -FilePath "auth-input.txt" -Encoding ASCII
Get-Content "auth-input.txt" | & amplify add auth

# Add API
Write-Host "Adding GraphQL API..."
$apiInput = @"
1
2
opscoach
1
1
1
"@ | Out-File -FilePath "api-input.txt" -Encoding ASCII
Get-Content "api-input.txt" | & amplify add api

# Add Storage
Write-Host "Adding Storage..."
$storageInput = @"
1
"@ | Out-File -FilePath "storage-input.txt" -Encoding ASCII
Get-Content "storage-input.txt" | & amplify add storage

# Add Functions
Write-Host "Adding Lambda Functions..."
$functionInput = @"
1
uploadInit
1
"@ | Out-File -FilePath "function-input.txt" -Encoding ASCII
Get-Content "function-input.txt" | & amplify add function

Write-Host "Setup complete! Run 'amplify push' to deploy."

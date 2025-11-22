// Script to create auth resource
const { execSync } = require('child_process');

try {
  // Add auth with email signin
  console.log('Creating auth resource...');
  execSync('echo "1\\n1\\n" | amplify add auth', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('Auth resource created successfully!');
} catch (error) {
  console.error('Error creating auth:', error.message);
}

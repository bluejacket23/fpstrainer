# OpsCoach.ai

AI-Powered FPS Gameplay Coaching SaaS.

## Features
- **Upload Clips**: Drag & drop gameplay clips (max 60s).
- **AI Analysis**: GPT-4o Vision analyzes crosshair placement, positioning, and decision making.
- **Detailed Reports**: Receive a structured coaching report with scores, mistakes, and a training plan.
- **Dashboard**: Track your progress over time.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: AWS Amplify Gen 2, AWS Lambda, DynamoDB, S3
- **AI**: OpenAI GPT-4o

## Getting Started

See [DEPLOY.md](DEPLOY.md) for deployment instructions.

### Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set OpenAI Key:
   ```bash
   npx ampx sandbox secret set OPENAI_API_KEY
   ```
3. Run Sandbox:
   ```bash
   npx ampx sandbox
   ```
4. Start Frontend (in new terminal):
   ```bash
   npm run dev
   ```

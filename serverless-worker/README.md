# Vercel Serverless App

A simple serverless application deployed on Vercel.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Vercel CLI globally (if not already installed):
```bash
npm install -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

4. Set up environment variables:
```bash
vercel env add CRON_SECRET
```

## Development

To run the development server:
```bash
npm run dev
```

## Deployment

To deploy to Vercel:
```bash
npm run deploy
```

## API Endpoints

- `GET /api/hello` - Returns a greeting message
- `GET /api/cron` - Internal endpoint for the cron job (runs every minute)
- `GET /api/dump` - Endpoint that returns a greeting message, called by the cron job

## Cron Jobs

The application includes a cron job that runs every minute. The cron job:
- Is configured in `vercel.json`
- Runs at the `/api/cron` endpoint
- Uses a secret token for authentication
- Calls the `/api/dump` endpoint and logs the response
- Logs execution time

## Project Structure

- `/api` - Contains serverless functions
- `vercel.json` - Vercel configuration file
- `package.json` - Project dependencies and scripts 
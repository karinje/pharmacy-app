# Deployment Guide

## Prerequisites
- Firebase project created
- GitHub repository set up
- All secrets configured in GitHub
- Firebase CLI installed locally

## Initial Setup

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase project:
   ```bash
   firebase init
   ```

## Manual Deployment

### Deploy Everything
```bash
npm run deploy
```

### Deploy Specific Services
```bash
# Hosting only
npm run deploy:hosting

# Functions only
npm run deploy:functions

# Security rules only
npm run deploy:rules
```

## CI/CD Deployment

Deployments are automated via GitHub Actions:

- **Push to `main`**: Deploys to production
- **Pull Request**: Creates preview deployment
- **Push to `develop`**: Deploys to staging (if configured)

## Rollback Procedure

If deployment issues occur:

1. View deployment history:
   ```bash
   firebase hosting:releases:list
   ```

2. Rollback to previous version:
   ```bash
   firebase hosting:rollback
   ```

## Monitoring

- Firebase Console: https://console.firebase.google.com
- Hosting Metrics: https://console.firebase.google.com/project/[PROJECT_ID]/hosting
- Functions Logs: https://console.firebase.google.com/project/[PROJECT_ID]/functions/logs

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify Node.js version matches (18.x)
- Clear build cache: `rm -rf .svelte-kit build`

### Functions Deployment Fails
- Check function code compiles: `cd functions && npm run build`
- Verify Firebase project permissions
- Check function region and memory settings

### Hosting Not Updating
- Clear browser cache
- Check Firebase Hosting cache headers
- Verify build output in `build/` directory


# SHARD 12: Deployment & CI/CD

**Status:** 🔜 READY TO START

## Objective
Set up production deployment with Firebase Hosting and implement CI/CD pipeline with GitHub Actions.

## Dependencies
- ✅ Shard 1-11 (All previous shards) - COMPLETED

## Context from Shard 11

**Completed Testing Suite:**
- Comprehensive test infrastructure with Vitest and Playwright
- Unit tests for all services (rxnorm, fda, openai, calculation)
- Unit tests for utilities (validation, api-helpers)
- Unit tests for stores (auth, calculator)
- Integration tests (calculator-workflow, history-management)
- E2E tests (login, calculator, history)
- Test coverage configuration with v8 provider
- Test mocks for Firebase, OpenAI, and API helpers
- 87 unit/integration tests passing
- 20+ e2e tests implemented

**Key Implementation Details:**
- Test setup in `tests/setup.ts` with Firebase mocks
- Mock utilities in `tests/mocks/` directory
- Vitest config with SvelteKit support and path aliases
- Playwright config for e2e testing
- Test scripts in package.json: `test`, `test:ui`, `test:coverage`, `test:e2e`, `test:e2e:ui`
- Coverage exclusions configured for build artifacts and test files

**Test Commands Available:**
- `npm test` - Run unit/integration tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run Playwright e2e tests
- `npm run test:e2e:ui` - Run Playwright with UI

**Note for CI/CD:** All test commands are ready to be integrated into GitHub Actions workflows.

## Files to Create

```
.github/
└── workflows/
    ├── deploy.yml              # NEW: Deployment workflow
    ├── test.yml                # NEW: Testing workflow
    └── pr-check.yml            # NEW: PR validation
.firebaserc                     # MODIFY: Add environments
firebase.json                   # MODIFY: Add hosting config
.env.production                 # NEW: Production env vars
```

## Implementation Details

### 1. Firebase Hosting Configuration (`firebase.json`)
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ]
}
```

### 2. Firebase Environments (`.firebaserc`)
```json
{
  "projects": {
    "default": "ndc-calculator-prod",
    "staging": "ndc-calculator-staging",
    "dev": "ndc-calculator-dev"
  },
  "targets": {},
  "etags": {}
}
```

### 3. GitHub Actions - Test Workflow (`.github/workflows/test.yml`)
```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run check

      - name: Run unit tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
```

### 4. GitHub Actions - Deploy Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ndc-calculator-prod

      - name: Deploy Cloud Functions
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --project ndc-calculator-prod --token ${{ secrets.FIREBASE_TOKEN }}
```

### 5. GitHub Actions - PR Check (`.github/workflows/pr-check.yml`)
```yaml
name: PR Validation

on:
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run check

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

      - name: Deploy Preview
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: ndc-calculator-prod
        id: preview

      - name: Comment PR with preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed to: ${{ steps.preview.outputs.details_url }}`
            })
```

### 6. Production Environment Variables (`.env.production`)
```bash
# Firebase Production Configuration
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=ndc-calculator-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ndc-calculator-prod
VITE_FIREBASE_STORAGE_BUCKET=ndc-calculator-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI Production Key
VITE_OPENAI_API_KEY=your_production_openai_key

# API URLs (using defaults)
VITE_RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST
VITE_FDA_BASE_URL=https://api.fda.gov/drug/ndc.json
```

### 7. Deployment Scripts (`package.json`)
```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy",
    "deploy:hosting": "npm run build && firebase deploy --only hosting",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:rules": "firebase deploy --only firestore:rules,storage",
    "deploy:staging": "npm run build && firebase use staging && firebase deploy",
    "preview": "firebase hosting:channel:deploy preview"
  }
}
```

### 8. GitHub Repository Secrets Setup
```
Required secrets in GitHub repository:
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- OPENAI_API_KEY
- FIREBASE_SERVICE_ACCOUNT (JSON service account key)
- FIREBASE_TOKEN (Firebase CI token)
```

### 9. Deployment Checklist Document (`DEPLOYMENT.md`)
```markdown
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
```

## Validation Checklist

- [ ] Firebase project configured
- [ ] GitHub Actions workflows created
- [ ] All secrets added to GitHub
- [ ] Test deployment successful
- [ ] Production deployment successful
- [ ] Rollback procedure tested
- [ ] Monitoring configured
- [ ] Documentation complete

## Success Criteria

✅ Automated CI/CD pipeline functional  
✅ Deployments triggered on push to main  
✅ Preview deployments for PRs working  
✅ Rollback capability tested  
✅ Monitoring in place

---

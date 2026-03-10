# CI/CD Pipeline Setup Guide

## Overview

This project uses GitHub Actions for Continuous Integration (CI) and Vercel for Continuous Deployment (CD). The setup ensures code quality checks and builds are performed automatically before deployment.

## Architecture

### CI (Continuous Integration) - GitHub Actions

GitHub Actions runs the following checks on every push and pull request:

1. **Dependency Installation** - Installs all project dependencies using `npm ci`
2. **Linting** - Runs ESLint to check code quality and style consistency
3. **Production Build** - Builds the Next.js application to ensure it compiles successfully
4. **Artifact Upload** - Stores build artifacts for inspection

### CD (Continuous Deployment) - Vercel

Vercel handles the actual deployment to production:
- Automatically deploys on successful builds
- Provides preview URLs for pull requests
- Handles environment variables and secrets
- Optimizes build output for production

## Workflow Configuration

### Triggers

The CI workflow runs on:
- **Push** to `main` or `develop` branches
- **Pull Requests** targeting `main` or `develop` branches

### Node.js Versions

The workflow tests against multiple Node.js versions:
- Node.js 18.x
- Node.js 20.x

This ensures compatibility across different Node.js environments.

## Integration with Vercel

### How They Work Together

1. **GitHub Actions (CI)**:
   - Runs on every push/PR
   - Performs quality checks (lint, build)
   - Provides fast feedback to developers
   - Blocks broken code from being merged

2. **Vercel (CD)**:
   - Monitors the same repository
   - Automatically builds and deploys on successful merges
   - Creates preview deployments for PRs
   - Manages production environment

### No Conflict Design

The CI pipeline is designed to complement Vercel, not conflict with it:

- **No Deployment Steps**: GitHub Actions only checks code quality, it doesn't deploy
- **Separate Responsibilities**: CI validates code, Vercel handles deployment
- **Parallel Execution**: Both can run independently without interfering
- **Build Verification**: CI verifies the build succeeds before Vercel attempts deployment

### Workflow Flow

```
Developer Push/Pull Request
    ↓
GitHub Actions CI Pipeline
    ↓
├─ Install Dependencies
├─ Run Linter (ESLint)
├─ Build Application
└─ Upload Artifacts
    ↓
[All Checks Pass?] → Yes → Merge to Main
    ↓
Vercel CD Pipeline
    ↓
├─ Build Application
├─ Deploy to Production
└─ Update DNS/SSL
```

## Setup Instructions

### Prerequisites

1. Repository connected to Vercel
2. GitHub Actions enabled in repository settings
3. Required environment variables configured in Vercel

### Environment Variables

Configure these in Vercel (not in GitHub Actions):

- `DATABASE_URL` - Prisma database connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- Any other app-specific secrets

### GitHub Actions Secrets

No secrets are required for the CI pipeline. All sensitive data should be:
1. Configured in Vercel for deployment
2. Excluded from `.gitignore` (already done)
3. Documented in `.env.example` (already done)

## Workflow File Location

The CI workflow is located at:
```
.github/workflows/ci.yml
```

## Monitoring

### GitHub Actions

View CI status:
1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select a workflow run to view details

### Vercel Deployments

View deployment status:
1. Go to your project in Vercel dashboard
2. Check the "Deployments" tab
3. View build logs and deployment status

## Troubleshooting

### CI Failures

**Linting Errors:**
- Run `npm run lint` locally to see errors
- Fix linting issues before pushing

**Build Errors:**
- Run `npm run build` locally to reproduce
- Check TypeScript errors in your IDE
- Verify all dependencies are installed

**Timeout Issues:**
- If builds timeout, check for infinite loops or heavy computations
- Optimize build process if needed

### Vercel Deployment Failures

**Build Failures:**
- Check Vercel build logs for specific errors
- Ensure environment variables are set correctly
- Verify database connectivity

**Runtime Errors:**
- Check Vercel function logs
- Verify API routes are working correctly
- Test database connections

## Best Practices

1. **Always run CI locally** before pushing:
   ```bash
   npm ci
   npm run lint
   npm run build
   ```

2. **Keep dependencies updated**:
   ```bash
   npm update
   npm audit fix
   ```

3. **Monitor CI/CD status** regularly to catch issues early

4. **Use feature branches** for development to keep `main` stable

5. **Review PR checks** before merging to ensure all CI passes

## Customization

### Adding More Checks

To add additional checks to the CI pipeline, edit `.github/workflows/ci.yml`:

```yaml
- name: Run tests
  run: npm test
```

### Changing Node.js Versions

Modify the matrix in `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add 22.x
```

### Adding Caching

The workflow already caches npm dependencies. To add more caching:

```yaml
- name: Cache Next.js build
  uses: actions/cache@v4
  with:
    path: |
      .next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
```

## Security Considerations

1. **Never commit secrets** - Use Vercel environment variables
2. **Review PR changes** - Check for unauthorized modifications
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use branch protection** - Require CI checks to pass before merging

## Support

For issues with:
- **GitHub Actions**: Check GitHub Actions documentation
- **Vercel**: Check Vercel documentation and support
- **Build errors**: Review build logs and error messages

# CI/CD Setup Guide

This guide will walk you through setting up the complete CI/CD pipeline for the Room Booking System.

## Prerequisites

- GitHub repository admin access
- Vercel account (for web deployment)
- Expo account (for mobile builds)
- Supabase account (for database)
- Apple Developer account (for iOS TestFlight)

## Step 1: Configure GitHub Secrets

Navigate to your repository on GitHub:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Required Secrets

#### For Mobile Deployment (EAS)

**EXPO_TOKEN**

- Get your token by running locally:
  ```bash
  npx eas-cli login
  npx eas-cli whoami --json
  ```
- Copy the `authenticationToken` value
- Add as secret with name: `EXPO_TOKEN`

#### For Supabase Migrations

**SUPABASE_ACCESS_TOKEN**

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token
5. Add as secret with name: `SUPABASE_ACCESS_TOKEN`

**SUPABASE_PROJECT_REF**

1. Go to your Supabase project dashboard
2. Go to Settings → General
3. Copy the "Reference ID" (e.g., `nladwgkecjkcjsdawzoc`)
4. Add as secret with name: `SUPABASE_PROJECT_REF`

**SUPABASE_DB_PASSWORD**

1. This is your database password from when you created the project
2. If you don't have it, you can reset it in Supabase dashboard
3. Go to Settings → Database → Reset Database Password
4. Add as secret with name: `SUPABASE_DB_PASSWORD`

### Summary of Secrets

| Secret Name             | Description                   | Where to Get It                       |
| ----------------------- | ----------------------------- | ------------------------------------- |
| `EXPO_TOKEN`            | Expo authentication token     | `eas whoami --json`                   |
| `SUPABASE_ACCESS_TOKEN` | Supabase API access token     | supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF`  | Supabase project reference ID | Project Settings → General            |
| `SUPABASE_DB_PASSWORD`  | Supabase database password    | Project Settings → Database           |

## Step 2: Configure Branch Protection

Navigate to your repository on GitHub:
`Settings` → `Branches` → `Add branch protection rule`

### Protection Settings for `main` branch

**Branch name pattern:** `main`

**Protect matching branches:**

- ✅ Require a pull request before merging
  - ✅ Require approvals: 1 (can be adjusted based on team size)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (optional)

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Add required status checks:
    - `Detect Changes`
    - `Check Web App` (if web changes detected)
    - `Check Mobile App` (if mobile changes detected)
    - `Check Shared Packages` (if package changes detected)
    - `Check Supabase Migrations` (if migration changes detected)

- ✅ Require conversation resolution before merging

- ✅ Require linear history (optional but recommended)

- ✅ Do not allow bypassing the above settings
  - Include administrators (recommended)

- ✅ Restrict who can push to matching branches (optional)

- ✅ Allow force pushes: ❌ Never
- ✅ Allow deletions: ❌ Never

### Save the protection rule

Click "Create" or "Save changes" at the bottom.

## Step 3: Set Up Vercel Integration

### Connect Vercel to GitHub

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository: `roombookingsystem`
5. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Click "Deploy"

### Configure Automatic Deployments

Vercel automatically deploys:

- **Production:** Every push to `main` branch
- **Preview:** Every pull request

No additional configuration needed!

## Step 4: Verify EAS Configuration

Your mobile app should already be configured with EAS from previous setup.

Verify the configuration:

```bash
cd apps/mobile
cat eas.json
```

Should show:

- Development profile with internal distribution
- Production profile with auto-increment
- Submit configuration with Apple credentials

## Step 5: Test the Pipeline

### Create a Test PR

1. Create a feature branch:

   ```bash
   git checkout -b test/ci-pipeline
   ```

2. Make a small change (e.g., update CONTRIBUTING.md)

3. Commit and push:

   ```bash
   git add .
   git commit -m "test(ci): Verify CI/CD pipeline setup"
   git push origin test/ci-pipeline
   ```

4. Create a pull request on GitHub

5. Verify that:
   - ✅ CI checks run automatically
   - ✅ Status checks appear in the PR
   - ✅ You can see check results
   - ✅ Vercel preview deployment is created (if web files changed)

### Test Main Branch Deployment

1. Merge the test PR (after approval and checks pass)

2. Verify that:
   - ✅ Merge to main triggers appropriate deployments
   - ✅ Web changes deploy to Vercel production
   - ✅ Mobile changes trigger EAS build
   - ✅ Supabase migrations run automatically

## Step 6: Monitor Deployments

### Web (Vercel)

- Dashboard: https://vercel.com/dashboard
- View deployments, logs, and analytics

### Mobile (EAS)

- Dashboard: https://expo.dev/accounts/yenlhs/projects/roombooking
- View builds, submissions, and TestFlight status

### Supabase

- Dashboard: https://supabase.com/dashboard/project/[project-ref]
- View migrations, database status, and logs

## Troubleshooting

### CI Checks Failing

**Type check errors:**

- Run `npm run type-check --workspace apps/web` locally
- Fix type errors before pushing

**Lint errors:**

- Run `npm run lint --workspace apps/web` locally
- Fix lint errors or update ESLint config

**Build errors:**

- Ensure all dependencies are installed
- Check for missing environment variables

### Mobile Deployment Issues

**EAS build fails:**

- Check EXPO_TOKEN is valid
- Verify eas.json configuration
- Check build logs in EAS dashboard

**TestFlight submission fails:**

- Verify Apple credentials in EAS
- Check App Store Connect status
- Review submission logs

### Supabase Migration Fails

**Migration errors:**

- Test migrations locally first: `supabase db reset`
- Check SQL syntax
- Verify migration order and dependencies
- Check SUPABASE_DB_PASSWORD is correct

### Vercel Deployment Issues

**Build fails:**

- Check environment variables in Vercel dashboard
- Verify build command and output directory
- Review build logs in Vercel

**Preview deployment not created:**

- Ensure Vercel GitHub app is installed
- Check repository permissions
- Verify root directory is set to `apps/web`

## Additional Configuration

### Code Owners (Optional)

Create `.github/CODEOWNERS`:

```
# Default owners for everything
* @yenlhs

# Web app
/apps/web/ @yenlhs

# Mobile app
/apps/mobile/ @yenlhs

# Database
/apps/supabase/ @yenlhs

# Shared packages
/packages/ @yenlhs
```

### Auto-merge (Optional)

Enable auto-merge for dependabot PRs:

1. Go to repository settings
2. Enable "Allow auto-merge"
3. Configure Dependabot to auto-merge minor updates

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate tokens regularly** (every 3-6 months)
3. **Use least-privilege access** for service accounts
4. **Enable 2FA** on all accounts (GitHub, Vercel, Expo, Supabase)
5. **Review and audit** workflow runs regularly
6. **Keep dependencies updated** for security patches

## Getting Help

If you encounter issues:

1. Check workflow logs in GitHub Actions tab
2. Review deployment logs in respective dashboards
3. Consult documentation:
   - GitHub Actions: https://docs.github.com/actions
   - Vercel: https://vercel.com/docs
   - EAS: https://docs.expo.dev/build/introduction/
   - Supabase CLI: https://supabase.com/docs/guides/cli

---

**Setup Complete!** 🎉

Your CI/CD pipeline is now ready. Every PR will be automatically checked and deployed, and every merge to main will trigger production deployments.

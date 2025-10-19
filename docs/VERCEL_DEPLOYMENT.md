# Vercel Deployment Setup

## Completed Steps

### 1. Vercel Project Configuration

- Created Vercel project "roombookingportal" for the Next.js web app
- Project ID: `prj_y7orrORtz3ydUXhjtSUtQ0R2TMkA`
- Linked to `/apps/web` directory in the monorepo

### 2. Environment Variables

Configured the following environment variables in all environments (production, preview, development):

- `NEXT_PUBLIC_SUPABASE_URL`: https://nladwgkecjkcjsdawzoc.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Encrypted in Vercel]

### 3. Build Configuration

Created `apps/web/vercel.json` with monorepo-aware build commands:

```json
{
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=web",
  "devCommand": "pnpm turbo run dev --filter=web",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### 4. Package Manager Configuration

- Downgraded from pnpm@10.17.1 to pnpm@9.14.4 for better Vercel compatibility
- Updated `packageManager` in root `package.json`

### 5. Deployment Exclusions

Created `.vercelignore` to exclude unnecessary files:

```
apps/mobile
supabase/functions
.github
.husky
scripts
docs
*.md
!apps/web/README.md
```

## Manual Steps Required

### 1. Configure Vercel Project Root Directory

The Vercel "roombookingportal" project needs to have its Root Directory set to `apps/web`:

1. Go to https://vercel.com/yenlhs-projects/roombookingportal/settings
2. Navigate to "General" → "Root Directory"
3. Set to: `apps/web`
4. Click "Save"

### 2. Connect GitHub Integration

Ensure the "roombookingportal" project is connected to the GitHub repository:

1. Go to https://vercel.com/yenlhs-projects/roombookingportal/settings/git
2. Verify the repository is connected to `yenlhs/roombookingsystem`
3. Confirm automatic deployments are enabled for:
   - Production Branch: `main`
   - Preview Branches: All branches

### 3. Remove Duplicate Project (Optional)

There's an accidentally created project "roombookingsystem" that should be removed:

1. Go to https://vercel.com/yenlhs-projects/roombookingsystem/settings
2. Navigate to "Git" and disconnect the GitHub integration
3. Or delete the project entirely if not needed

### 4. Test Deployment

After completing the manual steps, trigger a deployment by:

1. Making a small change to the web app
2. Pushing to a branch and creating a PR
3. Verifying the deployment succeeds in the PR checks
4. Merging the PR and confirming production deployment

## Deployment URLs

- Production: https://roombookingportal-yenlhs-projects.vercel.app
- Latest deployments can be viewed at: https://vercel.com/yenlhs-projects/roombookingportal

## Troubleshooting

### pnpm Installation Errors

If you encounter pnpm installation errors:

- Ensure `packageManager` in root `package.json` is set to `pnpm@9.14.4`
- Verify `pnpm-lock.yaml` is committed to the repository
- Check that Root Directory is set to `apps/web` in Vercel settings

### Build Failures

If the build fails:

- Verify environment variables are set in Vercel project settings
- Check that the build command can access the monorepo root
- Ensure all workspace dependencies are properly configured

### Monorepo Detection Issues

If Vercel doesn't detect the monorepo properly:

- Confirm `pnpm-workspace.yaml` exists in the repository root
- Verify `vercel.json` includes the correct install and build commands
- Check that the Root Directory is correctly set to `apps/web`

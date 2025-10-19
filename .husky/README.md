# Git Hooks

This directory contains Git hooks managed by Husky to ensure code quality before commits and pushes.

## Hooks

### pre-commit

Runs before each commit:

- **lint-staged**: Formats and lints only the staged files
- Automatically fixes formatting issues
- Prevents commits with linting errors

### pre-push

Runs before pushing to remote:

- **Type check**: Verifies TypeScript types across all packages
- **Lint**: Runs ESLint on mobile app (matches CI)
- **Format check**: Ensures code follows formatting standards

## Manual CI Check

You can manually run all CI checks anytime with:

```bash
pnpm ci:check
```

This is useful before creating a PR.

## Skipping Hooks

If you need to skip hooks temporarily (not recommended):

```bash
# Skip pre-commit hook
git commit --no-verify

# Skip pre-push hook
git push --no-verify
```

## Troubleshooting

If hooks aren't running:

1. Make sure hooks are executable: `chmod +x .husky/*`
2. Reinstall hooks: `pnpm exec husky install`
3. Check that you're in the git repository root

## Hook Performance

- **pre-commit**: Fast (~5s) - only checks staged files
- **pre-push**: Slower (~30s) - runs full CI checks

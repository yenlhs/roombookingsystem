# Development Guide

## Local CI Checks

This project has automated checks to ensure code quality before pushing to GitHub.

### Automatic Checks (Git Hooks)

Git hooks are automatically set up when you run `pnpm install`. They will run:

#### On `git commit` (pre-commit)

- **lint-staged**: Automatically formats only the files you're committing using Prettier
- Fast (~2-5 seconds)
- Auto-fixes formatting issues
- Only runs Prettier (linting happens in pre-push for better performance)

#### On `git push` (pre-push)

- **Type check**: Verifies TypeScript types across all packages
- **Lint**: Runs ESLint on mobile app (same as CI)
- **Format check**: Ensures code formatting is correct
- Slower (~30 seconds)
- Blocks push if any check fails

### Manual CI Checks

#### Option 1: Using the CI Check Script (Recommended)

Run the comprehensive CI check script with nice formatting:

```bash
./scripts/ci-check.sh
```

Or from anywhere in the project:

```bash
pnpm ci:check
```

This runs all three checks:

1. Type checking
2. Linting (mobile)
3. Format checking

#### Option 2: Running Individual Checks

```bash
# Type check all packages
pnpm type-check

# Lint mobile app
pnpm lint --filter mobile

# Check code formatting
pnpm format:check

# Auto-fix formatting
pnpm format
```

### Before Creating a Pull Request

**Best Practice:**

1. Make your changes and commit them
2. Run `./scripts/ci-check.sh` or `pnpm ci:check`
3. Fix any errors that appear
4. Push your code

This ensures your PR will pass all CI checks immediately!

### Skipping Hooks (Not Recommended)

If you absolutely need to skip hooks temporarily:

```bash
# Skip pre-commit hook
git commit --no-verify -m "your message"

# Skip pre-push hook
git push --no-verify
```

⚠️ **Warning**: Skipping hooks may cause your PR to fail CI checks on GitHub!

### What Each Check Does

#### Type Check

- Ensures TypeScript code has no type errors
- Runs across all packages: `@workspace/types`, `@workspace/utils`, `@workspace/validation`, `@workspace/supabase`, `web`, `mobile`
- Catches type mismatches, missing properties, incorrect imports

#### Lint (Mobile)

- Runs ESLint on the mobile app
- Checks for:
  - Code style violations
  - Unused variables
  - React Hook dependencies
  - TypeScript best practices
- Warnings are allowed, but errors will block the push

#### Format Check

- Uses Prettier to check code formatting
- Ensures consistent code style across the project
- Check files: `*.ts`, `*.tsx`, `*.md`, `*.json`
- Run `pnpm format` to auto-fix all formatting issues

### Troubleshooting

#### Hooks not running?

```bash
# Reinstall hooks
pnpm exec husky install

# Make sure hooks are executable
chmod +x .husky/*
```

#### Type errors in packages you didn't change?

```bash
# Clean and reinstall
pnpm clean
pnpm install
```

#### Format check fails?

```bash
# Auto-fix all formatting
pnpm format
```

#### Lint warnings?

Warnings won't block your push, but:

- Fix them if possible
- Add `// eslint-disable-next-line rule-name` only if necessary
- Document why you're disabling the rule

### CI Pipeline

When you push to GitHub, the following checks run:

1. **Type Check** - All packages must pass TypeScript type checking
2. **Lint (Mobile)** - Mobile app must pass ESLint
3. **Build** - Both web and mobile must build successfully

Running `pnpm ci:check` locally ensures you'll pass steps 1 and 2!

### Performance Tips

- **Pre-commit is fast**: Only checks staged files
- **Pre-push is slower**: Checks entire codebase
- **Use caching**: Turbo caches results, subsequent runs are faster
- **Run ci:check before creating PR**: Saves time on failed CI runs

### Questions?

- Git hooks: See `.husky/README.md`
- CI script: See `scripts/ci-check.sh`
- Package scripts: See root `package.json`

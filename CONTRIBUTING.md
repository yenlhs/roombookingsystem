# Contributing to Room Booking System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. **Fork and Clone**

   ```bash
   git clone https://github.com/yenlhs/roombookingsystem.git
   cd roombookingsystem
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment**
   - Copy `.env.example` to `.env` in each app directory
   - Configure your Supabase credentials
   - Follow app-specific setup instructions

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

**Branch Naming Convention:**

- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `chore/task-name` - Maintenance tasks
- `docs/description` - Documentation updates

### 2. Make Your Changes

- Write clean, maintainable code
- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation as needed

### 3. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

**Format:** `type(scope): description`

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance tasks
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `ci`: CI/CD changes

**Scopes:**

- `web`: Web application
- `mobile`: Mobile application
- `supabase`: Database/backend
- `shared`: Shared packages

**Examples:**

```bash
git commit -m "feat(mobile): Add push notification settings screen"
git commit -m "fix(web): Resolve booking calendar timezone issue"
git commit -m "chore(supabase): Add migration for user preferences table"
```

### 4. Push and Create Pull Request

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub:

- Fill out the PR template completely
- Link any related issues
- Request review from maintainers
- Wait for CI checks to pass

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No new warnings or errors
- [ ] Documentation updated (if needed)
- [ ] Tested locally
- [ ] Commits follow conventional commit format

### After Submitting

1. **Automated Checks Run**
   - TypeScript type checking
   - ESLint linting
   - Build validation
   - Automated deployments (if applicable)

2. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Re-request review when ready

3. **Merge**
   - Once approved and checks pass, PR will be merged
   - Branch will be automatically deleted

## CI/CD Pipeline

### Web App (Vercel)

- **All PRs:** Preview deployment created automatically
- **Main branch:** Production deployment

### Mobile App (EAS)

- **Main branch only:** Production build → Auto-submit to TestFlight
- **Manual builds:** Can be triggered for development/testing

### Supabase Migrations

- **Main branch only:** Migrations applied to production database
- **Testing:** Test migrations locally before pushing

## Code Style

### TypeScript

- Use strict TypeScript settings
- Avoid `any` types when possible
- Define proper interfaces and types

### React/React Native

- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable

### Styling

- Web: Use Tailwind CSS utility classes
- Mobile: Use NativeWind (Tailwind for React Native)
- Follow existing patterns

### File Organization

```
apps/
  web/           # Next.js web application
  mobile/        # React Native mobile app
  supabase/      # Supabase configuration and migrations
packages/
  types/         # Shared TypeScript types
  supabase/      # Supabase client and utilities
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific app
npm test --workspace apps/web
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Aim for meaningful test coverage

## Database Migrations

### Creating Migrations

1. **Create migration file:**

   ```bash
   cd apps/supabase
   supabase migration new your_migration_name
   ```

2. **Write SQL:**
   - Be careful with production data
   - Test migrations locally first
   - Include rollback steps in comments

3. **Test locally:**
   ```bash
   supabase db reset
   supabase migration up
   ```

### Migration Guidelines

- One logical change per migration
- Include descriptive comments
- Test on sample data
- Consider performance impact
- Plan for rollback scenarios

## Getting Help

- **Issues:** Check existing issues or create a new one
- **Discussions:** Start a discussion for questions
- **Documentation:** Check project README and docs

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Room Booking System!

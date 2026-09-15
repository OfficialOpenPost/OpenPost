# Contributing to OpenPost

Thank you for your interest in contributing to OpenPost! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Types](#contribution-types)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Running Tests](#running-tests)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm (package manager)
- Git
- A Supabase account (free tier works)
- A Cloudflare R2 account (for media storage)

### Setup

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/OpenPost.git
   cd OpenPost
   ```

3. **Install dependencies**
   ```bash
   npm ci
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```

5. **Configure environment variables** (see [Environment Variables](#environment-variables))

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open OpenPost**
   - Visit `http://localhost:3000`
   - Sign up for an account
   - The first user will need to be approved by an admin

### Environment Variables

Required environment variables (see `.env.example` for full list):

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="OpenPost"

# Optional: Cloudflare R2 (for media uploads)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"

# Optional: Cron secret (for scheduled publishing)
CRON_SECRET="your-cron-secret"
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migrations in order from `supabase/migrations/` (001 → 021)
3. Use the SQL Editor in Supabase dashboard

Alternatively, use Prisma:
```bash
npx prisma generate
npx prisma db push
```

## Development Workflow

```
Fork OpenPost
    ↓
Clone fork
    ↓
Create feature branch
    ↓
Install dependencies
    ↓
Create .env from .env.example
    ↓
Run development environment
    ↓
Make changes
    ↓
Run automated checks
    ↓
Commit changes
    ↓
Push branch
    ↓
Open Pull Request
    ↓
GitHub Actions automatically run
    ↓
Maintainer reviews
    ↓
Changes requested OR merged
```

## Contribution Types

We welcome contributions in these areas:

- **Bug fixes** - Fix issues in the existing codebase
- **New features** - Add new functionality to OpenPost
- **UI improvements** - Enhance the user interface
- **Editor improvements** - Improve the Tiptap editor experience
- **API improvements** - Enhance the REST API
- **Database improvements** - Optimize queries or schema
- **Performance** - Improve speed and efficiency
- **Accessibility** - Make OpenPost more accessible
- **SEO** - Improve search engine optimization
- **Documentation** - Improve or add documentation
- **Tests** - Add or improve test coverage
- **Security** - Fix vulnerabilities or improve security

### For Large Changes

If you're planning a large change, please open an Issue first to discuss the approach. This helps ensure your contribution aligns with the project's direction.

## Branch Naming

Use descriptive branch names with prefixes:

```
feature/add-tags
fix/editor-save-error
docs/api-guide
refactor/media-pipeline
chore/update-dependencies
test/add-rbac-tests
```

## Commit Messages

Write clear, concise commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Fix bug" not "Fixes bug")
- Keep the first line under 72 characters
- Reference issues and pull requests where appropriate

Examples:
```
feat: add tag management to dashboard
fix: resolve editor autosave race condition
docs: update API reference for posts endpoint
refactor: simplify media upload pipeline
```

## Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style guidelines
   - Add tests if applicable
   - Update documentation if needed

4. **Run checks**
   ```bash
   npm run typecheck    # Type checking
   npm run test         # Run tests
   npm run build        # Build verification
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Submit the PR

8. **Wait for CI**
   - GitHub Actions will run automatically
   - Fix any issues that arise
   - Respond to review feedback

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/rbac.test.ts
```

### Test Coverage

Current test suites:
- **RBAC** (8 tests) - Role-based access control
- **API Token** (3 tests) - API token generation and validation
- **Storage Security** (7 tests) - Media upload validation
- **SSRF Webhook** (6 tests) - Webhook security
- **Slug** (3 tests) - Slug generation and reading time
- **Webhook Signing** (3 tests) - Webhook signature verification
- **Cron Auth** (3 tests) - Cron endpoint authentication

## Code Style

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Use `strict` mode (already configured)
- Avoid `any` types
- Use Zod for runtime validation

### React

- Use functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Extract reusable logic into custom hooks

### API Routes

- Always validate input with Zod
- Use `requireProjectMember` for project-scoped routes
- Use `requirePermission` for permission checks
- Return consistent error responses
- Log audit events for sensitive actions

### Database

- Use Prisma for database access
- Always scope queries by `projectId`
- Use transactions for multi-step operations
- Add proper indexes for performance

## Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the Bug Report template
3. Include steps to reproduce
4. Include expected vs actual behavior
5. Include version/commit information

## Suggesting Features

1. Check existing issues to avoid duplicates
2. Use the Feature Request template
3. Describe the problem you're solving
4. Describe your proposed solution
5. Consider alternatives

## Questions?

If you have questions:

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/OfficialOpenPost/OpenPost/issues)
3. Open a [new issue](https://github.com/OfficialOpenPost/OpenPost/issues/new/choose) with the "question" label

Thank you for contributing to OpenPost!

# Contributing to Quantera

Thank you for your interest in contributing to Quantera. This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Security Considerations](#security-considerations)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **Rust**: Latest stable (for backend services)
- **Docker**: For local development environment
- **Git**: Version control

### Types of Contributions

We welcome the following types of contributions:

- **Bug Fixes**: Resolving issues in existing functionality
- **Features**: New capabilities aligned with the project roadmap
- **Documentation**: Improvements to technical docs, guides, and comments
- **Tests**: Expanding test coverage and quality
- **Performance**: Optimizations that improve efficiency
- **Security**: Responsible disclosure and fixes for vulnerabilities

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/quantera.git
cd quantera
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend (if applicable)
cd ../backend
cargo build
```

### 3. Environment Configuration

```bash
# Copy environment template
cp frontend/.env.example frontend/.env.local

# Configure required variables (see .env.example for details)
```

### 4. Start Development Server

```bash
# Frontend
cd frontend
npm run dev

# Run tests
npm test
```

## Contribution Workflow

### 1. Create a Branch

```bash
# Create a feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Branch naming conventions:
# feature/description - New features
# fix/description     - Bug fixes
# docs/description    - Documentation
# refactor/description - Code refactoring
# test/description    - Test additions
```

### 2. Make Changes

- Write clean, well-documented code
- Follow existing patterns and conventions
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Changes

```bash
# Use conventional commit format
git commit -m "type(scope): description"

# Examples:
git commit -m "feat(marketplace): add asset filtering"
git commit -m "fix(wallet): resolve connection timeout"
git commit -m "docs(readme): update installation steps"
git commit -m "test(portfolio): add unit tests for calculations"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
# Then create a Pull Request on GitHub
```

## Code Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks for React
- Implement proper error handling
- Add JSDoc comments for public APIs

```typescript
/**
 * Calculates the total portfolio value across all asset classes.
 * @param holdings - Array of asset holdings
 * @param prices - Current price data for assets
 * @returns Total portfolio value in USD
 */
export function calculatePortfolioValue(
  holdings: AssetHolding[],
  prices: PriceData
): number {
  // Implementation
}
```

### Rust (Backend)

- Follow Rust idioms and best practices
- Use `clippy` for linting
- Document public functions and modules
- Handle errors with `Result` types

### CSS/Styling

- Use Material-UI styled components
- Follow the existing design system variables
- Ensure responsive design
- Support both light and dark themes

## Testing Requirements

### Unit Tests

- All new features must include unit tests
- Maintain or improve existing coverage
- Use Jest and React Testing Library

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

### E2E Tests

- Add Playwright tests for critical user flows
- Test across multiple viewport sizes

## Security Considerations

### Before Submitting

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Proper authentication/authorization checks
- [ ] No SQL injection or XSS vulnerabilities
- [ ] Dependencies checked for known vulnerabilities

### Reporting Vulnerabilities

Do NOT open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for responsible disclosure process.

## Pull Request Process

### PR Requirements

1. **Description**: Clear explanation of changes and motivation
2. **Testing**: All tests pass, new tests added as needed
3. **Documentation**: Updated if behavior changes
4. **No Conflicts**: Rebased on latest main branch
5. **Single Focus**: One feature or fix per PR

### Review Process

1. Automated checks must pass (lint, tests, build)
2. At least one maintainer approval required
3. Address all review comments
4. Squash commits before merge (if requested)

### After Merge

- Delete your feature branch
- Update any related issues
- Monitor for any issues in production

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue with reproduction steps
- **Security**: Email security@quantera.finance
- **General**: community@quantera.finance

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

---

Thank you for contributing to Quantera!

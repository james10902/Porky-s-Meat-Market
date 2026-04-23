# Porky's Meat Market - Version Control Workflow Guide

## Overview

This document outlines the Git workflow and best practices for the Porky's Meat Market Platform project. All team members should follow these guidelines to maintain a clean, organized repository and facilitate smooth collaboration.

## Table of Contents

1. [Repository Setup](#repository-setup)
2. [Branching Strategy](#branching-strategy)
3. [Commit Guidelines](#commit-guidelines)
4. [Pull Request Process](#pull-request-process)
5. [Merge Strategy](#merge-strategy)
6. [Conflict Resolution](#conflict-resolution)
7. [Release Management](#release-management)
8. [Hotfix Process](#hotfix-process)
9. [Best Practices](#best-practices)
10. [Common Commands](#common-commands)

## Repository Setup

### Initial Clone

```bash
git clone <repository-url>
cd porky-meat-market
```

### Configure Local Git

```bash
# Set your name and email
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Optional: Set globally
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Verify Configuration

```bash
git config --list
```

## Branching Strategy

We follow a modified Git Flow branching strategy with the following branch types:

### Main Branches

#### `main` (Production)
- **Purpose**: Production-ready code
- **Protection**: Requires pull request reviews before merge
- **Deployment**: Automatically deployed to production
- **Naming**: Always `main`
- **Rules**:
  - Only merge from `release/*` or `hotfix/*` branches
  - All commits must be tagged with version numbers
  - No direct commits allowed

#### `develop` (Development)
- **Purpose**: Integration branch for features
- **Protection**: Requires pull request reviews before merge
- **Deployment**: Deployed to staging environment
- **Naming**: Always `develop`
- **Rules**:
  - Merge feature branches here
  - Merge release branches here
  - No direct commits allowed (except for version bumps)

### Supporting Branches

#### Feature Branches (`feature/*`)
- **Purpose**: Develop new features
- **Naming Convention**: `feature/feature-name` or `feature/ISSUE-123-feature-name`
- **Created From**: `develop`
- **Merged Back Into**: `develop`
- **Naming Examples**:
  - `feature/product-catalog`
  - `feature/ISSUE-45-shopping-cart`
  - `feature/user-authentication`
  - `feature/order-tracking`

#### Bugfix Branches (`bugfix/*`)
- **Purpose**: Fix bugs in development
- **Naming Convention**: `bugfix/bug-name` or `bugfix/ISSUE-123-bug-name`
- **Created From**: `develop`
- **Merged Back Into**: `develop`
- **Naming Examples**:
  - `bugfix/cart-calculation-error`
  - `bugfix/ISSUE-67-login-validation`
  - `bugfix/product-image-loading`

#### Release Branches (`release/*`)
- **Purpose**: Prepare for production release
- **Naming Convention**: `release/v1.0.0` or `release/1.0.0`
- **Created From**: `develop`
- **Merged Back Into**: `main` and `develop`
- **Rules**:
  - Only bug fixes and version bumps allowed
  - No new features
  - Create when ready to release

#### Hotfix Branches (`hotfix/*`)
- **Purpose**: Fix critical bugs in production
- **Naming Convention**: `hotfix/bug-name` or `hotfix/ISSUE-123-bug-name`
- **Created From**: `main`
- **Merged Back Into**: `main` and `develop`
- **Naming Examples**:
  - `hotfix/payment-processing-error`
  - `hotfix/ISSUE-89-security-vulnerability`
  - `hotfix/database-connection-timeout`

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or create from a specific issue
git checkout -b feature/ISSUE-123-your-feature-name
```

## Commit Guidelines

### Commit Message Format

We follow the Conventional Commits specification for clear, semantic commit messages.

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process, dependencies, or tooling
- **ci**: Changes to CI/CD configuration
- **revert**: Reverts a previous commit

### Scope

The scope specifies what part of the codebase is affected:

- `frontend`: Frontend code changes
- `backend`: Backend code changes
- `database`: Database schema or migrations
- `auth`: Authentication-related changes
- `cart`: Shopping cart functionality
- `orders`: Order management
- `products`: Product catalog
- `admin`: Admin dashboard
- `config`: Configuration files
- `docs`: Documentation

### Subject Line

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters
- Be specific and descriptive

### Body

- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with a blank line
- Use bullet points for multiple changes

### Footer

- Reference issue numbers: `Closes #123` or `Fixes #123`
- Reference related issues: `Related to #456`
- Breaking changes: `BREAKING CHANGE: description`

### Commit Examples

```
feat(cart): add bulk discount calculation

Implement automatic bulk discount logic for orders exceeding
threshold amounts. Discounts are calculated based on quantity
tiers and applied at checkout.

Closes #123
```

```
fix(auth): prevent token expiration during checkout

Extend JWT token expiration time during active checkout session
to prevent users from being logged out mid-transaction.

Fixes #456
Related to #789
```

```
docs(readme): update installation instructions

Add step-by-step setup guide for new developers including
database initialization and environment configuration.
```

```
refactor(frontend): extract product card to component

Move product card rendering logic into reusable ProductCard
component to reduce code duplication across pages.

Related to #234
```

### Making Commits

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Stage all changes
git add .

# Commit with message
git commit -m "feat(products): add product filtering"

# Commit with body and footer
git commit -m "feat(products): add product filtering

Add category, price range, and search filtering to product
catalog. Filters persist in URL for shareable links.

Closes #123"

# Amend last commit (only if not pushed)
git commit --amend --no-edit
git commit --amend -m "new message"
```

## Pull Request Process

### Before Creating a Pull Request

1. **Update your branch** with latest changes from target branch:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Run tests locally**:
   ```bash
   npm test
   ```

3. **Check code quality**:
   ```bash
   npm run lint
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

### Creating a Pull Request

1. **Push your branch**:
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. **Create PR on GitHub/GitLab**:
   - Use descriptive title
   - Reference related issues
   - Provide detailed description
   - Add screenshots/videos if applicable

### Pull Request Title Format

```
[TYPE] Brief description of changes

Examples:
[FEATURE] Add product filtering to catalog
[BUGFIX] Fix cart total calculation error
[DOCS] Update API documentation
[REFACTOR] Extract ProductCard component
```

### Pull Request Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issues
Closes #123
Related to #456

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] No breaking changes

## Screenshots/Videos
(If applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Build passes locally
```

### Pull Request Review

- Minimum 2 approvals required before merge
- Address all comments before merging
- Keep PR focused on single feature/fix
- Keep PR size reasonable (< 400 lines of changes)

## Merge Strategy

### Merge Types

#### Squash and Merge
- **When**: Feature branches with multiple commits
- **Result**: Single commit on target branch
- **Command**: `git merge --squash feature/branch-name`

#### Rebase and Merge
- **When**: Clean history is important
- **Result**: Linear commit history
- **Command**: `git rebase origin/develop && git push`

#### Create a Merge Commit
- **When**: Preserving branch history is important
- **Result**: Merge commit created
- **Command**: `git merge --no-ff feature/branch-name`

### Recommended Strategy

- **Feature → Develop**: Squash and merge (clean history)
- **Develop → Main**: Create merge commit (preserve history)
- **Hotfix → Main**: Create merge commit (preserve history)

### Merging a Pull Request

```bash
# Via GitHub/GitLab UI (recommended)
# Click "Merge pull request" button

# Via command line
git checkout develop
git pull origin develop
git merge --squash feature/your-feature-name
git commit -m "feat(scope): description"
git push origin develop
```

## Conflict Resolution

### Identifying Conflicts

```bash
git status
# Shows files with conflicts
```

### Resolving Conflicts

1. **Open conflicted file** and look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Their changes
   >>>>>>> branch-name
   ```

2. **Edit the file** to resolve conflicts:
   - Keep your changes, their changes, or both
   - Remove conflict markers

3. **Stage resolved files**:
   ```bash
   git add path/to/resolved/file
   ```

4. **Complete the merge**:
   ```bash
   git commit -m "Merge branch 'feature/branch' into develop"
   ```

### Preventing Conflicts

- Keep branches short-lived (< 1 week)
- Frequently pull latest changes from target branch
- Communicate with team about changes to shared files
- Use feature flags for large changes

## Release Management

### Creating a Release

1. **Create release branch**:
   ```bash
   git checkout -b release/v1.0.0 develop
   ```

2. **Update version numbers**:
   - Update `package.json` version
   - Update `backend/package.json` version
   - Update any other version references

3. **Update CHANGELOG**:
   ```bash
   # Add release notes
   git add CHANGELOG.md
   git commit -m "chore(release): v1.0.0"
   ```

4. **Create pull request** to `main`

5. **After approval**, merge to `main`:
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff release/v1.0.0
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main --tags
   ```

6. **Merge back to develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git merge --no-ff release/v1.0.0
   git push origin develop
   ```

7. **Delete release branch**:
   ```bash
   git branch -d release/v1.0.0
   git push origin --delete release/v1.0.0
   ```

### Version Numbering

We follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Examples: `v1.0.0`, `v1.1.0`, `v1.1.1`

## Hotfix Process

### Creating a Hotfix

1. **Create hotfix branch from main**:
   ```bash
   git checkout -b hotfix/bug-name main
   ```

2. **Fix the bug** and commit:
   ```bash
   git commit -m "fix(scope): description"
   ```

3. **Create pull request** to `main`

4. **After approval**, merge to `main`:
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff hotfix/bug-name
   git tag -a v1.0.1 -m "Hotfix version 1.0.1"
   git push origin main --tags
   ```

5. **Merge back to develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git merge --no-ff hotfix/bug-name
   git push origin develop
   ```

6. **Delete hotfix branch**:
   ```bash
   git branch -d hotfix/bug-name
   git push origin --delete hotfix/bug-name
   ```

## Best Practices

### General Guidelines

1. **Commit frequently** with logical, atomic commits
2. **Push regularly** to avoid losing work
3. **Pull before pushing** to stay in sync
4. **Keep branches short-lived** (< 1 week)
5. **Use meaningful branch names** that describe the work
6. **Write clear commit messages** for future reference
7. **Review your own code** before requesting review
8. **Test locally** before pushing
9. **Keep branches up to date** with target branch
10. **Delete merged branches** to keep repository clean

### Code Review Best Practices

1. **Review promptly** (within 24 hours)
2. **Be constructive** in feedback
3. **Ask questions** rather than making demands
4. **Approve when satisfied** with changes
5. **Request changes** if issues found
6. **Comment on specific lines** with context
7. **Praise good code** when appropriate
8. **Suggest improvements** for future consideration

### Commit Best Practices

1. **One logical change per commit**
2. **Don't mix formatting and logic changes**
3. **Don't commit commented-out code**
4. **Don't commit debug statements**
5. **Don't commit sensitive information** (.env files, keys, etc.)
6. **Write descriptive messages** (not "fix stuff")
7. **Reference issues** in commit messages
8. **Use present tense** in commit messages

### Branch Best Practices

1. **Create branches from correct base**:
   - Features from `develop`
   - Hotfixes from `main`
   - Releases from `develop`

2. **Use consistent naming** conventions
3. **Delete merged branches** promptly
4. **Don't rebase public branches** (main, develop)
5. **Rebase feature branches** before merging
6. **Keep branches focused** on single feature/fix

## Common Commands

### Viewing History

```bash
# View commit log
git log

# View log with graph
git log --graph --oneline --all

# View commits for specific file
git log path/to/file

# View changes in last commit
git show HEAD

# View diff between branches
git diff develop..feature/branch-name
```

### Branching

```bash
# List local branches
git branch

# List all branches (local and remote)
git branch -a

# Create new branch
git branch feature/new-feature

# Switch to branch
git checkout feature/new-feature

# Create and switch to branch
git checkout -b feature/new-feature

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename branch
git branch -m old-name new-name
```

### Stashing

```bash
# Stash current changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop

# Delete stash
git stash drop
```

### Undoing Changes

```bash
# Discard changes in working directory
git checkout -- path/to/file

# Unstage file
git reset HEAD path/to/file

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert commit (create new commit)
git revert <commit-hash>
```

### Rebasing

```bash
# Rebase current branch on develop
git rebase origin/develop

# Interactive rebase (last 3 commits)
git rebase -i HEAD~3

# Continue rebase after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort
```

### Syncing

```bash
# Fetch latest changes
git fetch origin

# Pull latest changes
git pull origin develop

# Push changes
git push origin feature/branch-name

# Push with upstream tracking
git push -u origin feature/branch-name

# Force push (use with caution!)
git push --force-with-lease origin feature/branch-name
```

## Troubleshooting

### Accidentally Committed to Wrong Branch

```bash
# Create new branch from current commit
git branch feature/correct-branch

# Reset current branch to previous commit
git reset --hard HEAD~1

# Switch to correct branch
git checkout feature/correct-branch
```

### Need to Move Commits Between Branches

```bash
# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Cherry-pick range of commits
git cherry-pick <start-commit>..<end-commit>
```

### Lost Commits

```bash
# View all commits (including deleted)
git reflog

# Recover lost commit
git checkout <commit-hash>
```

### Large File Accidentally Committed

```bash
# Remove file from history
git filter-branch --tree-filter 'rm -f path/to/large/file' HEAD

# Force push (use with caution!)
git push --force-with-lease origin develop
```

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Cheat Sheet](https://github.github.com/training-kit/downloads/github-git-cheat-sheet.pdf)

## Questions or Issues?

If you have questions about the version control workflow, please:

1. Check this documentation
2. Ask in the team chat
3. Create an issue in the repository
4. Contact the project lead

---

**Last Updated**: 2024
**Version**: 1.0

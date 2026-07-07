# Contributing Guide

Thank you for your interest in contributing! This guide explains how to get involved.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [How to Submit a Pull Request](#how-to-submit-a-pull-request)
- [Development Setup](#development-setup)
- [Coding Conventions](#coding-conventions)
- [Commit Message Guidelines](#commit-message-guidelines)

---

## Code of Conduct

Please be respectful and constructive in all interactions.
We are committed to providing a welcoming and inclusive environment for everyone.

---

## How to Report a Bug

1. Search [existing issues](../../issues) to avoid duplicates.
2. If not found, open a new issue using the **Bug Report** template.
3. Include as much detail as possible — reproduction steps, environment, and expected vs. actual behavior.

---

## How to Request a Feature

1. Search [existing issues and discussions](../../discussions) to avoid duplicates.
2. Open a new issue using the **Feature Request** template, or start a conversation in [Discussions](../../discussions).
3. Clearly explain the problem the feature solves.

---

## How to Submit a Pull Request

1. **Fork** this repository and create a branch from `main`.
   ```bash
   git checkout -b fix/your-fix-name
   # or
   git checkout -b feat/your-feature-name
   ```
2. Make your changes following the [Coding Conventions](#coding-conventions) below.
3. Add or update tests to cover your changes.
4. Run the full test suite locally and make sure it passes.
5. Open a Pull Request against the `main` branch using the PR template.

> **Note:** For large changes, please open an issue or discussion first to align on the approach before writing code.

---

## Development Setup

<!-- Describe how to set up a local development environment. -->

```bash
# 1. Clone the repository
git clone https://github.com/OWNER/REPO.git
cd REPO

# 2. Install dependencies
# TODO: add install command

# 3. Run tests
# TODO: add test command
```

---

## Coding Conventions

- Follow the existing code style in the project.
- Keep functions small and focused.
- Write meaningful variable and function names.
- Add comments only where the intent is not obvious from the code.

---

## Commit Message Guidelines

Use short, descriptive commit messages in the imperative mood:

```
fix: correct off-by-one error in pagination
feat: add dark mode support
docs: update development setup instructions
refactor: simplify token validation logic
```

Common prefixes: `fix`, `feat`, `docs`, `test`, `refactor`, `chore`, `ci`

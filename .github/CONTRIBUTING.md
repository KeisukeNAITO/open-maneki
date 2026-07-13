# Contributing Guide

Thank you for your interest in contributing! This guide explains how to get involved.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [How to Submit a Pull Request](#how-to-submit-a-pull-request)
- [Use of AI Tools](#use-of-ai-tools)
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

> **Note:** Please write issues, pull requests, and commit messages in English.
> English is not the maintainer's first language either — we are both doing our
> best here for contributors who may join from anywhere in the world.
> Clarity beats perfection.

---

## Use of AI Tools

You are welcome to use AI tools (coding assistants, LLMs, etc.) when
contributing. We do not require you to disclose whether or how you used them.

Whatever tools you use, you are the author of your contribution and fully
responsible for it:

- Understand every change you submit, and be ready to explain and discuss it
  in review.
- Test your changes yourself before opening a pull request.
- Do not submit machine-generated output as-is without reviewing it yourself.

Maintainers may close a pull request or issue at their discretion when it
appears to be unverified generated output, or when no one — including the
author — can explain what it does.

---

## Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/KeisukeNAITO/open-maneki.git
cd open-maneki

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Create the SQLite database and generate the Prisma client
npx prisma migrate dev

# 5. (Optional) Load sample data for development
npx prisma db seed

# 6. Run checks and tests
npm run lint
npm run check
npm test
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

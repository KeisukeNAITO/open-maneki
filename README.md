# open-maneki

A personal asset management web app for tracking savings, stocks (Japanese and US), mutual funds, and defined-contribution pensions — including dividend and shareholder-benefit information.

> **Status**: early development — not ready for use yet.

## Planned features

- Track holdings across taxable and NISA (tax-free) accounts
- Manage assets in JPY and USD as-is (no currency conversion)
- Record market prices manually, with automatic retrieval via external APIs planned
- Dividend and shareholder-benefit information

Designed for personal, single-user use.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) + TypeScript
- Prisma + SQLite (planned)
- Vitest / ESLint / Prettier

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
```

Before submitting changes:

```bash
npm run format
npm run lint
npm run check
npm run test
```

## Contributing

See the [Contributing Guide](.github/CONTRIBUTING.md).

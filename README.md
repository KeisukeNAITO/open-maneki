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
- Prisma + SQLite
- Vitest / ESLint / Prettier

## Development

Requires Node.js 22 or later.

```bash
npm install
cp .env.example .env
npx prisma migrate dev   # create the SQLite database and generate the Prisma client
npx prisma db seed       # (optional) load sample data
npm run dev
```

Before submitting changes:

```bash
npm run format
npm run lint
npm run check
npm run test
```

## Documentation

- [Architecture Overview](docs/architecture.md) — how the codebase is organized and why
- [Architecture Decision Records](docs/adr/) — the reasoning behind design decisions

## Contributing

See the [Contributing Guide](.github/CONTRIBUTING.md).

## License

[MIT](LICENSE)

# 0003. Store money as integers in minor currency units

Date: 2026-07-09 (PR #6)

## Context

Prisma's `Decimal` type is not supported on SQLite. `Float` is unsuitable for money because of binary floating-point rounding errors.

## Decision

All money columns are `Int`, stored in the minor unit of each currency:

- JPY: yen
- USD: cents

Mutual funds hold quantity as an integer number of units, and their prices are expressed as the amount per 10,000 units.

## Consequences

Money can be added and subtracted without rounding errors. Display code must convert per currency (e.g. cents → dollar notation for USD). When adding a new currency, decide its minor unit first.

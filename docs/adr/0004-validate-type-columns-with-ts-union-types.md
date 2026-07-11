# 0004. Store type columns as String and validate with TypeScript union types

Date: 2026-07-09 (PR #6)

## Context

Several columns have a fixed set of allowed values, such as account type (`TAXABLE` / `NISA` / `DC`) and transaction type (`BUY` / `SELL` / `DIVIDEND` / `DEPOSIT` / `WITHDRAW`). Prisma's `enum` is not supported on SQLite.

## Decision

Type columns are `String` in the schema, and the allowed values are enforced by TypeScript union types with type guards (`src/lib/server/types.ts`). Type definitions are centralized in the logic layer.

## Consequences

The database cannot reject invalid values, so every write path must go through the type guards. Logic-layer functions accept Prisma rows as-is via structural subtyping, so no conversion layer is needed. Adding a new type value only requires updating the union type (no migration).

# 0002. Derive holdings from the transaction ledger instead of a Holding table

Date: 2026-07-09 (PR #6)

## Context

The initial schema draft had five models, including a `Holding` table that stored quantity, acquisition cost, and cash balance. However, every recorded trade would have required updating both `Transaction` and `Holding`, and a missed update or a bug could leave the ledger and the holding state inconsistent — with no way to tell which one is correct.

## Decision

Drop the `Holding` table and keep the schema to four models (`Account` / `Asset` / `Transaction` / `MarketPrice`). Quantity, acquisition cost, and cash balance are derived from the `Transaction` ledger by pure functions in the logic layer (`src/lib/server/holdings.ts`). The ledger remains the single source of truth.

## Consequences

Inconsistency between the ledger and holding state is structurally impossible. Reading holdings requires scanning the transaction history each time, but this is not expected to be a problem at single-user transaction volumes. If performance ever becomes an issue, snapshots or caching will be considered at that point.

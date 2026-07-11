# 0006. Derive cash balance from DEPOSIT / WITHDRAW only (single-entry bookkeeping)

Date: 2026-07-11 (PR #7; the deferral itself was decided in PR #6)

## Context

In reality, buying or selling securities and receiving dividends all move the cash balance of an account. Modeling this in a double-entry style (a `BUY` decreases cash, a `DIVIDEND` increases it) is possible, but it would require cross-transaction consistency checks and handling across currencies and accounts, significantly complicating both the schema and the logic.

## Decision

Cash balance is derived from `DEPOSIT` / `WITHDRAW` transactions only (single-entry bookkeeping). `BUY` / `SELL` / `DIVIDEND` do not affect the cash balance. Cash itself is held as an `Asset` of type `CASH`, so total-asset aggregation uses the same code path as every other asset type.

## Consequences

The derivation logic (`deriveCashBalance`) stays simple. Users must enter `DEPOSIT` / `WITHDRAW` manually to track cash movements. If that becomes tedious, the solution is not to make the derivation double-entry, but to generate paired transactions at registration time (e.g. when a `DIVIDEND` is registered, suggest creating the corresponding `DEPOSIT`).

# 0001. Record design decisions as ADRs

Date: 2026-07-11

## Context

Significant design decisions — both what was adopted and what was deliberately deferred — have so far been scattered across pull request descriptions. PR descriptions are a valid place to record context, but there is no way to browse decisions as a list, and as the repository grows, answering "why is it built this way?" becomes increasingly expensive.

## Decision

Operate Architecture Decision Records (ADRs) under `docs/adr/`.

- One decision per file, named with a 4-digit sequence number and an English kebab-case slug (e.g. `0002-derive-holdings-from-transaction-ledger.md`)
- Each ADR has three sections: Context / Decision / Consequences
- ADRs are append-only. To reverse or revise a decision, do not edit the original — add a new ADR and prepend a reference to the successor at the top of the old one
- The scope is decisions that affect architecture or design policy; day-to-day implementation choices do not require an ADR

## Consequences

The history of design decisions can be traced entirely within the repository. To start the practice, the existing major decisions have been backfilled as ADRs 0002–0006.

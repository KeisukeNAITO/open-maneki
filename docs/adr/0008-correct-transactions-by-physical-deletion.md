# 0008. Correct transactions by physical deletion

Date: 2026-07-24 (issue #30)

## Context

Transactions could be registered but not corrected. Corrections were split into slices starting with deletion, since deletion alone already supports the "delete and re-enter" correction model — the same approach the price form takes with its upsert overwrite (PR #12).

The transaction table is the single source of truth for holdings, cash, valuation, and other views (ADR 0002), so "how a correction is stored" is a real design choice. Three options were considered: physical deletion (`DELETE`), a soft-delete flag (`voided`), and append-only reversal (posting an opposite entry). Soft-delete and reversal preserve a correction history and are closer to accounting practice, but this is a single-user app with no accounting or audit requirement, so that value does not apply here. Meanwhile a `voided` flag would add a lasting hazard: every current and future reader of the ledger (holdings, cash, valuation, watchlist, and the planned P/L and dividend views) would have to remember to exclude voided rows, and the number of such readers only grows in this derive-everything-from-the-ledger design. A loose spec is also cheap to tighten later — adding a flag and turning `DELETE` into `UPDATE` is a smaller, reversible step than the opposite.

## Decision

Correct transactions by **physical deletion** (`DELETE`), not soft-delete or append-only reversal. A deletion must not break a ledger invariant: before deleting, run the derivation over the transactions that would remain for the same account × asset (`simulateLedger`) and reject the deletion if it fails (for example, deleting a BUY that would leave a later SELL overselling). Editing is a follow-up slice implemented as a physical `UPDATE` reusing the same simulation check.

## Consequences

Readers of the ledger stay simple: a deleted row is simply gone, so no query or derivation needs an "exclude voided" clause, and no correction leaves a trace. The cost is that a deletion cannot be undone; this is mitigated by a confirmation prompt in the UI, the simulation check that blocks corruptions, and the backup guidance in the user guide. If a correction history or audit trail is ever needed, migrate to soft-delete (add a `voided` timestamp and turn `DELETE` into `UPDATE`), which this decision is deliberately kept cheap to do.

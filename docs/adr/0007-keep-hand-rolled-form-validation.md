# 0007. Keep hand-rolled form validation instead of adopting a schema library

Date: 2026-07-20 (issue #21)

## Context

Adopting a validation library (e.g. zod) was deferred when the first form was built (PR #12), with the trigger: revisit when more forms exist and validation starts to duplicate. With four forms in place (prices, transactions, accounts, assets), an inventory showed that the mechanical parts of validation are already shared (`forms.ts`, `parseMoney`, type guards), and that the bulk of each validator is logic a schema library cannot express declaratively: duplicate checks against existing rows, currency forced by asset type, transaction-type × asset-type consistency, amounts parseable only after the asset's currency is known, conditionally required fields, and the ledger simulation check. With a library, these would be restated as hand-written code inside escape hatches such as `superRefine`. Actual duplication across validators is two small patterns, each appearing twice.

## Decision

Keep validation as hand-rolled pure functions in `src/lib/server/`, one module per form, sharing common pieces through `forms.ts`. Do not adopt a schema validation library. Extract the remaining duplicated patterns into `forms.ts` only when a third usage appears (rule of three).

## Consequences

No new runtime dependency, and the established pattern (per-field error objects, `fail(400)` with input preservation, exhaustive tests) stays untouched. Each new form pays the cost of writing its validator by hand. Revisit if client-side validation sharing becomes desirable (schema reuse in the browser is the main strength of a library), or if the number of forms grows to where mechanical validation dominates; the full analysis is recorded in issue #21.

# 0005. Compute average cost by prorating the total amount, not by rounding the unit price first

Date: 2026-07-11 (PR #7)

## Context

Acquisition cost is managed by the moving-average method. If the implementation rounded the average unit price first and then multiplied it by the quantity sold, rounding would accumulate — because money is stored as integers (ADR 0003) — and selling an entire position could leave a few yen of acquisition cost behind (or drive it negative).

## Decision

When a sale reduces the position, the cost released is computed by prorating the total acquisition cost by the ratio of quantity sold (rounded half up), without rounding the average unit price first. This guarantees the invariant "quantity is zero if and only if acquisition cost is zero" without error. Implemented in `derivePosition` in `src/lib/server/holdings.ts`.

## Consequences

Tests can guarantee that no residual cost remains after a full sale. Note that the Japanese tax method ("method equivalent to the periodic average method") fixes the average unit price by rounding up to the yen at each purchase, so its figures can differ from this implementation by rounding. The purpose of this app is understanding one's asset position, not computing tax amounts, so self-consistency was prioritized.

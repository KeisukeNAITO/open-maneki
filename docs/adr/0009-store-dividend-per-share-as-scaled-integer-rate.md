# 0009. Store dividend-per-share as a scaled integer rate

Date: 2026-07-31 (issue #34, #36)

## Context

ADR 0003 stores money as integers in the minor currency unit (yen, cents). A dividend per share does not fit that rule: it is routinely fractional in the minor unit (28.5 yen/share, $0.245/share = 24.5 cents). Rounding it to the minor unit at storage time would accumulate error once it is multiplied by a share count and prorated by an elapsed fraction (the accrual view, #36). `Float` is unsuitable for the same reason ADR 0003 rejects it.

## Decision

`DividendForecast.amountPerShare` is stored as a **scaled integer rate**: the minor currency unit multiplied by `DIVIDEND_RATE_SCALE` (10,000). So 28.5 yen/share is `285000` and $0.245/share is `245000` (24.5 cents × 10,000). Conversion to and from the display value is done with integer / string math in `parseDividendRate` / `formatDividendRate`, mirroring `parseMoney` / `formatMoney`.

Rounding back to the minor unit happens **once**, at the point a concrete amount is produced — when the accrual view computes `amountPerShare × quantity × elapsed / period`. That single division uses BigInt to avoid precision loss (the rate can be up to `INT32_MAX`, and quantity × days can push the product past `2^53`).

## Consequences

Per-share dividends keep four extra digits of precision through every intermediate multiplication, and rounding error is introduced exactly once, at display time, rather than at storage. ADR 0003 still holds for all balances and settlement amounts; this is a narrow exception for a per-share _rate_, not a stored money value. When adding another rate-like fractional quantity (for example a FUND distribution per 10,000 units), reuse the same scaled-rate approach rather than storing it in the minor unit.

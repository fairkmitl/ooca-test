# Test Case Report

> Food Store Calculator — Business Rule Test Matrix
>
> **Last updated:** 2026-03-16
> **Test runner:** Vitest 4.x with V8 coverage
> **Test files:** `tests/pricing.test.ts`, `tests/redSetRestriction.test.ts`

---

## Summary

| Metric | Value |
|--------|-------|
| Total automated test cases | 39 |
| Test files | 2 |
| Statement coverage | 97.77% |
| Branch coverage | 94.11% |
| Function coverage | 100% |
| Line coverage | 100% |

Coverage is measured over the pure business-logic modules (`pricing.ts`, `redSetRestriction.ts`, `constants.ts`).
The database-dependent `memberValidation.ts` is excluded from unit coverage — it is exercised through manual API testing.

---

## 1. Subtotal Calculation

Basic price × quantity arithmetic for all products.

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| S-1 | Empty order | `[]` | Subtotal = 0 | Yes |
| S-2 | Single item, quantity 1 | Red ×1 | Subtotal = 50 | Yes |
| S-3 | Multiple different items | Red ×1, Green ×1, Blue ×1 | Subtotal = 120 | Yes |
| S-4 | Same item, multiple quantity | Orange ×3 | Subtotal = 360 | Yes |
| S-5 | Unknown product code in mix | unknown ×5, Red ×1 | Subtotal = 50 (unknown ignored) | Yes |
| S-6 | All 7 products, quantity 1 each | All ×1 | Subtotal = 460 | Yes |

---

## 2. Pair Discount Rules

5% discount per complete pair of eligible items (Orange, Pink, Green only).

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| PD-1 | Non-eligible items, even quantity | Red ×4, Blue ×6 | No pair discounts | Yes |
| PD-2 | Eligible item, quantity 1 (no pair) | Orange ×1 | No pair discount | Yes |
| PD-3 | Orange ×2 — one pair | Orange ×2 | 1 pair, discount = ฿12 | Yes |
| PD-4 | Pink ×4 — two pairs | Pink ×4 | 2 pairs, discount = ฿16 | Yes |
| PD-5 | Green ×3 — one pair + leftover | Green ×3 | 1 pair, discount = ฿4 (third item full price) | Yes |
| PD-6 | All 3 eligible items, each ×2 | Orange ×2, Pink ×2, Green ×2 | Orange ฿12, Pink ฿8, Green ฿4 | Yes |
| PD-7 | Large quantity with odd leftover | Orange ×5 | 2 pairs, discount = ฿24 (fifth item full price) | Yes |

---

## 3. Member Card Discount

10% discount on subtotal after pair discounts, only for valid active members.

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| MD-1 | Invalid member — no discount | subtotal = 100, valid = false | Discount = 0 | Yes |
| MD-2 | Valid member — 10% off | subtotal = 100, valid = true | Discount = 10 | Yes |
| MD-3 | Decimal rounding | subtotal = 155, valid = true | Discount = 15.50 | Yes |
| MD-4 | Zero subtotal with valid member | subtotal = 0, valid = true | Discount = 0 | Yes |
| MD-5 | Invalid card number not in DB | Any items, card = "INVALID" | memberCardValid = false, no discount | No (API-level) |
| MD-6 | Inactive member card | Any items, card = "MEMBER003" | memberCardValid = false, no discount | No (API-level) |
| MD-7 | No card number provided | Any items, no card | memberCardValid = null | No (API-level) |

> **Note:** MD-5 through MD-7 involve database lookups via `memberValidation.ts` and are verified through API testing, not pure unit tests.

---

## 4. Full Calculation (End-to-End Logic)

Integration of subtotal, pair discounts, and member discount in the correct order:
Subtotal → subtract pair discounts → apply 10% member discount on remainder.

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| FC-1 | No discount, single non-eligible item | Red ×1, no member | Sub 50, pair 0, member 0, final 50 | Yes |
| FC-2 | Pair discount only | Orange ×2, no member | Sub 240, pair 12, member 0, final 228 | Yes |
| FC-3 | Member discount only | Red ×1 + Blue ×1, valid member | Sub 80, pair 0, member 8, final 72 | Yes |
| FC-4 | Pair + member discount combined | Orange ×2 + Red ×1, valid member | Sub 290, pair 12, member 27.80, final 250.20 | Yes |
| FC-5 | Multiple pairs + member | Orange ×2 + Pink ×4 + Green ×3, valid member | Sub 680, pair 32, member 64.80, final 583.20 | Yes |
| FC-6 | Zero-quantity items filtered | Red ×0 + Blue ×2, no member | Sub 60, final 60 (Red ignored) | Yes |
| FC-7 | Unknown product codes filtered | unknown ×5 + Red ×1, no member | Sub 50, final 50 (unknown ignored) | Yes |
| FC-8 | Empty cart | `[]` | All values = 0 | Yes |
| FC-9 | All quantities zero | Red ×0, Green ×0 | All values = 0 | Yes |
| FC-10 | Large order, all items ×2, with member | All 7 items ×2, valid member | Sub 920, pair 24, member 89.60, final 806.40 | Yes |
| FC-11 | Success flag set | Red ×1 | `success = true` | Yes |

---

## 5. Red Set Restriction (1-Hour Cooldown)

Only one order containing Red set is allowed per hour, globally.

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| RS-1 | No prior Red set order | lastRedSetOrder = null | Allowed | Yes |
| RS-2 | Last order < 1 hour ago (30 min) | lastOrder = 30 min ago | Blocked | Yes |
| RS-3 | Last order exactly 1 hour ago | lastOrder = 60 min ago | Allowed (boundary: >=) | Yes |
| RS-4 | Last order > 1 hour ago (2 hours) | lastOrder = 2 hours ago | Allowed | Yes |
| RS-5 | Last order 59 min 59 sec ago | lastOrder = 59m59s ago | Blocked | Yes |
| RS-6 | Last order 1 second ago | lastOrder = 1s ago | Blocked | Yes |

---

## 6. Red Set Detection in Order

Helper that determines whether an order contains Red set with quantity > 0.

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| RD-1 | Empty items | `[]` | false | Yes |
| RD-2 | No Red set in order | Green ×2, Blue ×1 | false | Yes |
| RD-3 | Red set present, quantity > 0 | Red ×1, Blue ×1 | true | Yes |
| RD-4 | Red set present, quantity = 0 | Red ×0, Blue ×1 | false | Yes |
| RD-5 | Red set only, high quantity | Red ×3 | true | Yes |

---

## 7. API / Validation Edge Cases

These are enforced in the API route handler (`POST /api/calculate`) and verified through manual/integration testing.

| ID | Scenario | Input | Expected Result | Automated |
|----|----------|-------|-----------------|-----------|
| API-1 | Missing items array | `{}` | 400 — "Items array is required" | No (API-level) |
| API-2 | Negative quantity | `[{productCode: "red", quantity: -1}]` | 400 — "All quantities must be non-negative" | No (API-level) |
| API-3 | Empty active cart | All items quantity 0 | 400 — "Cart is empty" | No (API-level) |
| API-4 | Red set blocked within cooldown | Red ×1 (second call < 1hr) | 409 — "Red set temporarily unavailable" | No (API-level) |
| API-5 | Order without Red unaffected by cooldown | Blue ×1 (after Red order) | 200 — Success | No (API-level) |
| API-6 | Order recorded on success | Any valid order | Order row created in DB | No (API-level) |

> **Note:** API-level cases are tested manually or via `curl`. They could be promoted to integration tests using a test database in a future iteration.

---

## Coverage Exclusions

| File | Reason for exclusion |
|------|---------------------|
| `src/lib/services/memberValidation.ts` | Depends on Prisma database client; not unit-testable without mocking |
| `src/lib/db.ts` | Prisma client singleton — infrastructure, not business logic |
| `src/lib/types.ts` | Type-only file, no runtime code |
| `src/generated/**` | Auto-generated Prisma client |

---

## How to Run

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Open HTML coverage report in browser (macOS)
npm run test:coverage:open
```

Coverage HTML report: `coverage/index.html`

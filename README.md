# Food Store Calculator

A full-stack calculator application for a food store with discount rules, member validation, and order restrictions.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via Prisma 7 + better-sqlite3 adapter
- **Testing**: Vitest with V8 coverage

## Architecture Overview

```
src/
├── app/
│   ├── api/
│   │   ├── products/route.ts    # GET /api/products
│   │   └── calculate/route.ts   # POST /api/calculate
│   ├── page.tsx                 # Main UI page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ProductCard.tsx           # Product item with quantity controls
│   ├── MemberCardInput.tsx       # Member card number input
│   ├── CalculationSummary.tsx    # Calculation results display
│   └── ErrorMessage.tsx          # Error display component
├── lib/
│   ├── types.ts                  # Shared TypeScript types
│   ├── constants.ts              # Business rule constants
│   ├── api.ts                    # Frontend API client functions
│   ├── db.ts                     # Prisma client singleton
│   └── services/
│       ├── pricing.ts            # Pure calculation and discount logic
│       ├── redSetRestriction.ts  # Red set 1-hour restriction logic
│       ├── memberValidation.ts   # Member card DB validation
│       └── orderService.ts       # Order processing orchestration
└── generated/prisma/             # Prisma generated client (gitignored)

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Database seed script
└── migrations/                   # Database migrations

tests/
├── pricing.test.ts               # Unit tests for pricing logic
└── redSetRestriction.test.ts     # Unit tests for Red set restriction

docs/
└── test-case-report.md           # Full test case matrix for reviewers
```

### Design Decisions

- **Prisma with better-sqlite3 adapter**: Prisma 7 requires driver adapters. The better-sqlite3 adapter provides synchronous SQLite access which is ideal for a local development setup.
- **Pure services vs. orchestration**: `pricing.ts` and `redSetRestriction.ts` are pure functions with no database dependencies, making them easy to unit test. `orderService.ts` orchestrates the full order flow (red set check, product loading, member validation, calculation, order recording), keeping the route handler thin and focused on HTTP concerns only.
- **API client separated from components**: `api.ts` encapsulates all fetch calls so UI components don't contain data-fetching logic.
- **Constants in a single file**: All business rule values (discount rates, cooldown period, eligible product codes, restricted product code) are centralized in `constants.ts`.

## Setup Instructions

### Prerequisites

- Node.js 18+ (tested with Node 24)
- npm

### Install Dependencies

```bash
npm install
```

### Environment Setup

Copy the example env file:

```bash
cp .env.example .env
```

### Database Setup and Seed

Run the initial migration and seed the database:

```bash
npm run db:setup
```

This will:
1. Create the SQLite database (`dev.db`) with the schema
2. Seed 7 products, 3 sample members

Alternatively, run each step individually:

```bash
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed the database
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

This generates:
- **Terminal summary** — inline text + text-summary reporters
- **HTML report** — open `coverage/index.html` in a browser
- **LCOV data** — `coverage/lcov.info` for CI integration

Run `npm run test:coverage:open` to generate the report and open it in your browser in one step (works on macOS, Linux, and Windows).

### Coverage scope

Coverage is measured over the pure business-logic modules:

| File | Included | Reason |
|------|----------|--------|
| `src/lib/services/pricing.ts` | Yes | Core calculation logic |
| `src/lib/services/redSetRestriction.ts` | Yes | Red set cooldown logic |
| `src/lib/constants.ts` | Yes | Business rule constants |
| `src/lib/services/orderService.ts` | No | Orchestration layer — depends on database |
| `src/lib/services/memberValidation.ts` | No | Database-dependent (integration concern) |
| `src/lib/db.ts` | No | Prisma infrastructure |
| `src/lib/types.ts` | No | Type-only, no runtime code |

Minimum thresholds enforced: 80% for statements, branches, functions, and lines.

### Test case report

A detailed, reviewer-friendly test case matrix is available at:

> [`docs/test-case-report.md`](docs/test-case-report.md)

It covers 40 automated test cases and 6 additional API-level cases, organized by category:
- Subtotal calculation
- Pair discount rules
- Member card discount
- Full calculation (integration)
- Red set restriction
- Red set detection
- API / validation edge cases

## API Endpoint Summary

### `GET /api/products`

Returns products from the database with optional sorting and pagination.

**Query parameters (all optional):**

| Param | Type | Default | Example |
|-------|------|---------|---------|
| `sortBy` | `id` \| `name` \| `price` \| `code` | `id` | `?sortBy=price` |
| `sortOrder` | `asc` \| `desc` | `asc` | `?sortOrder=desc` |
| `limit` | non-negative int | `20` | `?limit=10` |
| `offset` | non-negative int | `0` | `?offset=20` |

**Response:**
```json
{
  "data": [
    { "id": 1, "code": "red", "name": "Red set", "price": 50 },
    { "id": 2, "code": "green", "name": "Green set", "price": 40 }
  ],
  "total": 7,
  "limit": 20,
  "offset": 0
}
```

### `POST /api/calculate`

Calculates the total price with applicable discounts.

**Request body:**
```json
{
  "items": [
    { "productCode": "orange", "quantity": 2 },
    { "productCode": "pink", "quantity": 4 }
  ],
  "memberCardNumber": "MEMBER001"
}
```

**Success response (200):**
```json
{
  "success": true,
  "totalBeforeDiscount": 560,
  "itemDiscounts": [
    {
      "productCode": "orange",
      "productName": "Orange set",
      "pairsCount": 1,
      "discountAmount": 12
    },
    {
      "productCode": "pink",
      "productName": "Pink set",
      "pairsCount": 2,
      "discountAmount": 16
    }
  ],
  "totalItemDiscount": 28,
  "memberDiscount": 53.2,
  "memberCardValid": true,
  "finalTotal": 478.8
}
```

**Error responses:**

| Status | Scenario |
|--------|----------|
| 400 | Empty cart, missing items array, invalid quantities |
| 409 | Red set ordered within 1-hour cooldown window |
| 500 | Internal server error |

## Assumptions and Business Rule Clarifications

### Discount Application Order

Discounts are applied in this sequence:
1. **Calculate subtotal** — sum of all (price × quantity)
2. **Apply pair discounts** — 5% off each complete pair of eligible items (Orange, Pink, Green)
3. **Apply member discount** — 10% off the subtotal after pair discounts

This means the member discount is applied on the already-discounted subtotal, not the original total. This is the fairest approach for the customer and the most common pattern in retail systems.

### Calculate Endpoint Records an Order

Every successful calculation via `POST /api/calculate` records an order in the database. This serves two purposes:
- Tracks the Red set 1-hour restriction via the `hasRedSet` flag and `createdAt` timestamp
- Provides an order history audit trail

### Red Set 1-Hour Restriction

- When an order containing Red set (quantity > 0) is successfully calculated, the timestamp is recorded
- Any subsequent order containing Red set within 1 hour of the last Red set order is rejected with a 409 status
- Orders without Red set are always unaffected by this restriction
- The restriction is based on the most recent Red set order's timestamp, checked globally (not per-user)

### Member Card Validation

- If no member card number is provided, `memberCardValid` returns `null` (not applicable)
- If a card number is provided but not found in the database (or the member is inactive), `memberCardValid` returns `false` and no member discount is applied
- The calculation still succeeds — only a warning is shown in the UI
- Sample members seeded in the database:
  - `MEMBER001` — Alice Johnson (active)
  - `MEMBER002` — Bob Smith (active)
  - `MEMBER003` — Charlie Brown (inactive, no discount applied)

### Pair Discount Details

- Only Orange, Pink, and Green sets are eligible for pair discounts
- Discount is 5% per complete pair (i.e., per 2 items)
- Odd items get no pair discount (e.g., 3 Green = 1 pair discount + 1 at full price)
- Multiple pairs of the same item each get the 5% discount independently

## Test Case Matrix

A quick overview of key scenarios. For the full matrix with 40+ categorized test cases, see [`docs/test-case-report.md`](docs/test-case-report.md).

| # | Category | Scenario | Expected |
|---|----------|----------|----------|
| 1 | Subtotal | Single item Red ×1 | Total = 50 |
| 2 | Pair discount | Orange ×2 (one pair) | Pair -12, final 228 |
| 3 | Pair discount | Pink ×4 (two pairs) | Pair -16, final 304 |
| 4 | Pair discount | Green ×3 (pair + leftover) | Pair -4, final 116 |
| 5 | Pair discount | Orange ×5 (two pairs + leftover) | Pair -24, final 576 |
| 6 | Member | Valid card, no pairs | 10% off subtotal |
| 7 | Member | Invalid card | No discount, warning |
| 8 | Combined | Pairs + member discount | Pair discounts first, then 10% member |
| 9 | Red set | First order | Allowed |
| 10 | Red set | Second order < 1 hour | 409 rejected |
| 11 | Red set | Order after 1 hour | Allowed |
| 12 | Validation | Empty cart | 400 error |
| 13 | Validation | Unknown product code | Ignored silently |

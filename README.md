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
│   ├── db.ts                     # Prisma client singleton
│   └── services/
│       ├── pricing.ts            # Calculation and discount logic
│       ├── redSetRestriction.ts  # Red set 1-hour restriction
│       └── memberValidation.ts   # Member card validation
└── generated/prisma/             # Prisma generated client (gitignored)

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Database seed script
└── migrations/                   # Database migrations

tests/
├── pricing.test.ts               # Unit tests for pricing logic
└── redSetRestriction.test.ts     # Unit tests for Red set restriction
```

### Design Decisions

- **Prisma with better-sqlite3 adapter**: Prisma 7 requires driver adapters. The better-sqlite3 adapter provides synchronous SQLite access which is ideal for a local development setup.
- **Calculation logic extracted into pure services**: `pricing.ts` and `redSetRestriction.ts` are pure functions with no database dependencies, making them easy to test independently.
- **Member validation as a separate service**: `memberValidation.ts` handles database interaction for member lookups, keeping it separate from the pure calculation logic.
- **Constants in a single file**: All magic numbers (discount rates, cooldown period, eligible product codes) are centralized in `constants.ts`.

## Setup Instructions

### Prerequisites

- Node.js 18+ (tested with Node 22)
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

### Run tests with coverage report

```bash
npm run test:coverage
```

Coverage report is generated in the `coverage/` directory. Open `coverage/index.html` in a browser for the HTML report.

## API Endpoint Summary

### `GET /api/products`

Returns all available products from the database.

**Response:**
```json
[
  { "id": 1, "code": "red", "name": "Red set", "price": 50 },
  { "id": 2, "code": "green", "name": "Green set", "price": 40 },
  ...
]
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

| # | Scenario | Items | Member | Expected Behavior |
|---|----------|-------|--------|-------------------|
| 1 | No discount, single item | Red ×1 | — | Total = 50, no discounts |
| 2 | No discount, multiple items | Red ×1, Blue ×1 | — | Total = 80, no discounts |
| 3 | Orange pair discount (×2) | Orange ×2 | — | Subtotal 240, pair -12, final 228 |
| 4 | Pink pair discount (×4, two pairs) | Pink ×4 | — | Subtotal 320, pair -16, final 304 |
| 5 | Green pair discount (×3, one pair + leftover) | Green ×3 | — | Subtotal 120, pair -4, final 116 |
| 6 | Orange odd leftover (×5, two pairs) | Orange ×5 | — | Subtotal 600, pair -24, final 576 |
| 7 | Multiple eligible items | Orange ×2, Pink ×2, Green ×2 | — | Pair discounts: 12+8+4=24 |
| 8 | Member discount only (valid card) | Red ×1, Blue ×1 | MEMBER001 | Subtotal 80, member -8, final 72 |
| 9 | Invalid member card | Blue ×1 | INVALID | memberCardValid=false, no discount |
| 10 | Inactive member card | Blue ×1 | MEMBER003 | memberCardValid=false, no discount |
| 11 | Pair discount + member discount | Orange ×2, Red ×1 | MEMBER001 | Sub 290, pair -12, member -27.8, final 250.2 |
| 12 | All items, all discounts | Orange ×2, Pink ×2, Green ×2, others ×2 | MEMBER001 | Full calculation with all discount types |
| 13 | Red set — first order allowed | Red ×1 | — | Success |
| 14 | Red set — second order within 1hr blocked | Red ×1 (after #13) | — | 409 error |
| 15 | Order without Red set — unaffected | Blue ×1 (after #13) | — | Success regardless of Red set cooldown |
| 16 | Red set — allowed after 1 hour | Red ×1 (>1hr after last) | — | Success |
| 17 | Empty cart | (all quantities 0) | — | 400 error |
| 18 | Zero-quantity items filtered | Red ×0, Blue ×2 | — | Only Blue counted, total 60 |
| 19 | Unknown product code ignored | unknown ×5, Red ×1 | — | Only Red counted, total 50 |
| 20 | No member card provided | Any | — | memberCardValid=null |
| 21 | Red set exactly at 1-hour boundary | Red ×1 (exactly 60 min) | — | Allowed (>= 1hr) |
| 22 | Red set at 59m59s | Red ×1 (59m59s after) | — | Blocked |

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SORT_FIELDS = ["id", "name", "price", "code"] as const;
type SortField = (typeof SORT_FIELDS)[number];

const SORT_ORDERS = ["asc", "desc"] as const;
type SortOrder = (typeof SORT_ORDERS)[number];

const DEFAULT_SORT_BY: SortField = "id";
const DEFAULT_SORT_ORDER: SortOrder = "asc";
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const sortBy = parseSortField(params.get("sortBy"));
  const sortOrder = parseSortOrder(params.get("sortOrder"));
  const limit = parsePositiveInt(params.get("limit"), DEFAULT_LIMIT);
  const offset = parsePositiveInt(params.get("offset"), DEFAULT_OFFSET);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    }),
    prisma.product.count(),
  ]);

  return NextResponse.json({ data: products, total, limit, offset });
}

function parseSortField(value: string | null): SortField {
  if (value && SORT_FIELDS.includes(value as SortField)) {
    return value as SortField;
  }
  return DEFAULT_SORT_BY;
}

function parseSortOrder(value: string | null): SortOrder {
  if (value && SORT_ORDERS.includes(value as SortOrder)) {
    return value as SortOrder;
  }
  return DEFAULT_SORT_ORDER;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

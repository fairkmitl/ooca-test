import { NextRequest, NextResponse } from "next/server";
import { processOrder } from "@/lib/services/orderService";
import type { CalculateRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequest = await request.json();
    const { items, memberCardNumber } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Items array is required" },
        { status: 400 }
      );
    }

    const hasInvalidQuantity = items.some(
      (item) => typeof item.quantity !== "number" || item.quantity < 0
    );
    if (hasInvalidQuantity) {
      return NextResponse.json(
        { success: false, error: "All quantities must be non-negative numbers" },
        { status: 400 }
      );
    }

    const activeItems = items.filter((item) => item.quantity > 0);
    if (activeItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty — add at least one item" },
        { status: 400 }
      );
    }

    const result = await processOrder({ items, memberCardNumber });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Calculate API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

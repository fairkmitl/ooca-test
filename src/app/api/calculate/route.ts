import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateTotal } from "@/lib/services/pricing";
import { hasRedSetInOrder, isRedSetAllowed } from "@/lib/services/redSetRestriction";
import { validateMemberCard } from "@/lib/services/memberValidation";
import type { CalculateRequest, Product } from "@/lib/types";

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

    // Red set restriction check
    if (hasRedSetInOrder(items)) {
      const lastRedOrder = await prisma.order.findFirst({
        where: { hasRedSet: true },
        orderBy: { createdAt: "desc" },
      });

      if (!isRedSetAllowed(lastRedOrder?.createdAt ?? null)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Red set is temporarily unavailable. Only one Red set order is allowed per hour. Please try again later.",
          },
          { status: 409 }
        );
      }
    }

    // Load products from database
    const products = await prisma.product.findMany();
    const productMap = new Map<string, Product>(
      products.map((p) => [p.code, p])
    );

    // Validate member card
    const memberCardProvided = !!memberCardNumber && memberCardNumber.trim() !== "";
    let isMemberValid = false;
    if (memberCardProvided) {
      isMemberValid = await validateMemberCard(memberCardNumber);
    }

    // Calculate totals
    const result = calculateTotal(items, productMap, isMemberValid);

    if (memberCardProvided) {
      result.memberCardValid = isMemberValid;
    } else {
      result.memberCardValid = null;
    }

    // Record the order (for Red set restriction tracking)
    await prisma.order.create({
      data: {
        hasRedSet: hasRedSetInOrder(items),
        summary: JSON.stringify({
          items: activeItems,
          memberCardNumber: memberCardNumber || null,
          finalTotal: result.finalTotal,
        }),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Calculate API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

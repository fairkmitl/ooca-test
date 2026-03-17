import { prisma } from "@/lib/db";
import { calculateTotal } from "@/lib/services/pricing";
import { hasRedSetInOrder, isRedSetAllowed } from "@/lib/services/redSetRestriction";
import { validateMemberCard } from "@/lib/services/memberValidation";
import type { OrderItem, CalculateResponse, Product } from "@/lib/types";

interface ProcessOrderInput {
  items: OrderItem[];
  memberCardNumber?: string;
}

export async function processOrder(
  input: ProcessOrderInput
): Promise<CalculateResponse> {
  const { items, memberCardNumber } = input;
  const activeItems = items.filter((item) => item.quantity > 0);

  if (hasRedSetInOrder(activeItems)) {
    const lastRedOrder = await prisma.order.findFirst({
      where: { hasRedSet: true },
      orderBy: { createdAt: "desc" },
    });

    if (!isRedSetAllowed(lastRedOrder?.createdAt ?? null)) {
      return {
        success: false,
        totalBeforeDiscount: 0,
        itemDiscounts: [],
        totalItemDiscount: 0,
        memberDiscount: 0,
        memberCardValid: null,
        finalTotal: 0,
        error:
          "Red set is temporarily unavailable. Only one Red set order is allowed per hour. Please try again later.",
      };
    }
  }

  const products = await prisma.product.findMany();
  const productMap = new Map<string, Product>(
    products.map((p) => [p.code, p])
  );

  const memberCardProvided = !!memberCardNumber && memberCardNumber.trim() !== "";
  let memberCardValid: boolean | null = null;
  if (memberCardProvided) {
    memberCardValid = await validateMemberCard(memberCardNumber);
  }

  const result = calculateTotal(items, productMap, memberCardValid);

  await prisma.order.create({
    data: {
      hasRedSet: hasRedSetInOrder(activeItems),
      summary: JSON.stringify({
        items: activeItems,
        memberCardNumber: memberCardNumber || null,
        finalTotal: result.finalTotal,
      }),
    },
  });

  return result;
}

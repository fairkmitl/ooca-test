import {
  PAIR_DISCOUNT_ELIGIBLE_CODES,
  PAIR_DISCOUNT_RATE,
  MEMBER_DISCOUNT_RATE,
} from "@/lib/constants";
import type { Product, OrderItem, ItemDiscount, CalculateResponse } from "@/lib/types";

export function calculateSubtotal(
  items: OrderItem[],
  productMap: Map<string, Product>
): number {
  let total = 0;
  for (const item of items) {
    const product = productMap.get(item.productCode);
    if (!product) continue;
    total += product.price * item.quantity;
  }
  return roundToTwo(total);
}

export function calculatePairDiscounts(
  items: OrderItem[],
  productMap: Map<string, Product>
): ItemDiscount[] {
  const discounts: ItemDiscount[] = [];

  for (const item of items) {
    if (!PAIR_DISCOUNT_ELIGIBLE_CODES.includes(item.productCode)) continue;
    if (item.quantity < 2) continue;

    const product = productMap.get(item.productCode);
    if (!product) continue;

    const pairsCount = Math.floor(item.quantity / 2);
    const pairPrice = product.price * 2;
    const discountAmount = roundToTwo(pairPrice * PAIR_DISCOUNT_RATE * pairsCount);

    discounts.push({
      productCode: product.code,
      productName: product.name,
      pairsCount,
      discountAmount,
    });
  }

  return discounts;
}

export function calculateMemberDiscount(
  subtotalAfterPairDiscounts: number,
  isMemberValid: boolean
): number {
  if (!isMemberValid) return 0;
  return roundToTwo(subtotalAfterPairDiscounts * MEMBER_DISCOUNT_RATE);
}

export function calculateTotal(
  items: OrderItem[],
  productMap: Map<string, Product>,
  memberCardValid: boolean | null
): CalculateResponse {
  const validItems = items.filter(
    (item) => item.quantity > 0 && productMap.has(item.productCode)
  );

  const totalBeforeDiscount = calculateSubtotal(validItems, productMap);
  const itemDiscounts = calculatePairDiscounts(validItems, productMap);
  const totalItemDiscount = roundToTwo(
    itemDiscounts.reduce((sum, d) => sum + d.discountAmount, 0)
  );
  const subtotalAfterPairDiscounts = roundToTwo(totalBeforeDiscount - totalItemDiscount);
  const memberDiscount = calculateMemberDiscount(
    subtotalAfterPairDiscounts,
    memberCardValid === true
  );
  const finalTotal = roundToTwo(subtotalAfterPairDiscounts - memberDiscount);

  return {
    success: true,
    totalBeforeDiscount,
    itemDiscounts,
    totalItemDiscount,
    memberDiscount,
    memberCardValid,
    finalTotal,
  };
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

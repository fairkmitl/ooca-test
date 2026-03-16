import { describe, it, expect } from "vitest";
import {
  calculateSubtotal,
  calculatePairDiscounts,
  calculateMemberDiscount,
  calculateTotal,
} from "@/lib/services/pricing";
import type { Product, OrderItem } from "@/lib/types";

const PRODUCTS: Product[] = [
  { id: 1, code: "red", name: "Red set", price: 50 },
  { id: 2, code: "green", name: "Green set", price: 40 },
  { id: 3, code: "blue", name: "Blue set", price: 30 },
  { id: 4, code: "yellow", name: "Yellow set", price: 50 },
  { id: 5, code: "pink", name: "Pink set", price: 80 },
  { id: 6, code: "purple", name: "Purple set", price: 90 },
  { id: 7, code: "orange", name: "Orange set", price: 120 },
];

function makeProductMap(products: Product[] = PRODUCTS): Map<string, Product> {
  return new Map(products.map((p) => [p.code, p]));
}

describe("calculateSubtotal", () => {
  const productMap = makeProductMap();

  it("returns 0 for empty items", () => {
    expect(calculateSubtotal([], productMap)).toBe(0);
  });

  it("calculates single item correctly", () => {
    const items: OrderItem[] = [{ productCode: "red", quantity: 1 }];
    expect(calculateSubtotal(items, productMap)).toBe(50);
  });

  it("calculates multiple different items", () => {
    const items: OrderItem[] = [
      { productCode: "red", quantity: 1 },
      { productCode: "green", quantity: 1 },
      { productCode: "blue", quantity: 1 },
    ];
    expect(calculateSubtotal(items, productMap)).toBe(120);
  });

  it("calculates multiple quantities of same item", () => {
    const items: OrderItem[] = [{ productCode: "orange", quantity: 3 }];
    expect(calculateSubtotal(items, productMap)).toBe(360);
  });

  it("ignores unknown product codes", () => {
    const items: OrderItem[] = [
      { productCode: "unknown", quantity: 5 },
      { productCode: "red", quantity: 1 },
    ];
    expect(calculateSubtotal(items, productMap)).toBe(50);
  });

  it("calculates all 7 items with quantity 1", () => {
    const items: OrderItem[] = PRODUCTS.map((p) => ({
      productCode: p.code,
      quantity: 1,
    }));
    // 50 + 40 + 30 + 50 + 80 + 90 + 120 = 460
    expect(calculateSubtotal(items, productMap)).toBe(460);
  });
});

describe("calculatePairDiscounts", () => {
  const productMap = makeProductMap();

  it("returns no discounts for non-eligible items", () => {
    const items: OrderItem[] = [
      { productCode: "red", quantity: 4 },
      { productCode: "blue", quantity: 6 },
    ];
    expect(calculatePairDiscounts(items, productMap)).toEqual([]);
  });

  it("returns no discount for eligible item with quantity 1", () => {
    const items: OrderItem[] = [{ productCode: "orange", quantity: 1 }];
    expect(calculatePairDiscounts(items, productMap)).toEqual([]);
  });

  it("calculates orange pair discount (x2)", () => {
    const items: OrderItem[] = [{ productCode: "orange", quantity: 2 }];
    const discounts = calculatePairDiscounts(items, productMap);
    // (120 * 2) * 5% = 12
    expect(discounts).toHaveLength(1);
    expect(discounts[0].discountAmount).toBe(12);
    expect(discounts[0].pairsCount).toBe(1);
  });

  it("calculates pink pair discount (x4) — two pairs", () => {
    const items: OrderItem[] = [{ productCode: "pink", quantity: 4 }];
    const discounts = calculatePairDiscounts(items, productMap);
    // 2 pairs: (80 * 2) * 5% * 2 = 16
    expect(discounts).toHaveLength(1);
    expect(discounts[0].discountAmount).toBe(16);
    expect(discounts[0].pairsCount).toBe(2);
  });

  it("calculates green pair discount (x3) — one pair, one leftover", () => {
    const items: OrderItem[] = [{ productCode: "green", quantity: 3 }];
    const discounts = calculatePairDiscounts(items, productMap);
    // 1 pair: (40 * 2) * 5% = 4
    expect(discounts).toHaveLength(1);
    expect(discounts[0].discountAmount).toBe(4);
    expect(discounts[0].pairsCount).toBe(1);
  });

  it("calculates multiple eligible items at once", () => {
    const items: OrderItem[] = [
      { productCode: "orange", quantity: 2 },
      { productCode: "pink", quantity: 2 },
      { productCode: "green", quantity: 2 },
    ];
    const discounts = calculatePairDiscounts(items, productMap);
    expect(discounts).toHaveLength(3);

    const orangeDiscount = discounts.find((d) => d.productCode === "orange");
    const pinkDiscount = discounts.find((d) => d.productCode === "pink");
    const greenDiscount = discounts.find((d) => d.productCode === "green");

    expect(orangeDiscount?.discountAmount).toBe(12); // (120*2)*5%
    expect(pinkDiscount?.discountAmount).toBe(8); // (80*2)*5%
    expect(greenDiscount?.discountAmount).toBe(4); // (40*2)*5%
  });

  it("handles large quantities correctly", () => {
    const items: OrderItem[] = [{ productCode: "orange", quantity: 5 }];
    const discounts = calculatePairDiscounts(items, productMap);
    // 2 pairs from 5 items: (120 * 2) * 5% * 2 = 24
    expect(discounts[0].discountAmount).toBe(24);
    expect(discounts[0].pairsCount).toBe(2);
  });
});

describe("calculateMemberDiscount", () => {
  it("returns 0 when member is not valid", () => {
    expect(calculateMemberDiscount(100, false)).toBe(0);
  });

  it("returns 10% of subtotal when member is valid", () => {
    expect(calculateMemberDiscount(100, true)).toBe(10);
  });

  it("handles decimal amounts correctly", () => {
    expect(calculateMemberDiscount(155, true)).toBe(15.5);
  });

  it("returns 0 for zero subtotal with valid member", () => {
    expect(calculateMemberDiscount(0, true)).toBe(0);
  });
});

describe("calculateTotal (integration)", () => {
  const productMap = makeProductMap();

  it("no discount — single non-eligible item", () => {
    const items: OrderItem[] = [{ productCode: "red", quantity: 1 }];
    const result = calculateTotal(items, productMap, false);
    expect(result.totalBeforeDiscount).toBe(50);
    expect(result.totalItemDiscount).toBe(0);
    expect(result.memberDiscount).toBe(0);
    expect(result.finalTotal).toBe(50);
  });

  it("pair discount only — orange x2", () => {
    const items: OrderItem[] = [{ productCode: "orange", quantity: 2 }];
    const result = calculateTotal(items, productMap, false);
    expect(result.totalBeforeDiscount).toBe(240);
    expect(result.totalItemDiscount).toBe(12);
    expect(result.memberDiscount).toBe(0);
    expect(result.finalTotal).toBe(228);
  });

  it("member discount only — no eligible pairs", () => {
    const items: OrderItem[] = [
      { productCode: "red", quantity: 1 },
      { productCode: "blue", quantity: 1 },
    ];
    const result = calculateTotal(items, productMap, true);
    expect(result.totalBeforeDiscount).toBe(80);
    expect(result.totalItemDiscount).toBe(0);
    expect(result.memberDiscount).toBe(8);
    expect(result.finalTotal).toBe(72);
  });

  it("pair discount + member discount together", () => {
    const items: OrderItem[] = [
      { productCode: "orange", quantity: 2 },
      { productCode: "red", quantity: 1 },
    ];
    const result = calculateTotal(items, productMap, true);
    // subtotal: 240 + 50 = 290
    // pair discount: 12
    // after pair: 278
    // member discount: 278 * 10% = 27.8
    // final: 278 - 27.8 = 250.2
    expect(result.totalBeforeDiscount).toBe(290);
    expect(result.totalItemDiscount).toBe(12);
    expect(result.memberDiscount).toBe(27.8);
    expect(result.finalTotal).toBe(250.2);
  });

  it("multiple pair discounts + member", () => {
    const items: OrderItem[] = [
      { productCode: "orange", quantity: 2 },
      { productCode: "pink", quantity: 4 },
      { productCode: "green", quantity: 3 },
    ];
    const result = calculateTotal(items, productMap, true);
    // subtotal: 240 + 320 + 120 = 680
    // orange pairs: 12, pink pairs: 16, green pairs: 4 => total pair = 32
    // after pair: 648
    // member: 648 * 10% = 64.8
    // final: 648 - 64.8 = 583.2
    expect(result.totalBeforeDiscount).toBe(680);
    expect(result.totalItemDiscount).toBe(32);
    expect(result.memberDiscount).toBe(64.8);
    expect(result.finalTotal).toBe(583.2);
  });

  it("filters out zero-quantity items", () => {
    const items: OrderItem[] = [
      { productCode: "red", quantity: 0 },
      { productCode: "blue", quantity: 2 },
    ];
    const result = calculateTotal(items, productMap, false);
    expect(result.totalBeforeDiscount).toBe(60);
    expect(result.finalTotal).toBe(60);
  });

  it("filters out unknown product codes", () => {
    const items: OrderItem[] = [
      { productCode: "unknown", quantity: 5 },
      { productCode: "red", quantity: 1 },
    ];
    const result = calculateTotal(items, productMap, false);
    expect(result.totalBeforeDiscount).toBe(50);
    expect(result.finalTotal).toBe(50);
  });

  it("empty cart returns zeros", () => {
    const items: OrderItem[] = [];
    const result = calculateTotal(items, productMap, false);
    expect(result.totalBeforeDiscount).toBe(0);
    expect(result.totalItemDiscount).toBe(0);
    expect(result.memberDiscount).toBe(0);
    expect(result.finalTotal).toBe(0);
  });

  it("all items with quantity 0 returns zeros", () => {
    const items: OrderItem[] = [
      { productCode: "red", quantity: 0 },
      { productCode: "green", quantity: 0 },
    ];
    const result = calculateTotal(items, productMap, false);
    expect(result.totalBeforeDiscount).toBe(0);
    expect(result.finalTotal).toBe(0);
  });

  it("large order with all items", () => {
    const items: OrderItem[] = [
      { productCode: "red", quantity: 2 },
      { productCode: "green", quantity: 2 },
      { productCode: "blue", quantity: 2 },
      { productCode: "yellow", quantity: 2 },
      { productCode: "pink", quantity: 2 },
      { productCode: "purple", quantity: 2 },
      { productCode: "orange", quantity: 2 },
    ];
    const result = calculateTotal(items, productMap, true);
    // subtotal: 100+80+60+100+160+180+240 = 920
    // pairs: green(4) + pink(8) + orange(12) = 24
    // after pair: 896
    // member: 89.6
    // final: 806.4
    expect(result.totalBeforeDiscount).toBe(920);
    expect(result.totalItemDiscount).toBe(24);
    expect(result.memberDiscount).toBe(89.6);
    expect(result.finalTotal).toBe(806.4);
  });

  it("success flag is true", () => {
    const items: OrderItem[] = [{ productCode: "red", quantity: 1 }];
    const result = calculateTotal(items, productMap, false);
    expect(result.success).toBe(true);
  });
});

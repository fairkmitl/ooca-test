import type { Product, OrderItem, CalculateResponse } from "@/lib/types";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function calculateOrder(
  items: OrderItem[],
  memberCardNumber?: string
): Promise<CalculateResponse> {
  const res = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, memberCardNumber }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Calculation failed");
  }

  return data;
}

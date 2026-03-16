import { RED_SET_COOLDOWN_MS } from "@/lib/constants";

/**
 * Checks whether a new Red set order is allowed based on the
 * most recent order that contained a Red set.
 */
export function isRedSetAllowed(
  lastRedSetOrderTime: Date | null,
  now: Date = new Date()
): boolean {
  if (!lastRedSetOrderTime) return true;
  const elapsed = now.getTime() - lastRedSetOrderTime.getTime();
  return elapsed >= RED_SET_COOLDOWN_MS;
}

export function hasRedSetInOrder(
  items: { productCode: string; quantity: number }[]
): boolean {
  return items.some((item) => item.productCode === "red" && item.quantity > 0);
}

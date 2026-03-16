import { describe, it, expect } from "vitest";
import {
  isRedSetAllowed,
  hasRedSetInOrder,
} from "@/lib/services/redSetRestriction";

describe("isRedSetAllowed", () => {
  it("allows when no previous Red set order exists", () => {
    expect(isRedSetAllowed(null)).toBe(true);
  });

  it("blocks when last order was less than 1 hour ago", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lastOrder = new Date("2026-01-01T11:30:00Z"); // 30 min ago
    expect(isRedSetAllowed(lastOrder, now)).toBe(false);
  });

  it("allows when last order was exactly 1 hour ago", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lastOrder = new Date("2026-01-01T11:00:00Z"); // exactly 1hr
    expect(isRedSetAllowed(lastOrder, now)).toBe(true);
  });

  it("allows when last order was more than 1 hour ago", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lastOrder = new Date("2026-01-01T10:00:00Z"); // 2hr ago
    expect(isRedSetAllowed(lastOrder, now)).toBe(true);
  });

  it("blocks when last order was 59 minutes 59 seconds ago", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lastOrder = new Date("2026-01-01T11:00:01Z"); // 59m59s ago
    expect(isRedSetAllowed(lastOrder, now)).toBe(false);
  });

  it("blocks when last order was 1 second ago", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lastOrder = new Date("2026-01-01T11:59:59Z");
    expect(isRedSetAllowed(lastOrder, now)).toBe(false);
  });
});

describe("hasRedSetInOrder", () => {
  it("returns false for empty items", () => {
    expect(hasRedSetInOrder([])).toBe(false);
  });

  it("returns false when no red set in order", () => {
    const items = [
      { productCode: "green", quantity: 2 },
      { productCode: "blue", quantity: 1 },
    ];
    expect(hasRedSetInOrder(items)).toBe(false);
  });

  it("returns true when red set is present with quantity > 0", () => {
    const items = [
      { productCode: "red", quantity: 1 },
      { productCode: "blue", quantity: 1 },
    ];
    expect(hasRedSetInOrder(items)).toBe(true);
  });

  it("returns false when red set has quantity 0", () => {
    const items = [
      { productCode: "red", quantity: 0 },
      { productCode: "blue", quantity: 1 },
    ];
    expect(hasRedSetInOrder(items)).toBe(false);
  });

  it("returns true for red set alone", () => {
    const items = [{ productCode: "red", quantity: 3 }];
    expect(hasRedSetInOrder(items)).toBe(true);
  });
});

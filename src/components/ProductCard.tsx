"use client";

import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (productCode: string, quantity: number) => void;
}

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-100",
  green: "bg-green-100",
  blue: "bg-blue-100",
  yellow: "bg-yellow-100",
  pink: "bg-pink-100",
  purple: "bg-purple-100",
  orange: "bg-orange-100",
};

const EMOJI_MAP: Record<string, string> = {
  red: "🔴",
  green: "🟢",
  blue: "🔵",
  yellow: "🟡",
  pink: "🩷",
  purple: "🟣",
  orange: "🟠",
};

export default function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: ProductCardProps) {
  const bgColor = COLOR_MAP[product.code] ?? "bg-gray-100";

  return (
    <div className="product-card">
      <div className="flex items-center gap-3">
        <div className={`product-icon ${bgColor}`}>
          {EMOJI_MAP[product.code]}
        </div>
        <div>
          <div className="product-name">{product.name}</div>
          <div className="product-price">฿{product.price.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantityChange(product.code, Math.max(0, quantity - 1))}
          className="btn-icon-light"
          aria-label={`Decrease ${product.name} quantity`}
        >
          −
        </button>
        <span className="quantity-display">{quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(product.code, quantity + 1)}
          className="btn-icon-dark"
          aria-label={`Increase ${product.name} quantity`}
        >
          +
        </button>
      </div>
    </div>
  );
}

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

export default function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: ProductCardProps) {
  const bgColor = COLOR_MAP[product.code] ?? "bg-gray-100";

  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-14 h-14 rounded-lg ${bgColor} flex items-center justify-center text-2xl`}
        >
          {product.code === "red" && "🔴"}
          {product.code === "green" && "🟢"}
          {product.code === "blue" && "🔵"}
          {product.code === "yellow" && "🟡"}
          {product.code === "pink" && "🩷"}
          {product.code === "purple" && "🟣"}
          {product.code === "orange" && "🟠"}
        </div>
        <div>
          <div className="font-semibold text-gray-800">{product.name}</div>
          <div className="text-sm text-gray-500">฿{product.price.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantityChange(product.code, Math.max(0, quantity - 1))}
          className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 font-bold hover:bg-blue-300 transition-colors flex items-center justify-center"
          aria-label={`Decrease ${product.name} quantity`}
        >
          −
        </button>
        <span className="w-8 text-center font-medium tabular-nums">{quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(product.code, quantity + 1)}
          className="w-8 h-8 rounded-full bg-blue-400 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center"
          aria-label={`Increase ${product.name} quantity`}
        >
          +
        </button>
      </div>
    </div>
  );
}

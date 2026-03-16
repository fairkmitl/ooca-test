"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import MemberCardInput from "@/components/MemberCardInput";
import CalculationSummary from "@/components/CalculationSummary";
import ErrorMessage from "@/components/ErrorMessage";
import type { Product, CalculateResponse } from "@/lib/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [memberCard, setMemberCard] = useState("");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        const initial: Record<string, number> = {};
        for (const p of data) {
          initial[p.code] = 0;
        }
        setQuantities(initial);
      })
      .catch(() => setError("Failed to load products"));
  }, []);

  const handleQuantityChange = useCallback(
    (productCode: string, quantity: number) => {
      setQuantities((prev) => ({ ...prev, [productCode]: quantity }));
    },
    []
  );

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productCode, quantity]) => ({ productCode, quantity }));

    if (items.length === 0) {
      setError("Please add at least one item to your cart.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          memberCardNumber: memberCard.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Calculation failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = () => {
    setResult(null);
    setError(null);
  };

  const hasItems = Object.values(quantities).some((qty) => qty > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Food Store Calculator
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side: Product list and inputs */}
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={quantities[product.code] ?? 0}
                onQuantityChange={handleQuantityChange}
              />
            ))}

            <MemberCardInput value={memberCard} onChange={setMemberCard} />

            <button
              type="button"
              onClick={handleCalculate}
              disabled={loading || !hasItems}
              className="w-full mt-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>

          {/* Right side: Results */}
          <div className="space-y-4">
            {error && <ErrorMessage message={error} />}

            {result && (
              <>
                <CalculationSummary result={result} />
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="w-full py-2.5 bg-blue-400 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors"
                >
                  Recalculate
                </button>
              </>
            )}

            {!result && !error && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Add items and click Calculate to see the summary.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

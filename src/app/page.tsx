"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import MemberCardInput from "@/components/MemberCardInput";
import CalculationSummary from "@/components/CalculationSummary";
import ErrorMessage from "@/components/ErrorMessage";
import { fetchProducts, calculateOrder } from "@/lib/api";
import type { Product, CalculateResponse } from "@/lib/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [memberCard, setMemberCard] = useState("");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
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
      const data = await calculateOrder(
        items,
        memberCard.trim() || undefined
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
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
    <div className="page-container">
      <div className="page-content">
        <h1 className="page-title">Food Store Calculator</h1>

        <div className="page-grid">
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
              className="btn-primary mt-4"
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>

          <div className="space-y-4">
            {error && <ErrorMessage message={error} />}

            {result && (
              <>
                <CalculationSummary result={result} />
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="btn-secondary"
                >
                  Recalculate
                </button>
              </>
            )}

            {!result && !error && (
              <div className="placeholder-text">
                Add items and click Calculate to see the summary.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

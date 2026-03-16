"use client";

import type { CalculateResponse } from "@/lib/types";

interface CalculationSummaryProps {
  result: CalculateResponse;
}

export default function CalculationSummary({ result }: CalculationSummaryProps) {
  return (
    <div className="space-y-4">
      <h2 className="summary-title">Calculation Summary</h2>

      <div className="card">
        <div className="summary-label">Total (before discount)</div>
        <div className="summary-value">
          ฿{result.totalBeforeDiscount.toFixed(2)}
        </div>
      </div>

      {result.itemDiscounts.length > 0 && (
        <div className="card">
          <div className="summary-section-title mb-2">Pair Discounts</div>
          {result.itemDiscounts.map((d) => (
            <div key={d.productCode} className="discount-row">
              <span className="discount-label">
                {d.productName} ({d.pairsCount} {d.pairsCount === 1 ? "pair" : "pairs"})
              </span>
              <span className="discount-amount">
                -฿{d.discountAmount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {result.memberCardValid === true && result.memberDiscount > 0 && (
        <div className="card">
          <div className="summary-section-title">Member Discount (10%)</div>
          <div className="discount-amount-bold">
            -฿{result.memberDiscount.toFixed(2)}
          </div>
        </div>
      )}

      {result.memberCardValid === false && (
        <div className="alert-warning">
          <div className="text-sm text-yellow-700">
            Member card is invalid or inactive. No member discount applied.
          </div>
        </div>
      )}

      <div className="card-highlight">
        <div className="summary-label">Final Total</div>
        <div className="summary-final-value">
          ฿{result.finalTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

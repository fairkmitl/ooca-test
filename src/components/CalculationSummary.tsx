"use client";

import type { CalculateResponse } from "@/lib/types";

interface CalculationSummaryProps {
  result: CalculateResponse;
}

export default function CalculationSummary({ result }: CalculationSummaryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center text-gray-800">
        Calculation Summary
      </h2>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-sm text-gray-500">Total (before discount)</div>
        <div className="text-lg font-bold text-gray-800">
          ฿{result.totalBeforeDiscount.toFixed(2)}
        </div>
      </div>

      {result.itemDiscounts.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Pair Discounts
          </div>
          {result.itemDiscounts.map((d) => (
            <div key={d.productCode} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">
                {d.productName} ({d.pairsCount} {d.pairsCount === 1 ? "pair" : "pairs"})
              </span>
              <span className="text-red-500 font-medium">
                -฿{d.discountAmount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {result.memberCardValid === true && result.memberDiscount > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-700">
            Member Discount (10%)
          </div>
          <div className="text-red-500 font-bold">
            -฿{result.memberDiscount.toFixed(2)}
          </div>
        </div>
      )}

      {result.memberCardValid === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-sm text-yellow-700">
            Member card is invalid or inactive. No member discount applied.
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-200">
        <div className="text-sm text-gray-500">Final Total</div>
        <div className="text-2xl font-bold text-gray-800">
          ฿{result.finalTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

import type { CalculatedPrice } from "./types";
import { getProductsByIds } from "../infrastructure/database";

export function calculateNewPrice(
  basedOnPrice: number,
  adjustment: number,
  mode: "fixed" | "dynamic",
  direction: "increase" | "decrease",
): number {
  let result: number;
  if (mode === "fixed") {
    result =
      direction === "increase"
        ? basedOnPrice + adjustment
        : basedOnPrice - adjustment;
  } else {
    const delta = (adjustment / 100) * basedOnPrice;
    result =
      direction === "increase" ? basedOnPrice + delta : basedOnPrice - delta;
  }
  return Math.max(0, Math.round(result * 100) / 100);
}

export function calculatePrices(params: {
  productIds: string[];
  adjustmentMode: "fixed" | "dynamic";
  incrementMode: "increase" | "decrease";
  adjustments: Record<string, number>;
}): CalculatedPrice[] {
  const products = getProductsByIds(params.productIds);

  return products.map((product) => {
    const adjustment = params.adjustments[product.id] ?? 0;
    const basedOnPrice = product.globalWholesalePrice;
    return {
      productId: product.id,
      basedOnPrice,
      adjustment,
      newPrice: calculateNewPrice(
        basedOnPrice,
        adjustment,
        params.adjustmentMode,
        params.incrementMode,
      ),
    };
  });
}

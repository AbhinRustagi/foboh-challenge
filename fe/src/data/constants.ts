export type Product = {
  id: string;
  title: string;
  skuCode: string;
  brand: string;
  categoryId: string;
  subCategoryId: string;
  segmentId: string;
  globalWholesalePrice: number;
};

export type PricingProfile = {
  id: string;
  name: string;
};

export type AdjustmentMode = "fixed" | "dynamic";
export type IncrementMode = "increase" | "decrease";
export type ProductSelectionType = "one" | "multiple" | "all";

export const SUB_CATEGORIES = [
  "Wine",
  "Beer",
  "Liquor & Spirits",
  "Cider",
  "Premixed & Ready-to-Drink",
  "Other",
] as const;

export const SEGMENTS = [
  "Red",
  "White",
  "Rose",
  "Orange",
  "Sparkling",
  "Port/Dessert",
] as const;

export const BRANDS = [
  "High Garden",
  "Koyama Wines",
  "Lacourte-Godbillon",
] as const;

export const BASED_ON_PROFILES: PricingProfile[] = [
  { id: "global", name: "Global Wholesale Price" },
];

export type CalculatedPrice = {
  productId: string;
  basedOnPrice: number;
  adjustment: number;
  newPrice: number;
};

export type CalculatePricesRequest = {
  productIds: string[];
  adjustmentMode: AdjustmentMode;
  incrementMode: IncrementMode;
  adjustments: Record<string, number>;
};

export type Customer = {
  id: string;
  name: string;
  business: string;
};

export const SAMPLE_CUSTOMERS: Customer[] = [
  { id: "c1", name: "James Wilson", business: "Wilson's Wine Bar" },
  { id: "c2", name: "Sarah Chen", business: "The Barrel Room" },
  { id: "c3", name: "Marcus Thompson", business: "Riverside Bottleshop" },
  { id: "c4", name: "Emily Rodriguez", business: "Craft & Cork" },
  { id: "c5", name: "David Park", business: "Park Avenue Cellars" },
  { id: "c6", name: "Lisa Nguyen", business: "Nguyen's Fine Wines" },
  { id: "c7", name: "Tom Bradley", business: "Bradley's Pub & Grill" },
  { id: "c8", name: "Anna Kowalski", business: "The Wine Collective" },
];

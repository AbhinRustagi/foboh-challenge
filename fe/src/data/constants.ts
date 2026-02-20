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

import { z } from "zod";

// ── DB entity types (stored in db.json) ──

export type Category = {
  id: string;
  name: string;
};

export type SubCategory = {
  id: string;
  name: string;
  categoryId: string;
};

export type Segment = {
  id: string;
  name: string;
};

export type Brand = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  title: string;
  skuCode: string;
  brandId: string;
  categoryId: string;
  subCategoryId: string;
  segmentId: string;
  globalWholesalePrice: number;
};

export type Customer = {
  id: string;
  name: string;
  business: string;
};

export type PricingProfile = {
  id: string;
  name: string;
  basedOn: string;
  adjustmentMode: "fixed" | "dynamic";
  incrementMode: "increase" | "decrease";
  adjustments: Record<string, number>;
  customerIds: string[];
};

// ── Denormalized product (what the API returns) ──

export type ProductResponse = {
  id: string;
  title: string;
  skuCode: string;
  brand: string;
  categoryId: string;
  subCategoryId: string;
  segmentId: string;
  globalWholesalePrice: number;
};

// ── DB shape ──

export type Database = {
  categories: Category[];
  subCategories: SubCategory[];
  segments: Segment[];
  brands: Brand[];
  products: Product[];
  customers: Customer[];
  pricingProfiles: PricingProfile[];
};

// ── Request validation ──

export const CreatePricingProfileSchema = z.object({
  selectionType: z.enum(["one", "multiple", "all"]),
  selectedProductIds: z.array(z.string()).min(1),
  basedOn: z.string().min(1),
  adjustmentMode: z.enum(["fixed", "dynamic"]),
  incrementMode: z.enum(["increase", "decrease"]),
  adjustments: z.record(z.string(), z.number().min(0)),
  selectedCustomerIds: z.array(z.string()).min(1),
});

export type CreatePricingProfileRequest = z.infer<
  typeof CreatePricingProfileSchema
>;

export const CalculatePricesSchema = z.object({
  productIds: z.array(z.string()).min(1),
  adjustmentMode: z.enum(["fixed", "dynamic"]),
  incrementMode: z.enum(["increase", "decrease"]),
  adjustments: z.record(z.string(), z.number().min(0)),
});

export type CalculatePricesRequest = z.infer<typeof CalculatePricesSchema>;

export type CalculatedPrice = {
  productId: string;
  basedOnPrice: number;
  adjustment: number;
  newPrice: number;
};

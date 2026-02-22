import fs from "node:fs";
import path from "node:path";
import type {
  Database,
  ProductResponse,
  Customer,
  PricingProfile,
} from "../domain/types";

const DB_PATH = path.join(__dirname, "db.json");

let db: Database = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

function persist(): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── Lookups ──

function brandName(id: string): string {
  return db.brands.find((b) => b.id === id)?.name ?? id;
}

function subCategoryName(id: string): string {
  return db.subCategories.find((s) => s.id === id)?.name ?? id;
}

function segmentName(id: string): string {
  return db.segments.find((s) => s.id === id)?.name ?? id;
}

function categoryName(id: string): string {
  return db.categories.find((c) => c.id === id)?.name ?? id;
}

// ── Public accessors ──

export function getProducts(): ProductResponse[] {
  return db.products.map((p) => ({
    id: p.id,
    title: p.title,
    skuCode: p.skuCode,
    brand: brandName(p.brandId),
    categoryId: categoryName(p.categoryId),
    subCategoryId: subCategoryName(p.subCategoryId),
    segmentId: segmentName(p.segmentId),
    globalWholesalePrice: p.globalWholesalePrice,
  }));
}

export function getCustomers(): Customer[] {
  return db.customers;
}

export function getBrands(): string[] {
  return db.brands.map((b) => b.name);
}

export function getSegments(): string[] {
  return db.segments.map((s) => s.name);
}

export function getSubCategories(): string[] {
  return db.subCategories.map((s) => s.name);
}

export function getProductsByIds(ids: string[]): ProductResponse[] {
  const idSet = new Set(ids);
  return db.products
    .filter((p) => idSet.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      skuCode: p.skuCode,
      brand: brandName(p.brandId),
      categoryId: categoryName(p.categoryId),
      subCategoryId: subCategoryName(p.subCategoryId),
      segmentId: segmentName(p.segmentId),
      globalWholesalePrice: p.globalWholesalePrice,
    }));
}

export function getPricingProfiles(): PricingProfile[] {
  return db.pricingProfiles;
}

export function createPricingProfile(
  profile: Omit<PricingProfile, "id">,
): PricingProfile {
  const id = `pp-${Date.now()}`;
  const newProfile: PricingProfile = { id, ...profile };
  db.pricingProfiles.push(newProfile);
  persist();
  return newProfile;
}

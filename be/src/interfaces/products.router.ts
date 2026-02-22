import { Router } from "express";
import Fuse from "fuse.js";
import { getProducts } from "../infrastructure/database";
import { CalculatePricesSchema } from "../domain/types";
import { calculatePrices } from "../domain/calculate-prices";

const router = Router();

router.get("/products", (_req, res) => {
  const { search, sku, category, segment, brand } = _req.query;
  let results = getProducts();

  // Fuzzy search on title and skuCode
  if (search && typeof search === "string") {
    const fuse = new Fuse(results, {
      keys: ["title", "skuCode"],
      threshold: 0.4,
    });
    results = fuse.search(search).map((r) => r.item);
  }

  // Exact filters
  if (sku && typeof sku === "string") {
    const lower = sku.toLowerCase();
    results = results.filter(
      (p) =>
        p.skuCode.toLowerCase().includes(lower) ||
        p.title.toLowerCase().includes(lower),
    );
  }

  if (category && typeof category === "string") {
    results = results.filter((p) => p.subCategoryId === category);
  }

  if (segment && typeof segment === "string") {
    results = results.filter((p) => p.segmentId === segment);
  }

  if (brand && typeof brand === "string") {
    results = results.filter((p) => p.brand === brand);
  }

  res.json(results);
});

router.post("/products/calculate-prices", (req, res) => {
  const parsed = CalculatePricesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  res.json(calculatePrices(parsed.data));
});

export default router;

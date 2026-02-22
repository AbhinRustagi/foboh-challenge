import { Router } from "express";
import { CreatePricingProfileSchema } from "../domain/types";
import {
  createPricingProfile,
  getPricingProfiles,
} from "../infrastructure/database";

const router = Router();

router.get("/pricing-profiles", (_req, res) => {
  res.json(getPricingProfiles());
});

router.post("/pricing-profiles", async (req, res) => {
  const parsed = CreatePricingProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { selectedProductIds, selectedCustomerIds, ...rest } = parsed.data;

  const profile = createPricingProfile({
    name: `Profile ${Date.now()}`,
    basedOn: rest.basedOn,
    adjustmentMode: rest.adjustmentMode,
    incrementMode: rest.incrementMode,
    adjustments: rest.adjustments,
    customerIds: selectedCustomerIds,
  });

  res.status(201).json(profile);
});

export default router;

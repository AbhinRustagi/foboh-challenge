import { Router } from "express";
import { getBrands } from "../infrastructure/database";

const router = Router();

router.get("/brands", (_req, res) => {
  res.json(getBrands());
});

export default router;

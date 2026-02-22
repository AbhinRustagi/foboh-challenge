import { Router } from "express";
import { getSegments } from "../infrastructure/database";

const router = Router();

router.get("/segments", (_req, res) => {
  res.json(getSegments());
});

export default router;

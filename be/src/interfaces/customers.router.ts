import { Router } from "express";
import { getCustomers } from "../infrastructure/database";

const router = Router();

router.get("/customers", (_req, res) => {
  const { search } = _req.query;
  let results = getCustomers();

  if (search && typeof search === "string") {
    const lower = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.business.toLowerCase().includes(lower),
    );
  }

  res.json(results);
});

export default router;

import cors from "cors";
import express from "express";
import brandsRouter from "./interfaces/brands.router";
import customersRouter from "./interfaces/customers.router";
import pricingProfilesRouter from "./interfaces/pricing-profiles.router";
import productsRouter from "./interfaces/products.router";
import segmentsRouter from "./interfaces/segments.router";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use(productsRouter);
app.use(customersRouter);
app.use(brandsRouter);
app.use(segmentsRouter);
app.use(pricingProfilesRouter);

app.get("/", (req, res) => res.status(200).json({ success: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import brandsRouter from "./interfaces/brands.router";
import customersRouter from "./interfaces/customers.router";
import pricingProfilesRouter from "./interfaces/pricing-profiles.router";
import productsRouter from "./interfaces/products.router";
import segmentsRouter from "./interfaces/segments.router";

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(productsRouter);
app.use(customersRouter);
app.use(brandsRouter);
app.use(segmentsRouter);
app.use(pricingProfilesRouter);

app.get("/", (req, res) => res.status(200).json({ success: true }));

export { app };

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

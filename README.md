# FOBOH Pricing Profile Challenge

A full-stack TypeScript application for managing wine/beverage pricing profiles. Users configure pricing rules, select products, assign customers, and review before submitting.

## Backend

**Stack:** Express 5, TypeScript, Zod, Fuse.js
**Hosting:** Railway

### Architecture

The backend follows clean/layered architecture with three layers:

- **Domain** (`domain/types.ts`) — Entity types (`Product`, `Customer`, `PricingProfile`, etc.) and Zod schemas for request validation. No framework dependencies.
- **Infrastructure** (`infrastructure/database.ts`) — Data access layer built as an adapter over a JSON file. Reads `db.json` into memory on startup and persists mutations back to disk. Exposes only typed read/write functions, so swapping to a real database would only require replacing this file.
- **Interfaces** (`interfaces/*.router.ts`) — Express routers, one per resource. Thin layer that calls into infrastructure and returns responses.

### Database

Instead of a real database, data lives in a JSON file (`db.json`). An in-memory adapter sits on top of it, providing:

- Typed read functions with denormalization (e.g., products are returned with brand names resolved from IDs)
- Fuzzy search via Fuse.js (threshold 0.4, searching across title, SKU, category, segment, brand)
- Write functions that validate with Zod, then persist the updated state back to the JSON file

### Security

Basic security measures via middleware:

- Helmet for security headers
- CORS with an explicit origin allowlist (configured via `ALLOWED_ORIGINS` env var)
- Rate limiting (100 requests per 60 seconds)
- Request body size limit (1MB)
- Zod validation on all POST request bodies

## Frontend

**Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn, React Query, React Hook Form
**Hosting:** Vercel

### Structure

Single page application matching the spec. The main component (`pricing-setup.tsx`) is a multi-step wizard:

1. Basic pricing profile configuration
2. Product selection with search, filters, and price adjustment preview
3. Customer assignment
4. Review and submit

- **UI**: Built with shadcn components.
- **Data Fetching**: React Query manages server state. Search inputs are debounced (300ms) before triggering API calls.
- **Form state & Validation**: Managed by React Hook Form with Zod schema validation.
- **Price Calculations**: Performed server-side via `POST /products/calculate-prices`. The frontend sends product IDs, adjustment mode/direction, and per-product adjustment values; the backend resolves base prices, applies the formula, and returns calculated results. The "Refresh New Price Table" button triggers this call.

## Expansion Considerations

The frontend communicates directly with the backend. In a larger application, I'd introduce a BFF (Backend for Frontend) layer between them for Nextjs. A BFF handles response transformation, aggregation across services, and keeps the frontend decoupled from backend domain models.

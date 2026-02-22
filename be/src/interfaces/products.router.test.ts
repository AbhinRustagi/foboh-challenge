import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";

describe("GET /products", () => {
  it("returns all products", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(5);
  });

  it("filters by brand", async () => {
    const res = await request(app).get("/products?brand=High Garden");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].brand).toBe("High Garden");
  });

  it("fuzzy searches by title", async () => {
    const res = await request(app).get("/products?search=Pinot");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toContain("Pinot");
  });

  it("returns empty for non-matching filter", async () => {
    const res = await request(app).get("/products?brand=NonExistent");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /products/calculate-prices", () => {
  it("calculates fixed decrease prices", async () => {
    const res = await request(app)
      .post("/products/calculate-prices")
      .send({
        productIds: ["1"],
        adjustmentMode: "fixed",
        incrementMode: "decrease",
        adjustments: { "1": 5 },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual({
      productId: "1",
      basedOnPrice: 279.06,
      adjustment: 5,
      newPrice: 274.06,
    });
  });

  it("calculates dynamic increase prices", async () => {
    const res = await request(app)
      .post("/products/calculate-prices")
      .send({
        productIds: ["2"],
        adjustmentMode: "dynamic",
        incrementMode: "increase",
        adjustments: { "2": 10 },
      });

    expect(res.status).toBe(200);
    expect(res.body[0].newPrice).toBe(132);
  });

  it("handles multiple products", async () => {
    const res = await request(app)
      .post("/products/calculate-prices")
      .send({
        productIds: ["1", "2", "5"],
        adjustmentMode: "fixed",
        incrementMode: "decrease",
        adjustments: { "1": 10, "2": 10, "5": 10 },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it("rejects empty productIds", async () => {
    const res = await request(app)
      .post("/products/calculate-prices")
      .send({
        productIds: [],
        adjustmentMode: "fixed",
        incrementMode: "decrease",
        adjustments: {},
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

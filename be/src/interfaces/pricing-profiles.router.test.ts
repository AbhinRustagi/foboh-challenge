import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";

describe("GET /pricing-profiles", () => {
  it("returns an array of profiles", async () => {
    const res = await request(app).get("/pricing-profiles");
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});

describe("POST /pricing-profiles", () => {
  it("creates a pricing profile and returns 201", async () => {
    const res = await request(app)
      .post("/pricing-profiles")
      .send({
        selectionType: "multiple",
        selectedProductIds: ["1", "2"],
        basedOn: "global",
        adjustmentMode: "fixed",
        incrementMode: "decrease",
        adjustments: { "1": 5, "2": 10 },
        selectedCustomerIds: ["c1", "c2"],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.basedOn).toBe("global");
    expect(res.body.customerIds).toEqual(["c1", "c2"]);
  });

  it("rejects missing required fields", async () => {
    const res = await request(app).post("/pricing-profiles").send({
      basedOn: "global",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("rejects empty selectedProductIds", async () => {
    const res = await request(app)
      .post("/pricing-profiles")
      .send({
        selectionType: "multiple",
        selectedProductIds: [],
        basedOn: "global",
        adjustmentMode: "fixed",
        incrementMode: "decrease",
        adjustments: {},
        selectedCustomerIds: ["c1"],
      });

    expect(res.status).toBe(400);
  });
});

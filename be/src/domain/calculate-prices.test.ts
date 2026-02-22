import { describe, it, expect } from "vitest";
import { calculateNewPrice } from "./calculate-prices";

describe("calculateNewPrice", () => {
  it("fixed increase adds to base price", () => {
    expect(calculateNewPrice(500, 20, "fixed", "increase")).toBe(520);
  });

  it("fixed decrease subtracts from base price", () => {
    expect(calculateNewPrice(279.06, 5, "fixed", "decrease")).toBe(274.06);
  });

  it("dynamic increase adds percentage", () => {
    expect(calculateNewPrice(500, 20, "dynamic", "increase")).toBe(600);
  });

  it("dynamic decrease subtracts percentage", () => {
    expect(calculateNewPrice(45, 10, "dynamic", "decrease")).toBe(40.5);
  });

  it("clamps to 0 when result would be negative", () => {
    expect(calculateNewPrice(10, 50, "fixed", "decrease")).toBe(0);
    expect(calculateNewPrice(100, 150, "dynamic", "decrease")).toBe(0);
  });
});

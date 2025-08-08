import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";

describe("Exponentiation Operator (**)", () => {
  it("should transpile basic exponentiation", async () => {
    const input = `
      const base = 2;
      const exponent = 3;
      const result = base ** exponent;
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should generate std::pow with cmath include
    assertEquals(result.header.includes("#include <cmath>"), true);
    assertEquals(result.source.includes("std::pow(base.value(), exponent.value())"), true);
  });

  it("should handle exponentiation with literals", async () => {
    const input = `
      const result = 3 ** 4;
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should use std::pow for literal exponentiation
    assertEquals(result.source.includes("std::pow"), true);
    assertEquals(result.header.includes("#include <cmath>"), true);
  });

  it("should handle nested exponentiation", async () => {
    const input = `
      const result = 2 ** (3 ** 2);
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should handle nested expressions correctly
    assertEquals(result.source.includes("std::pow"), true);
    assertEquals(result.header.includes("#include <cmath>"), true);
  });

  it("should handle decimal exponents", async () => {
    const input = `
      const sqrt = 4 ** 0.5;
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should work with decimal exponents (square root)
    assertEquals(result.source.includes("std::pow"), true);
    assertEquals(result.source.includes("0.5"), true);
  });

  it("should handle negative exponents", async () => {
    const input = `
      const reciprocal = 2 ** -1;
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should handle negative exponents (reciprocal)
    assertEquals(result.source.includes("std::pow"), true);
  });

  it("should handle exponentiation in expressions", async () => {
    const input = `
      const a = 2;
      const b = 3;
      const complex = a ** b + b ** a;
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should handle multiple exponentiations in one expression
    const powCount = (result.source.match(/std::pow/g) || []).length;
    assertEquals(powCount >= 2, true);
  });
});

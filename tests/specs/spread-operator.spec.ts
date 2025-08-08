import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";

describe("Spread Operator (...)", () => {
  it("should transpile array spread in array literals", async () => {
    const input = `
      const arr1: any = [1, 2];
      const arr2: any = [3, 4];
      const combined = [...arr1, ...arr2];
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should generate concat calls for spread elements
    assertEquals(result.source.includes("concat(arr1).concat(arr2)"), true);
  });

  it("should transpile mixed literals and spread elements", async () => {
    const input = `
      const arr: any = [1, 2];
      const mixed = [0, ...arr, 999];
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should chain concat calls properly
    assertEquals(result.source.includes("concat(js::array<js::any>{js::number(0)})"), true);
    assertEquals(result.source.includes("concat(arr)"), true);
    assertEquals(result.source.includes("concat(js::array<js::any>{js::number(999)})"), true);
  });

  it("should handle empty arrays in spread", async () => {
    const input = `
      const empty: any = [];
      const result = [...empty, 1, 2];
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Empty arrays should have explicit type
    assertEquals(result.source.includes("js::array<js::any>{}"), true);
    assertEquals(result.source.includes("concat(empty)"), true);
  });

  it("should handle nested spread operations", async () => {
    const input = `
      const arr1: any = [1];
      const nested = [...[...arr1, 2], 3];
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should handle nested spread correctly
    assertEquals(result.source.includes("concat("), true);
  });

  it("should handle single element arrays", async () => {
    const input = `
      const single: any = [42];
      const result = [...single, ...single];
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should repeat the same array multiple times
    assertEquals(result.source.includes("concat(single).concat(single)"), true);
  });

  // Note: Function call spread arguments are not yet fully implemented
  // These tests are commented out until that feature is complete
  /*
  it("should transpile spread in function calls", async () => {
    const input = `
      const args = [1, 2, 3];
      func(...args);
    `;

    const result = await transpile(input, { generateHeader: false });
    // Implementation pending...
  });
  */
});

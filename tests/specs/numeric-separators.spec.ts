import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";

describe("Numeric Separators", () => {
  it("should transpile integer with separators", async () => {
    const input = `
      const million = 1_000_000;
      console.log(million);
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should parse as regular number 1000000
    assertEquals(result.source.includes("1000000"), true);
  });

  it("should transpile decimal with separators", async () => {
    const input = `
      const pi = 3.141_592_653;
      console.log(pi);
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should parse as regular decimal 3.141592653
    assertEquals(result.source.includes("3.141592653"), true);
  });

  it("should handle binary literals with separators", async () => {
    const input = `
      const binary = 0b1010_0001;
      console.log(binary);
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should convert binary to decimal (0b10100001 = 161)
    assertEquals(result.source.includes("161"), true);
  });

  it("should handle hex literals with separators", async () => {
    const input = `
      const hex = 0xFF_EC;
      console.log(hex);
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // Should convert hex to decimal (0xFFEC = 65516)
    assertEquals(result.source.includes("65516"), true);
  });

  it("should handle multiple numeric separators in one file", async () => {
    const input = `
      const a = 1_000;
      const b = 2_000_000;
      const c = 3.14_159;
      const sum = a + b + c;
    `;

    const result = await transpile(input, {
      outputName: "test",
      standard: "c++20",
    });

    // All numbers should be parsed correctly
    assertEquals(result.source.includes("1000"), true);
    assertEquals(result.source.includes("2000000"), true);
    assertEquals(result.source.includes("3.14159"), true);
  });
});

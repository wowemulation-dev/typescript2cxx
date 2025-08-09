import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

Deno.test("Standard Objects: Error subclasses", async () => {
  const code = `
    const evalErr = new EvalError("Eval failed");
    console.log(evalErr.toString());
    
    const uriErr = new URIError("Invalid URI");
    console.log(uriErr.toString());
    
    const aggErr = new AggregateError([], "Multiple errors");
    console.log(aggErr.toString());
  `;

  const result = await transpile(code);

  assertEquals(result.warnings.filter((w) => w.severity === "error").length, 0);
  assertEquals(result.source?.includes("js::EvalError"), true);
  assertEquals(result.source?.includes("js::URIError"), true);
  assertEquals(result.source?.includes("js::AggregateError"), true);
});

Deno.test("Standard Objects: URL encoding functions", async () => {
  const code = `
    const uri = "https://example.com/path?query=hello world";
    const encoded = encodeURI(uri);
    console.log(encoded);
    
    const decoded = decodeURI(encoded);
    console.log(decoded);
    
    const component = "hello world?&=";
    const encodedComp = encodeURIComponent(component);
    console.log(encodedComp);
    
    const decodedComp = decodeURIComponent(encodedComp);
    console.log(decodedComp);
  `;

  const result = await transpile(code);

  assertEquals(result.warnings.filter((w) => w.severity === "error").length, 0);
  assertEquals(result.source?.includes("js::encodeURI"), true);
  assertEquals(result.source?.includes("js::decodeURI"), true);
  assertEquals(result.source?.includes("js::encodeURIComponent"), true);
  assertEquals(result.source?.includes("js::decodeURIComponent"), true);
});

Deno.test("Standard Objects: Promise.all", async () => {
  const code = `
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3)
    ];
    
    Promise.all(promises).then((results) => {
      console.log(results);
    });
  `;

  const result = await transpile(code);

  assertEquals(result.warnings.filter((w) => w.severity === "error").length, 0);
  assertEquals(result.source?.includes("js::Promise::all"), true);
});

Deno.test("Standard Objects: Promise.race", async () => {
  const code = `
    const promises = [
      new Promise((resolve) => setTimeout(() => resolve("first"), 100)),
      new Promise((resolve) => setTimeout(() => resolve("second"), 200))
    ];
    
    Promise.race(promises).then((result) => {
      console.log(result);
    });
  `;

  const result = await transpile(code);

  assertEquals(result.warnings.filter((w) => w.severity === "error").length, 0);
  assertEquals(result.source?.includes("js::Promise::race"), true);
});

Deno.test("Standard Objects: Error with smart pointer handling", async () => {
  const code = `
    try {
      throw new Error("Something went wrong");
    } catch (error) {
      console.log(error.message);
      console.log(error.toString());
    }
  `;

  const result = await transpile(code);

  assertEquals(result.warnings.filter((w) => w.severity === "error").length, 0);

  // The caught error should not be wrapped in smart pointer syntax
  assertEquals(result.source?.includes("std::shared_ptr<js::any> error"), false);
  // It should be a regular js::any
  assertEquals(result.source?.includes("js::any error"), true);
});

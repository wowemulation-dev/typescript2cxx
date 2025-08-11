import { transpile } from "./src/mod.ts";

// Simple test to verify the transpiler still works
const result = await transpile(`
  class TestClass {
    value: number = 42;
    
    display(): void {
      console.log(this.value);
    }
  }
  
  const test = new TestClass();
  test.display();
`);

console.log("✅ Transpilation successful!");
console.log("\n📄 Generated header:");
console.log(result.header.substring(0, 200) + "...");
console.log("\n📄 Generated source:");
console.log(result.source.substring(0, 200) + "...");
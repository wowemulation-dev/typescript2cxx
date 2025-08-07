import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/transpiler.ts";

describe("String Type Transpilation", () => {
    const testOutputDir = "./test-output";

    async function testTranspilation(code: string) {
        const filename = "test_" + Math.random().toString(36).substring(7);
        const inputFile = `${testOutputDir}/${filename}.ts`;
        const outputDir = `${testOutputDir}/${filename}`;

        await Deno.mkdir(testOutputDir, { recursive: true });
        await Deno.writeTextFile(inputFile, code);

        const result = await transpile(inputFile, {
            outputDir,
            runtime: "embedded",
            targetCppStandard: "c++20",
        });

        await Deno.remove(inputFile);
        await Deno.remove(outputDir, { recursive: true });

        return result;
    }

    it("should handle string concatenation", async () => {
        const result = await testTranspilation(`
            const greeting = "Hello";
            const name = "World";
            const message = greeting + ", " + name + "!";
            console.log(message);
        `);
        assertEquals(result.success, true);
    });

    it("should handle string methods", async () => {
        const result = await testTranspilation(`
            const str = "Hello World";
            console.log(str.length);
            console.log(str.toUpperCase());
            console.log(str.toLowerCase());
            console.log(str.charAt(0));
            console.log(str.indexOf("World"));
            console.log(str.substring(0, 5));
            console.log(str.slice(6));
        `);
        assertEquals(result.success, true);
    });

    it("should handle string trim methods", async () => {
        const result = await testTranspilation(`
            const str = "  Hello World  ";
            console.log(str.trim());
            console.log(str.trimStart());
            console.log(str.trimEnd());
        `);
        assertEquals(result.success, true);
    });

    it("should handle string split and join", async () => {
        const result = await testTranspilation(`
            const str = "apple,banana,orange";
            const fruits = str.split(",");
            console.log(fruits[0]);
            console.log(fruits.join(" - "));
        `);
        assertEquals(result.success, true);
    });

    it("should handle string replace", async () => {
        const result = await testTranspilation(`
            const str = "Hello World";
            const newStr = str.replace("World", "TypeScript");
            console.log(newStr);
        `);
        assertEquals(result.success, true);
    });

    it("should handle template literals", async () => {
        const result = await testTranspilation(`
            const name = "Alice";
            const age = 30;
            const message = \`Hello, my name is \${name} and I am \${age} years old.\`;
            console.log(message);
        `);
        assertEquals(result.success, true);
    });

    it("should handle string comparisons", async () => {
        const result = await testTranspilation(`
            const str1 = "apple";
            const str2 = "banana";
            console.log(str1 < str2);
            console.log(str1 > str2);
            console.log(str1 === "apple");
            console.log(str1 !== str2);
        `);
        assertEquals(result.success, true);
    });

    it("should handle string includes, startsWith, endsWith", async () => {
        const result = await testTranspilation(`
            const str = "Hello World";
            console.log(str.includes("World"));
            console.log(str.startsWith("Hello"));
            console.log(str.endsWith("World"));
        `);
        assertEquals(result.success, true);
    });

    it("should handle string repeat and padStart/padEnd", async () => {
        const result = await testTranspilation(`
            const str = "Hi";
            console.log(str.repeat(3));
            console.log(str.padStart(5, "*"));
            console.log(str.padEnd(5, "-"));
        `);
        assertEquals(result.success, true);
    });
});
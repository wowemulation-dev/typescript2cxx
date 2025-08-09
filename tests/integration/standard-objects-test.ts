// Test for Standard Objects implementation

// Test 1: Error subclasses
function testErrorSubclasses(): void {
    console.log("Testing Error subclasses...");
    
    // Test EvalError
    const evalErr = new EvalError("Eval failed");
    console.log(evalErr.toString());
    console.log(evalErr.getName());
    console.log(evalErr.getMessage());
    
    // Test URIError
    const uriErr = new URIError("Invalid URI");
    console.log(uriErr.toString());
    console.log(uriErr.getName());
    console.log(uriErr.getMessage());
    
    // Test AggregateError (simplified - no actual error array access for now)
    const aggErr = new AggregateError([], "Multiple errors");
    console.log(aggErr.toString());
    console.log(aggErr.getName());
    console.log(aggErr.getMessage());
}

// Test 2: URL encoding/decoding functions
function testURLEncoding(): void {
    console.log("Testing URL encoding/decoding...");
    
    // Test encodeURI - preserves reserved characters
    const uri = "https://example.com/path?query=hello world&foo=bar";
    const encodedURI = encodeURI(uri);
    console.log("Original URI:", uri);
    console.log("Encoded URI:", encodedURI);
    
    // Test decodeURI
    const decodedURI = decodeURI(encodedURI);
    console.log("Decoded URI:", decodedURI);
    
    // Test encodeURIComponent - encodes reserved characters
    const component = "hello world?&=";
    const encodedComponent = encodeURIComponent(component);
    console.log("Original component:", component);
    console.log("Encoded component:", encodedComponent);
    
    // Test decodeURIComponent
    const decodedComponent = decodeURIComponent(encodedComponent);
    console.log("Decoded component:", decodedComponent);
    
    // Test special characters
    const special = "!@#$%^&*()+=[]{}|;:',.<>?/`~";
    const encodedSpecial = encodeURIComponent(special);
    console.log("Special chars encoded:", encodedSpecial);
    const decodedSpecial = decodeURIComponent(encodedSpecial);
    console.log("Special chars decoded:", decodedSpecial);
}

// Test 3: Promise.all and Promise.race (already implemented in async.h)
async function testPromiseStaticMethods(): Promise<void> {
    console.log("Testing Promise static methods...");
    
    // Test Promise.all
    const p1 = Promise.resolve(1);
    const p2 = Promise.resolve(2);
    const p3 = Promise.resolve(3);
    
    const allResults = await Promise.all([p1, p2, p3]);
    console.log("Promise.all results:", allResults);
    
    // Test Promise.race
    const fast = new Promise((resolve) => {
        setTimeout(() => resolve("fast"), 100);
    });
    const slow = new Promise((resolve) => {
        setTimeout(() => resolve("slow"), 200);
    });
    
    const raceResult = await Promise.race([fast, slow]);
    console.log("Promise.race winner:", raceResult);
}

// Test 4: Integration test
function testIntegration(): void {
    console.log("Testing Standard Objects integration...");
    
    // Combine error handling with URL encoding
    try {
        const badURI = "http://example.com/%%%";
        const encoded = encodeURI(badURI);
        console.log("Encoded bad URI:", encoded);
        
        // Simulate error
        throw new URIError("Invalid percent encoding");
    } catch (error: any) {
        if (error instanceof URIError) {
            console.log("Caught URIError:", error.toString());
        }
    }
    
    // Test with actual URL patterns
    const apiUrl = "https://api.example.com/users";
    const searchParams = "name=John Doe&age=30";
    const fullUrl = apiUrl + "?" + encodeURIComponent(searchParams);
    console.log("Full API URL:", fullUrl);
}

// Main test runner
async function main(): Promise<void> {
    console.log("=== Standard Objects Test Suite ===");
    
    testErrorSubclasses();
    console.log();
    
    testURLEncoding();
    console.log();
    
    await testPromiseStaticMethods();
    console.log();
    
    testIntegration();
    console.log();
    
    console.log("=== All Standard Objects tests completed ===");
}

// Run tests
main().catch(error => {
    console.error("Test failed:", error);
});
/**
 * TypeScript to C++ type mapping utilities
 */

export class TypeMapper {
  private readonly typeMap: Map<string, string>;

  constructor() {
    this.typeMap = new Map([
      // Primitive types
      ["string", "js::string"],
      ["number", "js::number"],
      ["boolean", "js::boolean"],
      ["void", "void"],
      ["any", "js::any"],
      ["unknown", "js::any"],
      ["never", "void"],
      ["undefined", "js::undefined_t"],
      ["null", "std::nullptr_t"],
      ["symbol", "js::symbol"],
      ["bigint", "js::BigInt"],
      
      // Object types
      ["object", "js::object"],
      ["Object", "js::object"],
      ["Function", "std::function<js::any(js::any)>"],
      
      // Built-in objects
      ["Date", "js::Date"],
      ["RegExp", "js::RegExp"],
      ["Error", "js::Error"],
      ["TypeError", "js::TypeError"],
      ["ReferenceError", "js::ReferenceError"],
      ["SyntaxError", "js::SyntaxError"],
      ["RangeError", "js::RangeError"],
      ["Map", "js::Map"],
      ["Set", "js::Set"],
      ["WeakMap", "js::WeakMap"],
      ["WeakSet", "js::WeakSet"],
      
      // TypedArrays
      ["Int8Array", "js::Int8Array"],
      ["Uint8Array", "js::Uint8Array"],
      ["Uint8ClampedArray", "js::Uint8ClampedArray"],
      ["Int16Array", "js::Int16Array"],
      ["Uint16Array", "js::Uint16Array"],
      ["Int32Array", "js::Int32Array"],
      ["Uint32Array", "js::Uint32Array"],
      ["Float32Array", "js::Float32Array"],
      ["Float64Array", "js::Float64Array"],
      ["BigInt64Array", "js::BigInt64Array"],
      ["BigUint64Array", "js::BigUint64Array"],
      ["ArrayBuffer", "js::ArrayBuffer"],
      ["DataView", "js::DataView"],
    ]);
  }

  /**
   * Map a TypeScript type to a C++ type
   */
  mapType(tsType: string): string {
    // Handle null/undefined
    if (!tsType) {
      return "js::any";
    }

    // Remove whitespace
    tsType = tsType.trim();

    // Check simple type mapping
    if (this.typeMap.has(tsType)) {
      return this.typeMap.get(tsType)!;
    }

    // Handle array types
    if (tsType.endsWith("[]")) {
      const elementType = tsType.slice(0, -2);
      return `js::array<${this.mapType(elementType)}>`;
    }

    // Handle Array<T> generic
    if (tsType.startsWith("Array<") && tsType.endsWith(">")) {
      const elementType = tsType.slice(6, -1);
      return `js::array<${this.mapType(elementType)}>`;
    }

    // Handle Promise<T>
    if (tsType.startsWith("Promise<") && tsType.endsWith(">")) {
      const resolveType = tsType.slice(8, -1);
      return `js::Promise<${this.mapType(resolveType)}>`;
    }

    // Handle Record<K, V>
    if (tsType.startsWith("Record<") && tsType.endsWith(">")) {
      const types = this.parseGenericArgs(tsType.slice(7, -1));
      if (types.length === 2) {
        const keyType = this.mapType(types[0]);
        const valueType = this.mapType(types[1]);
        return `std::unordered_map<${keyType}, ${valueType}>`;
      }
    }

    // Handle union types (T | U)
    if (tsType.includes("|")) {
      const types = tsType.split("|").map(t => t.trim());
      return this.mapUnionType(types);
    }

    // Handle intersection types (T & U)
    if (tsType.includes("&")) {
      const types = tsType.split("&").map(t => t.trim());
      // For now, just use the first type
      return this.mapType(types[0]);
    }

    // Handle function types
    if (tsType.includes("=>")) {
      return this.mapFunctionType(tsType);
    }

    // Handle tuple types
    if (tsType.startsWith("[") && tsType.endsWith("]")) {
      return this.mapTupleType(tsType);
    }

    // Handle template literal types
    if (tsType.startsWith("`") && tsType.endsWith("`")) {
      return "js::string";
    }

    // Handle literal types
    if (tsType.startsWith('"') && tsType.endsWith('"')) {
      return "js::string";
    }
    if (tsType === "true" || tsType === "false") {
      return "js::boolean";
    }
    if (!isNaN(Number(tsType))) {
      return "js::number";
    }

    // Handle keyof operator
    if (tsType.startsWith("keyof ")) {
      return "js::string"; // Keys are typically strings
    }

    // Handle typeof operator
    if (tsType.startsWith("typeof ")) {
      return "js::any"; // Need more context to determine actual type
    }

    // Handle conditional types
    if (tsType.includes(" extends ") && tsType.includes("?")) {
      // For now, return any for conditional types
      return "js::any";
    }

    // Handle indexed access types
    if (tsType.includes("[") && tsType.includes("]") && !tsType.startsWith("[")) {
      // T[K] pattern
      return "js::any";
    }

    // Handle mapped types
    if (tsType.includes(" in ")) {
      return "js::object";
    }

    // Handle Partial, Required, Readonly, etc.
    const utilityTypeMatch = tsType.match(/^(Partial|Required|Readonly|Pick|Omit|Exclude|Extract|NonNullable|ReturnType|InstanceType|NoInfer)<(.+)>$/);
    if (utilityTypeMatch) {
      const [, utilityType, innerType] = utilityTypeMatch;
      return this.mapUtilityType(utilityType, innerType);
    }

    // Default to the type as-is (might be a user-defined type)
    return tsType;
  }

  /**
   * Map union types to C++
   */
  private mapUnionType(types: string[]): string {
    // Handle special cases
    const hasNull = types.includes("null");
    const hasUndefined = types.includes("undefined");
    const hasString = types.includes("string");
    const hasNumber = types.includes("number");
    
    // Filter out null and undefined
    const filteredTypes = types.filter(t => t !== "null" && t !== "undefined");
    
    // string | number -> js::typed::StringOrNumber
    if (filteredTypes.length === 2 && hasString && hasNumber) {
      return "js::typed::StringOrNumber";
    }
    
    // T | null -> js::typed::Nullable<T>
    if (hasNull && filteredTypes.length === 1) {
      return `js::typed::Nullable<${this.mapType(filteredTypes[0])}>`;
    }
    
    // T | undefined -> js::typed::Optional<T>
    if (hasUndefined && filteredTypes.length === 1) {
      return `js::typed::Optional<${this.mapType(filteredTypes[0])}>`;
    }
    
    // T | null | undefined -> js::typed::Optional<T>
    if ((hasNull || hasUndefined) && filteredTypes.length === 1) {
      return `js::typed::Optional<${this.mapType(filteredTypes[0])}>`;
    }
    
    // For complex unions, use std::variant
    if (filteredTypes.length > 1) {
      const mappedTypes = filteredTypes.map(t => this.mapType(t));
      return `std::variant<${mappedTypes.join(", ")}>`;
    }
    
    // Fallback to js::any
    return "js::any";
  }

  /**
   * Map function types to C++
   */
  private mapFunctionType(tsType: string): string {
    // Parse function signature
    const arrowIndex = tsType.indexOf("=>");
    if (arrowIndex === -1) {
      return "std::function<js::any(js::any)>";
    }

    const params = tsType.substring(0, arrowIndex).trim();
    const returnType = tsType.substring(arrowIndex + 2).trim();

    // Parse parameters
    let paramTypes: string[] = [];
    if (params.startsWith("(") && params.endsWith(")")) {
      const paramList = params.slice(1, -1);
      if (paramList) {
        // Simple parsing - doesn't handle complex nested types
        paramTypes = paramList.split(",").map(p => {
          const colonIndex = p.indexOf(":");
          if (colonIndex !== -1) {
            return this.mapType(p.substring(colonIndex + 1).trim());
          }
          return "js::any";
        });
      }
    } else {
      // Single parameter without parentheses
      paramTypes = ["js::any"];
    }

    const mappedReturn = this.mapType(returnType);
    const mappedParams = paramTypes.length > 0 ? paramTypes.join(", ") : "void";

    return `std::function<${mappedReturn}(${mappedParams})>`;
  }

  /**
   * Map tuple types to C++
   */
  private mapTupleType(tsType: string): string {
    // Remove brackets and parse elements
    const elements = this.parseGenericArgs(tsType.slice(1, -1));
    
    if (elements.length === 0) {
      return "std::tuple<>";
    }

    const mappedElements = elements.map(e => {
      // Handle optional elements
      if (e.endsWith("?")) {
        const type = e.slice(0, -1);
        return `std::optional<${this.mapType(type)}>`;
      }
      // Handle rest elements
      if (e.startsWith("...")) {
        const type = e.slice(3);
        return `${this.mapType(type)}...`; // Variadic template
      }
      // Handle named elements (TypeScript 4.0+)
      const colonIndex = e.indexOf(":");
      if (colonIndex !== -1) {
        const type = e.substring(colonIndex + 1).trim();
        return this.mapType(type);
      }
      return this.mapType(e);
    });

    return `std::tuple<${mappedElements.join(", ")}>`;
  }

  /**
   * Map utility types to C++
   */
  private mapUtilityType(utilityType: string, innerType: string): string {
    const mapped = this.mapType(innerType);

    switch (utilityType) {
      case "Partial":
        // All properties optional
        return `js::Partial<${mapped}>`;
      case "Required":
        // All properties required
        return `js::Required<${mapped}>`;
      case "Readonly":
        // All properties readonly
        return `const ${mapped}`;
      case "NonNullable":
        // Remove null and undefined
        return mapped; // Already handled in union type mapping
      case "ReturnType":
        // Extract return type of function
        return "js::any"; // Would need more context
      case "NoInfer":
        // Prevent type inference
        return mapped; // Pass through, no special C++ handling
      default:
        return `js::${utilityType}<${mapped}>`;
    }
  }

  /**
   * Parse generic type arguments
   */
  private parseGenericArgs(args: string): string[] {
    const result: string[] = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < args.length; i++) {
      const char = args[i];
      if (char === "<" || char === "[" || char === "(") {
        depth++;
        current += char;
      } else if (char === ">" || char === "]" || char === ")") {
        depth--;
        current += char;
      } else if (char === "," && depth === 0) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  }
}
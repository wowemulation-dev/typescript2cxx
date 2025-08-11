/**
 * Branded types for code generation
 * 
 * These branded types provide compile-time type safety to distinguish
 * between different string types, preventing accidental mixing of
 * C++ code strings with TypeScript code strings or other text.
 */

/**
 * C++ code string - represents generated C++ code
 */
export type CppCode = string & { readonly __brand: "CppCode" };

/**
 * TypeScript code string - represents TypeScript source code
 */
export type TypeScriptCode = string & { readonly __brand: "TypeScriptCode" };

/**
 * C++ header code - represents C++ header file content
 */
export type CppHeaderCode = CppCode & { readonly __headerBrand: "CppHeaderCode" };

/**
 * C++ source code - represents C++ source file content
 */
export type CppSourceCode = CppCode & { readonly __sourceBrand: "CppSourceCode" };

/**
 * Convert a regular string to CppCode
 * @param code The C++ code string
 * @returns Branded CppCode type
 */
export function toCppCode(code: string): CppCode {
  return code as CppCode;
}

/**
 * Convert a regular string to CppHeaderCode
 * @param code The C++ header code string
 * @returns Branded CppHeaderCode type
 */
export function toCppHeaderCode(code: string): CppHeaderCode {
  return code as CppHeaderCode;
}

/**
 * Convert a regular string to CppSourceCode
 * @param code The C++ source code string
 * @returns Branded CppSourceCode type
 */
export function toCppSourceCode(code: string): CppSourceCode {
  return code as CppSourceCode;
}

/**
 * Convert a regular string to TypeScriptCode
 * @param code The TypeScript code string
 * @returns Branded TypeScriptCode type
 */
export function toTypeScriptCode(code: string): TypeScriptCode {
  return code as TypeScriptCode;
}

/**
 * Check if a value is CppCode
 * @param value The value to check
 * @returns True if the value is a string (runtime check only)
 */
export function isCppCode(value: unknown): value is CppCode {
  return typeof value === "string";
}

/**
 * Check if a value is TypeScriptCode
 * @param value The value to check
 * @returns True if the value is a string (runtime check only)
 */
export function isTypeScriptCode(value: unknown): value is TypeScriptCode {
  return typeof value === "string";
}

/**
 * Concatenate multiple CppCode strings
 * @param codes The CppCode strings to concatenate
 * @returns Combined CppCode string
 */
export function concatCppCode(...codes: CppCode[]): CppCode {
  return codes.join("") as CppCode;
}

/**
 * Join CppCode strings with a separator
 * @param separator The separator string
 * @param codes The CppCode strings to join
 * @returns Joined CppCode string
 */
export function joinCppCode(separator: string, codes: CppCode[]): CppCode {
  return codes.join(separator) as CppCode;
}

/**
 * Indent CppCode by a specified amount
 * @param code The CppCode to indent
 * @param spaces Number of spaces to indent (default: 2)
 * @returns Indented CppCode
 */
export function indentCppCode(code: CppCode, spaces = 2): CppCode {
  const indent = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() ? indent + line : line))
    .join("\n") as CppCode;
}

/**
 * Template literal tag for CppCode
 * @param strings Template literal strings
 * @param values Template literal values
 * @returns CppCode string
 * 
 * @example
 * const code = cpp`int main() { return 0; }`;
 */
export function cpp(
  strings: TemplateStringsArray,
  ...values: unknown[]
): CppCode {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }
  return result as CppCode;
}

/**
 * Template literal tag for TypeScriptCode
 * @param strings Template literal strings
 * @param values Template literal values
 * @returns TypeScriptCode string
 * 
 * @example
 * const code = ts`const x: number = 42;`;
 */
export function ts(
  strings: TemplateStringsArray,
  ...values: unknown[]
): TypeScriptCode {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }
  return result as TypeScriptCode;
}
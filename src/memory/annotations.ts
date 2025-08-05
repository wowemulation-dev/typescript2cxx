/**
 * Memory management annotations parser
 *
 * Parses JSDoc comments for @weak, @unique, @shared annotations
 * and maps them to their associated property declarations.
 */

export enum MemoryAnnotation {
  None = "none",
  Weak = "weak",
  Unique = "unique",
  Shared = "shared",
}

export interface AnnotationInfo {
  annotation: MemoryAnnotation;
  line: number;
  column: number;
}

/**
 * Parse memory annotations from source code
 */
export class MemoryAnnotationParser {
  private annotations = new Map<string, AnnotationInfo>();

  /**
   * Parse source code and extract JSDoc memory annotations
   */
  parse(source: string, filename: string = "<anonymous>"): void {
    this.annotations.clear();

    const lines = source.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for JSDoc comments with memory annotations
      const jsdocMatch = line.match(/\/\*\*\s*@(weak|unique|shared)\s*\*\//);
      if (jsdocMatch) {
        const annotation = this.parseAnnotationName(jsdocMatch[1]);

        // Look for the next property declaration
        const propertyInfo = this.findNextProperty(lines, i + 1);
        if (propertyInfo) {
          const key = `${filename}:${propertyInfo.line}:${propertyInfo.name}`;
          this.annotations.set(key, {
            annotation,
            line: i + 1, // 1-based line numbers
            column: jsdocMatch.index || 0,
          });
        }
      }
    }
  }

  /**
   * Get memory annotation for a property at specific location
   */
  getAnnotation(filename: string, line: number, propertyName: string): MemoryAnnotation {
    const key = `${filename}:${line}:${propertyName}`;
    return this.annotations.get(key)?.annotation || MemoryAnnotation.None;
  }

  /**
   * Get all annotations
   */
  getAllAnnotations(): Map<string, AnnotationInfo> {
    return new Map(this.annotations);
  }

  /**
   * Clear all annotations
   */
  clear(): void {
    this.annotations.clear();
  }

  /**
   * Parse annotation name to enum
   */
  private parseAnnotationName(name: string): MemoryAnnotation {
    switch (name.toLowerCase()) {
      case "weak":
        return MemoryAnnotation.Weak;
      case "unique":
        return MemoryAnnotation.Unique;
      case "shared":
        return MemoryAnnotation.Shared;
      default:
        return MemoryAnnotation.None;
    }
  }

  /**
   * Find the next property declaration after a JSDoc comment
   */
  private findNextProperty(
    lines: string[],
    startLine: number,
  ): { name: string; line: number } | null {
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("//") || line.startsWith("/*")) {
        continue;
      }

      // Look for property declaration patterns
      // Examples: "propertyName: Type", "private propertyName:", "readonly prop:"
      const propertyMatch = line.match(
        /(?:private|public|protected|readonly|static)?\s*(\w+)\s*[?]?\s*:/,
      );
      if (propertyMatch) {
        return {
          name: propertyMatch[1],
          line: i + 1, // Convert to 1-based line numbers
        };
      }

      // If we hit a non-property line (like method or class), stop looking
      if (line.includes("(") || line.includes("{") || line.includes("class")) {
        break;
      }
    }

    return null;
  }
}

/**
 * Get appropriate C++ pointer type for annotation
 */
export function getCppPointerType(annotation: MemoryAnnotation, baseType: string): string {
  switch (annotation) {
    case MemoryAnnotation.Weak:
      return `std::weak_ptr<${baseType}>`;
    case MemoryAnnotation.Unique:
      return `std::unique_ptr<${baseType}>`;
    case MemoryAnnotation.Shared:
      return `std::shared_ptr<${baseType}>`;
    case MemoryAnnotation.None:
    default:
      // Use shared_ptr as default for object types
      return `std::shared_ptr<${baseType}>`;
  }
}

/**
 * Check if a type should use pointers based on annotation and type
 */
export function shouldUsePointer(annotation: MemoryAnnotation, typeName: string): boolean {
  // Primitive types don't need pointers
  const primitiveTypes = ["number", "string", "boolean", "void", "null", "undefined"];
  if (primitiveTypes.includes(typeName.toLowerCase())) {
    return false;
  }

  // Array types and object types typically use pointers for memory management
  if (typeName.includes("[]") || typeName === "object" || annotation !== MemoryAnnotation.None) {
    return true;
  }

  // Custom class types typically use pointers
  return !primitiveTypes.includes(typeName.toLowerCase());
}

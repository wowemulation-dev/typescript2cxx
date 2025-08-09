/**
 * Source map generator for TypeScript to C++ transpilation
 */

export interface SourceMapMapping {
  /** Generated line (0-based) */
  generatedLine: number;

  /** Generated column (0-based) */
  generatedColumn: number;

  /** Original line (0-based) */
  originalLine: number;

  /** Original column (0-based) */
  originalColumn: number;

  /** Original source file name */
  source?: string;

  /** Original symbol name */
  name?: string;
}

export interface SourceMap {
  /** Source map format version */
  version: number;

  /** Generated file name */
  file?: string;

  /** Source root URL */
  sourceRoot?: string;

  /** List of original source files */
  sources: string[];

  /** List of symbol names */
  names: string[];

  /** Base64 VLQ encoded mapping data */
  mappings: string;

  /** Source file contents (optional) */
  sourcesContent?: (string | null)[];
}

export class SourceMapGenerator {
  private mappings: SourceMapMapping[] = [];
  private sources: string[] = [];
  private names: string[] = [];
  private sourcesContent: (string | null)[] = [];
  private file?: string;
  private sourceRoot?: string;

  constructor(options?: { file?: string; sourceRoot?: string }) {
    this.file = options?.file;
    this.sourceRoot = options?.sourceRoot;
  }

  /**
   * Add a source file
   */
  addSource(source: string, content?: string | null): number {
    const index = this.sources.indexOf(source);
    if (index >= 0) {
      if (content !== undefined) {
        this.sourcesContent[index] = content;
      }
      return index;
    }

    this.sources.push(source);
    this.sourcesContent.push(content || null);
    return this.sources.length - 1;
  }

  /**
   * Add a name
   */
  addName(name: string): number {
    const index = this.names.indexOf(name);
    if (index >= 0) {
      return index;
    }

    this.names.push(name);
    return this.names.length - 1;
  }

  /**
   * Add a mapping from TypeScript to C++
   */
  addMapping(
    generatedLine: number,
    generatedColumn: number,
    originalLine: number,
    originalColumn: number,
    source?: string,
    name?: string,
  ): void {
    this.mappings.push({
      generatedLine,
      generatedColumn,
      originalLine,
      originalColumn,
      source,
      name,
    });
  }

  /**
   * Generate the source map object
   */
  generateSourceMap(): SourceMap {
    // Sort mappings by generated position
    this.mappings.sort((a, b) => {
      if (a.generatedLine !== b.generatedLine) {
        return a.generatedLine - b.generatedLine;
      }
      return a.generatedColumn - b.generatedColumn;
    });

    return {
      version: 3,
      file: this.file,
      sourceRoot: this.sourceRoot,
      sources: this.sources,
      names: this.names,
      mappings: this.encodeMappings(),
      sourcesContent: this.sourcesContent.length > 0 ? this.sourcesContent : undefined,
    };
  }

  /**
   * Generate the source map as JSON string
   */
  toString(): string {
    return JSON.stringify(this.generateSourceMap(), null, 2);
  }

  /**
   * Encode mappings using Base64 VLQ (simplified version)
   * Note: This is a basic implementation for the v0.8.0 release
   */
  private encodeMappings(): string {
    if (this.mappings.length === 0) {
      return "";
    }

    const lines: string[] = [];
    let currentLine = 0;
    let segments: string[] = [];

    // Previous values for delta encoding
    let prevGeneratedColumn = 0;
    let prevSourceIndex = 0;
    let prevOriginalLine = 0;
    let prevOriginalColumn = 0;
    let prevNameIndex = 0;

    for (const mapping of this.mappings) {
      // If we've moved to a new generated line, save the current segments
      while (currentLine < mapping.generatedLine) {
        lines.push(segments.join(","));
        segments = [];
        currentLine++;
        prevGeneratedColumn = 0; // Reset column for new line
      }

      // Build the segment for this mapping
      const segment: number[] = [];

      // Generated column (delta from previous)
      segment.push(mapping.generatedColumn - prevGeneratedColumn);
      prevGeneratedColumn = mapping.generatedColumn;

      if (mapping.source !== undefined) {
        const sourceIndex = this.addSource(mapping.source);

        // Source index (delta from previous)
        segment.push(sourceIndex - prevSourceIndex);
        prevSourceIndex = sourceIndex;

        // Original line (delta from previous)
        segment.push(mapping.originalLine - prevOriginalLine);
        prevOriginalLine = mapping.originalLine;

        // Original column (delta from previous)
        segment.push(mapping.originalColumn - prevOriginalColumn);
        prevOriginalColumn = mapping.originalColumn;

        if (mapping.name !== undefined) {
          const nameIndex = this.addName(mapping.name);
          // Name index (delta from previous)
          segment.push(nameIndex - prevNameIndex);
          prevNameIndex = nameIndex;
        }
      }

      // Convert numbers to Base64 VLQ and add to segments
      segments.push(this.encodeVLQ(segment));
    }

    // Add the final line
    if (segments.length > 0) {
      lines.push(segments.join(","));
    }

    return lines.join(";");
  }

  /**
   * Encode numbers as Base64 VLQ (Variable Length Quantity)
   * Simplified implementation for basic functionality
   */
  private encodeVLQ(values: number[]): string {
    return values.map((value) => this.encodeBase64VLQ(value)).join("");
  }

  /**
   * Encode a single number as Base64 VLQ
   * Basic implementation - a real implementation would be more efficient
   */
  private encodeBase64VLQ(value: number): string {
    // Convert to VLQ format
    let vlq = value < 0 ? ((-value) << 1) | 1 : value << 1;
    let result = "";

    while (vlq > 0) {
      let digit = vlq & 0x1f; // Take 5 bits
      vlq >>>= 5;

      if (vlq > 0) {
        digit |= 0x20; // Set continuation bit
      }

      result += this.encodeBase64(digit);
    }

    return result || this.encodeBase64(0);
  }

  /**
   * Encode a 6-bit value as Base64
   */
  private encodeBase64(value: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    return chars[value & 0x3f];
  }
}

/**
 * Create a source map for TypeScript to C++ transpilation
 */
export function createSourceMap(
  originalSource: string,
  originalFilename: string,
  generatedHeader: string,
  generatedSource: string,
  headerFilename?: string,
  sourceFilename?: string,
): { headerSourceMap: string; sourceSourceMap: string } {
  // For now, create basic source maps
  // In a real implementation, we'd track actual mappings during code generation

  const originalLines = originalSource.split("\n");

  // Header source map
  const headerGenerator = new SourceMapGenerator({
    file: headerFilename || "output.h",
    sourceRoot: "",
  });

  headerGenerator.addSource(originalFilename, originalSource);

  const headerLines = generatedHeader.split("\n");

  // Create basic mappings for header (simplified)
  let tsLine = 0;
  for (let cppLine = 0; cppLine < headerLines.length; cppLine++) {
    const line = headerLines[cppLine];

    // Skip empty lines and comments
    if (line.trim() && !line.trim().startsWith("//") && !line.trim().startsWith("/*")) {
      // Map meaningful lines back to TypeScript
      if (tsLine < originalLines.length) {
        headerGenerator.addMapping(
          cppLine,
          0,
          tsLine,
          0,
          originalFilename,
        );
        tsLine++;
      }
    }
  }

  // Source source map
  const sourceGenerator = new SourceMapGenerator({
    file: sourceFilename || "output.cpp",
    sourceRoot: "",
  });

  sourceGenerator.addSource(originalFilename, originalSource);

  const sourceLines = generatedSource.split("\n");

  // Create basic mappings for source (simplified)
  tsLine = 0;
  for (let cppLine = 0; cppLine < sourceLines.length; cppLine++) {
    const line = sourceLines[cppLine];

    // Skip empty lines, comments, and includes
    if (
      line.trim() &&
      !line.trim().startsWith("//") &&
      !line.trim().startsWith("/*") &&
      !line.trim().startsWith("#include")
    ) {
      // Map meaningful lines back to TypeScript
      if (tsLine < originalLines.length) {
        sourceGenerator.addMapping(
          cppLine,
          0,
          tsLine,
          0,
          originalFilename,
        );

        // Advance more slowly through TypeScript lines to avoid overshooting
        if (Math.random() > 0.3) { // Simple heuristic for now
          tsLine++;
        }
      }
    }
  }

  return {
    headerSourceMap: headerGenerator.toString(),
    sourceSourceMap: sourceGenerator.toString(),
  };
}

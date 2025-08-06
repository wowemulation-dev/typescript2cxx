# TypeScript Compiler API Migration Plan

## ✅ MIGRATION COMPLETED (v0.1.1)

This document outlines the migration from SWC to the TypeScript Compiler API for the typescript2cxx transpiler. This migration was critical to enable JSR.io publishing and provide full TypeScript language support.

**Status**: Completed on 2025-01-05 as part of v0.1.1 release.

## Goals

1. Replace SWC parser with TypeScript Compiler API
2. Maintain all existing functionality
3. Enable JSR.io publishing
4. Access full type information for advanced transpilation
5. Support TypeScript's incremental compilation

## Migration Strategy

### Phase 1: Setup and Infrastructure

1. **Install TypeScript API**
   - Add `npm:typescript` dependency to deno.json
   - Create TypeScript API wrapper module
   - Set up type definitions

2. **Create Parser Adapter**
   - Create `src/compiler/typescript-parser.ts` as SWC replacement
   - Implement AST conversion layer (TS AST → Internal AST)
   - Maintain compatibility with existing transformer pipeline

3. **Type System Integration**
   - Create `src/compiler/type-checker.ts` for type resolution
   - Implement symbol table management
   - Add type inference capabilities

### Phase 2: AST Walker Implementation

1. **Core AST Walker**
   - Implement visitor pattern matching SWC's behavior
   - Handle all TypeScript node types used in current implementation
   - Preserve source location information

2. **Node Converters**
   - Map TypeScript AST nodes to internal representation
   - Handle edge cases and TypeScript-specific constructs
   - Ensure 1:1 feature parity with SWC parser

### Phase 3: Feature Implementation

1. **Type Information**
   - Extract type annotations
   - Resolve generic types
   - Handle union/intersection types
   - Support type guards and narrowing

2. **Semantic Analysis**
   - Symbol resolution
   - Scope tracking
   - Import/export analysis
   - Identifier binding

3. **Advanced Features**
   - Decorator metadata
   - Const assertions
   - Template literal types
   - Conditional types

### Phase 4: Testing and Migration

1. **Test Migration**
   - Update parser tests to use new API
   - Ensure all existing tests pass
   - Add new tests for TypeScript-specific features

2. **Performance Testing**
   - Benchmark parser performance
   - Optimize hot paths
   - Implement caching where appropriate

3. **Gradual Rollout**
   - Feature flag for parser selection
   - Side-by-side comparison testing
   - Progressive migration of features

## Technical Details

### Current SWC Usage

```typescript
// Current approach in src/parser/parser.ts
import { parseSync } from "@swc/wasm-typescript";

export function parseTypeScript(source: string, filename: string): Program {
  const ast = parseSync(source, {
    syntax: "typescript",
    target: "es2022",
  });
  return ast;
}
```

### New TypeScript API Approach

```typescript
// New approach
import ts from "npm:typescript";

export function parseTypeScript(source: string, filename: string): ts.SourceFile {
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.ES2022,
    true, // setParentNodes
    ts.ScriptKind.TS,
  );
  return sourceFile;
}
```

### AST Mapping Strategy

1. **Direct Mappings** (similar nodes)
   - Variable declarations
   - Function declarations
   - Class declarations
   - Most expressions

2. **Complex Mappings** (different representations)
   - Decorators (metadata API)
   - Type nodes (richer in TS API)
   - Module declarations
   - Ambient declarations

3. **New Capabilities**
   - Type checker integration
   - Symbol information
   - Semantic diagnostics
   - Declaration emit

## Implementation Checklist

### Week 1: Foundation

- [ ] Add npm:typescript to dependencies
- [ ] Create TypeScript API wrapper
- [ ] Implement basic AST walker
- [ ] Convert simple programs (hello world)

### Week 2: Core Features

- [ ] Variable declarations with types
- [ ] Function declarations and calls
- [ ] Class declarations with inheritance
- [ ] Basic type resolution

### Week 3: Advanced Features

- [ ] Generics and type parameters
- [ ] Union/intersection types
- [ ] Decorators and metadata
- [ ] Module imports/exports

### Week 4: Testing and Polish

- [ ] Migrate all parser tests
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Remove SWC dependency

## Risk Mitigation

1. **AST Incompatibilities**
   - Maintain compatibility layer
   - Extensive testing of edge cases
   - Gradual migration approach

2. **Performance Concerns**
   - Benchmark critical paths
   - Implement caching
   - Use incremental compilation

3. **Feature Gaps**
   - Document any missing features
   - Implement workarounds
   - Plan for future updates

## Success Criteria

1. All existing tests pass with new parser
2. JSR.io publishing works
3. Performance within 20% of SWC
4. Full type information available
5. No regression in functionality

## References

- TypeScript Compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- ASDAlexander77 Implementation: Uses ts.* API throughout
- tswow Implementation: Direct TypeScript API usage in preprocessor.ts

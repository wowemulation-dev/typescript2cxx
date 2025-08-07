# Release Notes - v0.5.x Series

## Version 0.5.0 - Project Organization & E2E Testing

_Released: 2025-08-07_

### Overview

Version 0.5.0 focuses on project organization, developer experience, and comprehensive end-to-end testing. This release consolidates scattered output directories, improves test infrastructure, and ensures the complete TypeScript → C++ → Binary compilation pipeline works reliably.

### Major Improvements

#### Project Organization

- **Unified output structure**: All generated files now organized under `.output/` directory
  - **Before**: 8+ scattered directories (`cmake-test-output/`, `cov_profile/`, `coverage.lcov`, `e2e-cmake-test/`, etc.)
  - **After**: Single consolidated structure with logical subdirectories
  
  ```
  .output/
  ├── coverage/         # Test coverage data  
  ├── dist/             # Compiled CLI executable
  ├── docs/             # Generated API documentation
  ├── cmake-tests/      # CMake integration test results
  ├── reports/          # Test reports and analysis
  └── README.md         # Self-documenting structure
  ```

- **Configuration simplification**: 
  - **gitignore**: Single `/.output/` entry instead of 8+ scattered patterns
  - **deno.json**: All task outputs consolidated to `.output/` subdirectories
  - **Lint/format exclusions**: Single `.output/` exclusion

#### Test Infrastructure Enhancement

- **Integration test organization**: Moved CMake E2E tests to proper location
  - **From**: `test-all-with-cmake.ts` (project root)
  - **To**: `tests/integration/cmake-e2e.ts` (organized structure)
  - **Task**: Added `deno task test:cmake` for easy access

- **Test API modernization**: Updated all spec tests to current interfaces
  - Fixed outdated `TranspileResult.success` usage
  - Updated to use proper `header` and `source` string validation
  - Removed deprecated `outputDir` options
  - All 55 spec tests now use current API

- **E2E compilation validation**: Enhanced test runner capabilities  
  - Full TypeScript → C++ → Binary pipeline testing
  - Cross-platform compiler detection (clang++, g++, MSVC)
  - Real C++ compilation and execution validation
  - Output comparison and error reporting

### Critical Fixes

#### Runtime Stability

- **Circular dependency resolution**: Fixed core.h compilation issues
  - Restructured header to define simple types before complex types
  - Used forward declarations to break circular references
  - Proper std::variant usage for type safety

- **Type inference improvements**: Fixed invalid extern declarations
  - Binary expressions now properly infer `js::number` types
  - Eliminated "auto requires initializer" compilation errors
  - Correct C++ type generation for arithmetic operations

#### Test Execution Reliability

- **Path resolution**: Fixed runtime include path issues
  - Convert relative paths to absolute paths
  - Correct runtime header discovery in test environments
  - Proper temp directory handling

- **Permission handling**: Fixed subprocess execution
  - Full `--allow-run` permissions for C++ compilation
  - Correct executable permissions after CMake build
  - Cross-platform execution path handling

### Developer Experience

#### Build System Integration

- **CMake configuration**: Proper integration with project config
  - Uses `typescript2cxx.config.ts` settings (no hardcoded values)
  - Correct CMake minimum version (3.28) from configuration
  - Automatic dependency detection and linking

- **Quality assurance**: Complete QA pipeline
  - All formatting, linting, and type-checking passes
  - JSR package verification successful
  - Comprehensive test coverage with actual compilation

#### Documentation

- **Release notes**: Complete historical documentation
  - Created comprehensive release notes for v0.2.x, v0.3.x, v0.4.x
  - Updated README with current project status
  - Self-documenting output structure with README

- **Development scripts**: Enhanced developer workflow
  - Clear documentation of all available Deno tasks
  - Logical organization of test types (unit, integration, spec, E2E)
  - Simple cleanup with `rm -rf .output/`

### Breaking Changes

⚠️  **Output directory locations changed**:
- Coverage files: `cov_profile/` → `.output/coverage/`
- Compiled binaries: `./dist/` → `.output/dist/`
- Documentation: `./docs/` → `.output/docs/`
- CMake test output: `cmake-test-output/` → `.output/cmake-tests/`

**Migration**: Update any CI/CD scripts or tooling that references old output paths.

### Performance & Quality

- **Test execution**: Significantly faster spec test runs
- **Repository cleanliness**: Much cleaner project structure
- **Maintainability**: Logical organization improves long-term maintenance
- **CI/CD friendly**: Single output directory simplifies automation

### Compatibility

- **API compatibility**: No changes to public TypeScript→C++ transpilation API
- **CLI compatibility**: All CLI commands and options unchanged
- **Feature compatibility**: All existing TypeScript language features preserved

### Next Steps

Version 0.6.0 will focus on:

- Async/await with C++20 coroutines (completing the features from v0.4.0 scope)
- Advanced TypeScript features (conditional types, mapped types)  
- Performance optimizations for large codebases
- Module system improvements
- Enhanced error reporting and debugging

### Migration Guide

#### From v0.4.x

1. **Update CI/CD scripts** that reference old output paths:
   ```bash
   # Old paths
   ./dist/typescript2cxx          → .output/dist/typescript2cxx
   ./docs/                        → .output/docs/
   ./cmake-test-output/           → .output/cmake-tests/
   ./cov_profile/                 → .output/coverage/
   ```

2. **Clean old directories** (optional):
   ```bash
   rm -rf dist docs cmake-test-output cov_profile coverage.lcov
   ```

3. **Update any tooling** that expects output in old locations

4. **No code changes required** - all APIs remain the same

---

## Version 0.5.1 - Future Patch Release

_Planned_

### Planned Improvements

- Further test infrastructure enhancements
- Additional E2E test coverage
- Performance optimizations for large projects
- Enhanced error reporting in test failures

### Planned Bug Fixes

- Edge cases in CMake integration tests
- Minor issues in cross-platform test execution
- Documentation improvements
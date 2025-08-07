# Release Process

This document outlines the complete release process for typescript2cxx to prevent failed releases and ensure quality.

## Pre-Release Checklist

Before creating any release, always follow this checklist:

### 1. Pre-Release QA (MANDATORY)

```bash
# Run the comprehensive pre-release QA script
deno task pre-release
```

This script will:

- ✅ Check and auto-fix code formatting
- ✅ Run linting checks
- ✅ Verify TypeScript type checking
- ✅ Run core tests (excluding E2E tests that need C++ compilers)
- ✅ Verify JSR package structure
- ✅ Check CI/CD compatibility

**⚠️ IMPORTANT**: Only proceed if ALL checks pass.

### 2. Version Update Process

1. **Update version numbers**:
   - `deno.json` - Update `version` field
   - `src/mod.ts` - Update `VERSION` constant
   - `README.md` - Update current version references

2. **Update documentation**:
   - Create/update release notes in `RELEASE_NOTES_v{major}.{minor}.x.md`
   - Update future version placeholders

3. **Run QA again after changes**:
   ```bash
   deno task pre-release
   ```

### 3. Commit and Tag

```bash
# Commit changes (no mention of external tools)
git add -A
git commit -m "release: bump version to X.Y.Z

- Update version in deno.json and src/mod.ts
- Update README.md current status section
- Add comprehensive X.Y.Z release notes

Version X.Y.Z focuses on [brief description of changes]."

# Create annotated tag
git tag -a vX.Y.Z -m "Release vX.Y.Z - Brief Description

[Detailed description of changes]

Key improvements:
- [Feature 1]
- [Feature 2]
- [Bug fix 1]

This is a [maintenance/feature/major] release with [backward compatibility status]."

# Push to remote
git push origin main && git push origin vX.Y.Z
```

## What Gets Tested in CI/CD

### GitHub Actions CI (`ci.yml`)

- ✅ Code formatting (`deno fmt --check`)
- ✅ Linting (`deno lint`)
- ✅ Type checking (`deno check src/**/*.ts`)
- ✅ Core tests only (parser, runtime, transpiler, type-checker, unit)
- ✅ Test coverage
- ✅ JSR package verification

### JSR Publishing (`publish-jsr.yml`)

- ✅ Version consistency check
- ✅ All quality checks from CI
- ✅ JSR publishing

### What's NOT Tested in CI/CD

- ❌ E2E tests (require C++ compilers not available in GitHub Actions)
- ❌ Spec tests (contain expected failures for unimplemented features)
- ❌ CMake integration tests

## Common Failure Patterns & Solutions

### 1. Formatting Failures

**Symptoms**: `Found X not formatted files` error
**Cause**: Trailing whitespace or inconsistent formatting
**Prevention**: Always run `deno task pre-release` first
**Fix**: Run `deno fmt` and recommit

### 2. E2E Test Failures in CI

**Symptoms**: `No C++ compiler found` errors
**Cause**: E2E tests trying to run in GitHub Actions
**Prevention**: GitHub workflows now exclude E2E tests
**Note**: E2E tests should only be run locally or in environments with C++ compilers

### 3. JSR Package Structure Issues

**Symptoms**: JSR publish dry-run failures
**Cause**: Invalid package configuration or missing exports
**Prevention**: `deno task pre-release` includes JSR verification
**Fix**: Check `deno.json` exports and package structure

### 4. Type Checking Failures

**Symptoms**: TypeScript compilation errors
**Cause**: Type conflicts or invalid type definitions
**Prevention**: `deno task pre-release` includes comprehensive type checking
**Fix**: Resolve type errors before release

## Release Types

### Patch Release (X.Y.Z → X.Y.Z+1)

- Bug fixes
- Documentation updates
- Performance improvements
- No breaking changes

### Minor Release (X.Y.Z → X.Y+1.0)

- New features
- Enhanced functionality
- May include breaking changes
- Requires comprehensive testing

### Major Release (X.Y.Z → X+1.0.0)

- Significant architectural changes
- Breaking changes
- New major features
- Extensive testing and documentation required

## Post-Release Verification

After pushing tags, verify:

1. **GitHub Actions Status**:
   - Check that CI pipeline passes
   - Verify JSR publishing succeeds
   - Confirm release creation

2. **JSR.io Package**:
   - Visit https://jsr.io/@wowemulation-dev/typescript2cxx
   - Confirm new version is published
   - Test installation: `deno add @wowemulation-dev/typescript2cxx`

3. **GitHub Release**:
   - Verify release notes are properly formatted
   - Confirm assets are attached if applicable

## Emergency Release Fixes

If a release fails:

1. **Don't panic** - identify the specific failure
2. **Run local QA**: `deno task pre-release`
3. **Fix the specific issue**
4. **Run QA again** to confirm fix
5. **Follow normal release process** for corrected version

## Tools and Scripts

- `deno task pre-release` - Comprehensive QA script
- `deno task test:cmake` - Local E2E testing with C++ compilers
- `scripts/pre-release-qa.ts` - Main QA automation script

## Best Practices

1. **Always run pre-release QA** before any version changes
2. **Test locally first** before pushing tags
3. **Keep release notes updated** during development
4. **Use semantic versioning** consistently
5. **Don't rush releases** - quality over speed
6. **Monitor CI/CD pipelines** after releases
7. **Keep this documentation updated** as processes evolve

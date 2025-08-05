# Release Process

This document describes the release process for typescript2cxx.

## Prerequisites

- Ensure you have push access to the repository
- Ensure your local main branch is up to date
- Ensure all tests pass locally

## Release Steps

### 1. Update Version

Update the version in `deno.json`:

```json
{
  "version": "0.1.1"
}
```

### 2. Update Changelog

Add a new section to `CHANGELOG.md` following the conventional commits format:

```markdown
## [0.1.1] - 2025-01-15

### Added

- feat: new feature description

### Changed

- refactor: improved implementation

### Fixed

- fix: bug fix description
```

### 3. Commit Changes

```bash
git add deno.json CHANGELOG.md
git commit -m "chore: release v0.1.1"
git push origin main
```

### 4. Create and Push Tag

```bash
# Create annotated tag
git tag -a v0.1.1 -m "Release v0.1.1"

# Push tag to trigger release workflows
git push origin v0.1.1
```

### 5. Verify Release

The following will happen automatically:

1. **CI Workflow** - Runs tests and checks
2. **JSR Publish Workflow** - Publishes to JSR registry
3. **GitHub Release Workflow** - Creates GitHub release

Monitor the [Actions tab](https://github.com/wowemulation-dev/typescript2cxx/actions)
to ensure all workflows complete successfully.

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Pre-releases

For pre-release versions:

```bash
# Alpha release
git tag v0.1.1-alpha.1

# Beta release
git tag v0.1.1-beta.1

# Release candidate
git tag v0.1.1-rc.1
```

## Troubleshooting

### JSR Publishing Fails

1. Ensure the package is linked to the GitHub repository on JSR
2. Verify the version in deno.json matches the tag
3. Check for any JSR compatibility issues with `deno publish --dry-run`

### Version Mismatch

The publish workflow will fail if the git tag doesn't match the version in `deno.json`.
Always update `deno.json` before creating the tag.

### Failed Tests

The release will not proceed if tests fail. Fix any failing tests before attempting
to release.

## Manual Publishing

If automated publishing fails, you can publish manually:

```bash
# Dry run first
deno publish --dry-run

# Publish to JSR
deno publish
```

Note: Manual publishing requires browser authentication.

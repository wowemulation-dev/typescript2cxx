# Contributing to typescript2cxx

Thank you for your interest in contributing to typescript2cxx!

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. Check existing issues first
2. Use issue templates when available
3. Provide minimal reproduction examples
4. Include system information (OS, Deno version)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`deno task test`)
5. Format code (`deno fmt`)
6. Lint code (`deno lint`)
7. Commit with conventional commits
8. Push to your fork
9. Open a pull request

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process/auxiliary tool changes

Examples:

```
feat: add support for async/await transformation
fix: correct template literal interpolation
docs: update README with new examples
```

### Development Guidelines

1. Write tests for new features
2. Maintain backwards compatibility
3. Document public APIs with JSDoc
4. Follow existing code patterns
5. Keep changes focused and atomic

### Testing

Run the test suite:

```bash
deno task test
```

Run specific tests:

```bash
deno test --allow-read --allow-write --allow-env --allow-net tests/parser.test.ts
```

Generate coverage:

```bash
deno task test:coverage
deno task coverage
```

### Code Style

We use Deno's built-in formatter:

```bash
deno fmt
deno lint
```

### Documentation

- Update README for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md for releases
- Include examples for new features

## Questions?

Feel free to ask in:

- [Discord #typescript2cxx](https://discord.gg/Jj4uWy3DGP)
- [GitHub Discussions](https://github.com/wowemulation-dev/typescript2cxx/discussions)

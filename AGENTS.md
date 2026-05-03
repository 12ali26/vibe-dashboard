# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty project shell. Add application code under `src/`, tests under `tests/` or colocated as `*.test.*`, and static assets under `assets/` or `public/`. Keep package manifests, formatter settings, and CI definitions at the repository root.

Suggested starting layout:

```text
src/        Application source code
tests/      Integration or end-to-end tests
public/     Static files served directly
assets/     Images, icons, and other source assets
```

## Build, Test, and Development Commands

No build system or package manifest is present yet. When one is added, document the canonical commands here and keep them stable for contributors.

Common examples for a JavaScript/TypeScript dashboard project:

```bash
npm install      # install dependencies
npm run dev      # start the local development server
npm test         # run the test suite
npm run build    # create a production build
npm run lint     # run static analysis
```

Prefer scripts in `package.json` so contributors do not need framework-specific commands.

## Coding Style & Naming Conventions

Use two-space indentation for JavaScript, TypeScript, JSON, CSS, and Markdown. Prefer descriptive names. Use `PascalCase` for components and classes, `camelCase` for variables and functions, and `kebab-case` for file and directory names unless the framework requires otherwise.

Add formatter and linter configuration early, such as Prettier and ESLint. Keep formatting changes separate from behavioral changes when practical.

## Testing Guidelines

Add tests with the first meaningful feature. Name tests after the module under test, for example `src/widgets/chart.test.ts` or `tests/chart.spec.ts`. Cover user-visible behavior, data transformations, and loading or error states. Run the full suite before opening a pull request.

## Commit & Pull Request Guidelines

This repository has no commit history yet, so no existing convention can be inferred. Use short, imperative commit messages, such as `Add dashboard layout` or `Fix chart loading state`. Keep each commit focused on one logical change.

Pull requests should include a concise summary, testing notes, and screenshots or recordings for UI changes. Link related issues when available and call out any follow-up work, migrations, or configuration changes.

## Security & Configuration Tips

Do not commit secrets, API keys, tokens, or local environment files. Use an ignored `.env.local` for developer-specific values and commit a `.env.example` when configuration is required. Review dependency additions for maintenance status and license compatibility before merging.

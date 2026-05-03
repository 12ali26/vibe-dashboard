# Repository Guidelines
## Goal

Build a web-based control panel for my cloud development environment.

This dashboard will run on my Ubuntu server (where code-server is installed) and act as a central interface to manage my coding workflow.

It should allow me to:

- View and manage project folders inside /home/ubuntu/projects
- Create, delete, and open projects
- See Git status for each project
- Run and monitor development servers (npm run dev, python apps, etc.)
- View system information (CPU, RAM, disk usage)
- Eventually manage files and basic terminal commands

This dashboard replaces the need to manually use the terminal for common tasks and acts as a lightweight alternative to platforms like GitHub Codespaces or Coder.

Start simple, then expand features incrementally.
## Constraints

- The dashboard runs locally on the same server as code-server
- It must NOT access files outside /home/ubuntu/projects unless explicitly allowed
- It should use simple APIs (no overengineering)
- Prefer minimal dependencies
- Keep everything beginner-friendly and easy to run
## Project Structure & Module Organization

This repository is currently an empty project shell. Add application code under `src/`, tests under `tests/` or colocated as `*.test.*`, and static assets under `assets/` or `public/` depending on the framework selected. Keep top-level configuration files, such as package manifests, formatter settings, and CI definitions, at the repository root.

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




npm test         # run the test suite
npm run build    # create a production build
npm run lint     # run static analysis
```

Prefer adding scripts to `package.json` so contributors do not need to memorize framework-specific commands.

## Coding Style & Naming Conventions

Use two-space indentation for JavaScript, TypeScript, JSON, CSS, and Markdown. Prefer descriptive names over abbreviations. Use `PascalCase` for components and classes, `camelCase` for variables and functions, and `kebab-case` for file and directory names unless the framework requires otherwise.

Add formatter and linter configuration early, such as Prettier and ESLint for TypeScript projects. Keep formatting changes separate from behavioral changes when practical.

## Testing Guidelines

Add tests with the first meaningful feature. Name unit tests after the module under test, for example `src/widgets/chart.test.ts` or `tests/chart.spec.ts`. Cover user-visible behavior, data transformations, and edge cases around loading and error states. Run the full test suite before opening a pull request.

## Commit & Pull Request Guidelines

This repository has no commit history yet, so no existing convention can be inferred. Use short, imperative commit messages, such as `Add dashboard layout` or `Fix chart loading state`. Keep each commit focused on one logical change.

Pull requests should include a concise summary, testing notes, and screenshots or recordings for UI changes. Link related issues when available and call out any follow-up work, migrations, or configuration changes.

## Security & Configuration Tips

Do not commit secrets, API keys, tokens, or local environment files. Use an ignored `.env.local` for developer-specific values and commit a `.env.example` when configuration is required. Review dependency additions for maintenance status and license compatibility before merging.

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

This repository is currently an empty project shell. Add application code under `src/`, tests under `tests/` or colocated as `*.test.*`, and static assets under `assets/` or `public/`. Keep package manifests, formatter settings, and CI definitions at the repository root.

Suggested starting layout:

```text
src/        Application source code
tests/      Integration or end-to-end tests
public/     Static files served directly
assets/     Images, icons, and other source assets
```


## Coding Style & Naming Conventions

Use two-space indentation for JavaScript, TypeScript, JSON, CSS, and Markdown. Prefer descriptive names. Use `PascalCase` for components and classes, `camelCase` for variables and functions, and `kebab-case` for file and directory names unless the framework requires otherwise.

Add formatter and linter configuration early, such as Prettier and ESLint. Keep formatting changes separate from behavioral changes when practical.


## Commit & Pull Request Guidelines

This repository has no commit history yet, so no existing convention can be inferred. Use short, imperative commit messages, such as `Add dashboard layout` or `Fix chart loading state`. Keep each commit focused on one logical change.

Pull requests should include a concise summary, testing notes, and screenshots or recordings for UI changes. Link related issues when available and call out any follow-up work, migrations, or configuration changes.

## Security & Configuration Tips

Do not commit secrets, API keys, tokens, or local environment files. Use an ignored `.env.local` for developer-specific values and commit a `.env.example` when configuration is required. Review dependency additions for maintenance status and license compatibility before merging.

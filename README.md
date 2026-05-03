# Vibe Dashboard

A small local dashboard for managing projects on an Ubuntu code-server machine.

## Features

- Lists project folders from one or more explicitly allowed workspace roots.
- Detects Node projects, Python projects, static web folders, and Git repositories.
- Shows read-only Git branch and clean/dirty status using safe Git status commands.
- Shows CPU usage, memory usage, disk usage, uptime, and platform details.
- Refreshes manually and automatically every 10 seconds without overlapping requests.
- Provides safe copy buttons for project paths, `code-server <path>` open commands, and common dev commands.
- Does not run arbitrary commands and only reads explicit workspace roots inside `/home/ubuntu`.

## Local Development

```bash
npm install
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

API endpoints are available under the same host:

```text
http://localhost:3000/api/health
http://localhost:3000/api/dashboard
```

`npm run dev` watches the frontend build and restarts the backend when backend files change. This is intentionally less fancy than Vite hot reload, but it works reliably behind code-server's port forwarding because the whole app uses one port.

## Using the Dashboard

Open the dashboard in the browser, then use:

- `Refresh` to update project, Git, and system status immediately.
- `Copy path` to copy a project folder path.
- `Open command` to copy a `code-server <project-path>` command for opening the folder.
- Suggested command buttons, such as `npm install`, `npm run dev`, or `source .venv/bin/activate`, to copy safe commands into your terminal.

The dashboard intentionally suggests commands instead of executing them in V1.

## Environment

`.env.example` documents the supported local settings. Export values in your shell before starting the app when you need overrides.

```bash
export PORT=3000
export WORKSPACE_ROOTS=/home/ubuntu/projects
```

Use comma-separated roots to include additional safe workspace folders:

```bash
export WORKSPACE_ROOTS=/home/ubuntu/projects,/home/ubuntu/apps
```

Workspace roots must stay inside `/home/ubuntu`. Sensitive locations such as `/home/ubuntu/.ssh`, `/home/ubuntu/.config`, `/etc`, `/var`, and `/tmp` are rejected.

## Scripts

```bash
npm run dev       # start frontend and backend
npm run build     # type-check and build the frontend
npm run start     # run the backend and serve dist/
npm run test      # run tests
npm run lint      # run ESLint
```

# VibeIDE

A self-hostable dashboard for managing a code-server workspace.

VibeIDE supports two Docker modes:

- Existing code-server mode: run only the dashboard and connect it to a code-server already running on the host.
- Bundled IDE mode: run both the dashboard and a code-server container on a fresh server.

## Features

- List, create, and delete project folders in the configured workspace.
- Browse project files and folders in the dashboard.
- Preview small text files without editing them.
- Open any project directly in code-server.
- Start, stop, and monitor `npm run dev` for Node projects.
- Show CPU, memory, disk, uptime, and platform details.

## Mode 1: Existing code-server

Use this when code-server is already running on the server, for example on port `8080`.

This is the right mode for the current EC2 development server.

```bash
cp .env.example .env
```

Set these values in `.env`:

```bash
DASHBOARD_PORT=3000
HOST_WORKSPACES_DIR=/home/ubuntu/projects
WORKSPACES_DIR=/home/ubuntu/projects
CODE_SERVER_PORT=8080
CODE_SERVER_URL=
```

Start only the dashboard:

```bash
docker compose build
docker compose up -d dashboard
```

Open:

```text
http://your-server-ip:3000
```

The dashboard opens projects in your existing code-server at:

```text
http://your-server-ip:8080
```

## Mode 2: Bundled IDE

Use this on a fresh server where no code-server is already running.

This starts:

- dashboard on port `3000`
- code-server on port `8080`
- shared workspace folder at `./workspaces`
- code-server config at `./config/code-server`

Set these values in `.env`:

```bash
DASHBOARD_PORT=3000
HOST_WORKSPACES_DIR=./workspaces
WORKSPACES_DIR=/workspaces
CODE_SERVER_PORT=8080
BUNDLED_CODE_SERVER_PORT=8080
CODE_SERVER_PASSWORD=replace-this-password
CODE_SERVER_URL=
```

Start the full stack:

```bash
docker compose build
docker compose --profile bundled-ide up -d
```

Open:

```text
http://your-server-ip:3000
http://your-server-ip:8080
```

Use `CODE_SERVER_PASSWORD` to sign in to the bundled code-server.

## Docker Commands

Existing code-server mode:

```bash
docker compose build
docker compose up -d dashboard
docker compose logs
docker compose down
```

Bundled IDE mode:

```bash
docker compose build
docker compose --profile bundled-ide up -d
docker compose logs
docker compose down
```

`docker compose down` stops containers. It does not delete local folders like `./workspaces` or `./config/code-server`.

## Configuration

`.env.example` contains:

```bash
DASHBOARD_PORT=3000
HOST_WORKSPACES_DIR=/home/ubuntu/projects
WORKSPACES_DIR=/home/ubuntu/projects
CODE_SERVER_PORT=8080
CODE_SERVER_URL=
BUNDLED_CODE_SERVER_PORT=8080
CODE_SERVER_PASSWORD=change-me
```

If code-server is behind a domain or proxy, set the full URL:

```bash
CODE_SERVER_URL=https://ide.example.com
```

When `CODE_SERVER_URL` is empty, the dashboard uses the browser hostname with `CODE_SERVER_PORT`.

## Local Development

For working on the dashboard without Docker:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Local development defaults to `/home/ubuntu/projects`. Override it when needed:

```bash
export WORKSPACES_DIR=/path/to/projects
npm run dev
```

## Scripts

```bash
npm run dev       # build the frontend in watch mode and run the backend
npm run build     # type-check and build the frontend
npm run start     # run the backend and serve dist/
npm run test      # run tests
npm run lint      # run ESLint
```

## Safety

The dashboard only uses its configured workspace root. Project names and file paths are validated before filesystem operations, and delete requests remove only direct child folders of the workspace root.

File previews are read-only, limited to small text files, and skip binary files.

Dev server controls are intentionally narrow: the dashboard only starts `npm run dev`, only from a validated project folder, and shows recent stdout/stderr logs in the project view.

## AWS Ports

Existing code-server mode:

- `3000/tcp` for the VibeIDE dashboard
- `8080/tcp` for your existing code-server

Bundled IDE mode:

- `3000/tcp` for the VibeIDE dashboard
- `8080/tcp` for bundled code-server

Keep SSH on `22/tcp` open only to your own IP if you still need server access.

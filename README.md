# VibeIDE

A self-hostable dashboard for managing a code-server workspace.

VibeIDE supports two Docker modes:

- Fresh install mode: run dashboard + bundled code-server.
- Existing code-server mode: run only the dashboard and connect it to code-server already running on the host.

## Fresh Install

Use this on a fresh Ubuntu server.

One-command install:

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/vibe-dashboard/main/install.sh | bash
```

The installer will:

- Install Docker Engine and Docker Compose plugin if missing.
- Install Git if missing.
- Clone this repo into `~/vibeide` if needed.
- Create `./workspaces` and `./config/code-server`.
- Create `.env` from `.env.example`.
- Generate a code-server password.
- Run `docker compose build`.
- Run `docker compose --profile bundled-ide up -d`.

Open:

```text
Dashboard: http://SERVER_IP:3000
IDE:       http://SERVER_IP:8080
```

The generated code-server password is printed during install and saved in `.env`.

## Existing code-server Mode

Use this when code-server is already running on the server, for example on port `8080`.

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
Dashboard: http://SERVER_IP:3000
IDE:       http://SERVER_IP:8080
```

## Bundled IDE Mode

Use this when you want Docker Compose to run both dashboard and code-server.

Set these values in `.env`:

```bash
cp .env.bundled.example .env

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

## Start, Stop, Logs

Existing code-server mode:

```bash
docker compose up -d dashboard
docker compose logs
docker compose down
```

Bundled IDE mode:

```bash
docker compose --profile bundled-ide up -d
docker compose logs
docker compose down
```

Check status:

```bash
docker compose ps
```

Restart:

```bash
docker compose restart
```

## Uninstall / Cleanup

Stop containers:

```bash
docker compose down
```

Remove generated local data for bundled mode:

```bash
rm -rf workspaces config/code-server .env
```

Remove Docker images and unused Docker cache:

```bash
docker system prune -a
```

Only run `docker system prune -a` if you are okay deleting unused Docker images on the server.

## AWS Ports

Fresh install / bundled IDE mode:

- `3000/tcp` for the VibeIDE dashboard
- `8080/tcp` for bundled code-server

Existing code-server mode:

- `3000/tcp` for the VibeIDE dashboard
- your existing code-server port, usually `8080/tcp`

Keep SSH on `22/tcp` open only to your own IP if you need server access.

## Features

- List, create, and delete project folders in the configured workspace.
- Browse project files and folders in the dashboard.
- Preview small text files without editing them.
- Open any project directly in code-server.
- Start, stop, and monitor `npm run dev` for Node projects.
- Show CPU, memory, disk, uptime, and platform details.

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

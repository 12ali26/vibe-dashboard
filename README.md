# VibeIDE

A self-hostable browser IDE package for an Ubuntu server. It includes:

- VibeIDE Dashboard on port `3000`
- code-server on host port `8443`
- one shared workspace folder: `./workspaces`

The dashboard manages projects, file browsing, previews, system status, and safe dev-server controls. code-server is the full IDE for editing.

## Features

- List, create, and delete project folders in the shared workspace.
- Browse project files and folders in the dashboard.
- Preview small text files without editing them.
- Open any project directly in code-server.
- Start, stop, and monitor `npm run dev` for Node projects.
- Show CPU, memory, disk, uptime, and platform details.
- Run dashboard and code-server together with Docker Compose.

## Quick Install

Install Docker and Docker Compose on your server, then run:

```bash
git clone <your-repo-url> vibeide
cd vibeide
cp .env.example .env
```

Edit `.env` and set a real code-server password:

```bash
CODE_SERVER_PASSWORD=replace-this-password
```

Start the stack:

```bash
docker compose build
docker compose up -d
```

Open:

```text
http://your-server-ip:3000
```

The dashboard `Open IDE` and per-project `Open in IDE` buttons point to code-server on:

```text
http://your-server-ip:8443
```

Use the password from `CODE_SERVER_PASSWORD` when code-server asks you to sign in.

## Configuration

`.env.example` contains the supported settings:

```bash
DASHBOARD_PORT=3000
CODE_SERVER_PORT=8443
CODE_SERVER_PASSWORD=change-me
CODE_SERVER_URL=
WORKSPACES_DIR=/home/ubuntu/projects
```

If your code-server URL is behind a proxy or custom domain, set:

```bash
CODE_SERVER_URL=https://ide.example.com
```

If `CODE_SERVER_URL` is empty, the dashboard uses the browser's current hostname with `CODE_SERVER_PORT`.

## Shared Workspace

Both containers mount the same local folder:

```text
./workspaces:/workspaces
```

That means:

- Projects created in the dashboard appear in code-server.
- Files created in code-server appear in the dashboard.
- `Open in IDE` works because both services use the same path.

code-server config is persisted locally at:

```text
./config/code-server
```

Inside Docker, the dashboard reads only:

```text
WORKSPACES_DIR=/workspaces
```

## Docker Commands

```bash
docker compose build       # build the dashboard image
docker compose up -d       # start dashboard + code-server
docker compose logs        # view recent logs
docker compose logs -f     # follow logs
docker compose ps          # view container status
docker compose down        # stop containers
```

`docker compose down` does not delete `./workspaces` or `./config/code-server`.

## Local Development

For working on the dashboard itself without Docker:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Local non-Docker development defaults to `/home/ubuntu/projects`. Override it when needed:

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

The dashboard only uses its configured workspace root. In Docker that is `/workspaces`, backed by `./workspaces` on the host. In local development the default remains `/home/ubuntu/projects`.

Project names and file paths are validated before filesystem operations, and delete requests remove only direct child folders of the workspace root.

File previews are read-only, limited to small text files, and skip binary files.

Dev server controls are intentionally narrow: the dashboard only starts `npm run dev`, only from a validated project folder, and shows recent stdout/stderr logs in the project view.

## AWS Ports

Open these inbound ports in your AWS security group:

- `3000/tcp` for the VibeIDE dashboard
- `8443/tcp` for code-server

Keep SSH on `22/tcp` open only to your own IP if you still need server access.

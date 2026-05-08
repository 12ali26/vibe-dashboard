# VibeIDE

A self-hostable dashboard for managing a code-server workspace.

The standard install path is the bundled stack: dashboard + code-server together. This is the mode intended for fresh servers and for anyone self-hosting VibeIDE.

## Fresh Install

Use this on a fresh Ubuntu server. This installer always sets up the bundled stack.

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

The bundled IDE image includes common developer tools and the Codex CLI:

- `git`, `curl`, `wget`, `unzip`, and `build-essential`
- Node.js LTS and `npm`
- `python3`, `python3-pip`, and `python3-venv`
- `codex`

After opening the IDE, use the built-in terminal to sign in to Codex before running Codex tasks. You can confirm the CLI is installed with:

```bash
codex --version
```

## Update VibeIDE

Use this on a server that already has VibeIDE installed and running. It updates the platform without reinstalling or deleting your local data.

One-command update:

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/vibe-dashboard/main/update.sh | bash
```

The updater will:

- Find your existing VibeIDE folder.
- Verify Git, Docker, and Docker Compose are available.
- Fail safely if Docker is not running or no VibeIDE Compose services are running.
- Pull the latest changes from GitHub.
- Preserve `.env`, `workspaces/`, and `config/`.
- Rebuild Docker images.
- Restart the same mode you are already using.

The updater supports both bundled IDE mode and dashboard-only mode. If your install is not in `~/vibeide` and you are not running the command from the VibeIDE folder, set the install directory:

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/vibe-dashboard/main/update.sh | VIBEIDE_INSTALL_DIR=/path/to/vibeide bash
```

To check the updater version:

```bash
./update.sh --version
```

To print the VibeIDE app version from a cloned repo:

```bash
npm run version
```

## Manual Bundled Install

Use this if you cloned the repo yourself and want to start the bundled stack manually.

```bash
cp .env.bundled.example .env
```

Edit `.env` and set:

```bash
CODE_SERVER_PASSWORD=replace-this-password
```

Start the full stack:

```bash
docker compose build
docker compose --profile bundled-ide up -d
```

Open:

```text
Dashboard: http://SERVER_IP:3000
IDE:       http://SERVER_IP:8080
```

The bundled IDE includes the Codex CLI and basic developer tools. In the IDE terminal, sign in to Codex, then verify the CLI:

```bash
codex --version
```

## Existing code-server Mode

This is an advanced/manual mode for servers that already have code-server running. It is not what the installer uses.

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

## Start, Stop, Logs

Bundled stack:

```bash
docker compose --profile bundled-ide up -d
docker compose logs
docker compose down
```

Existing code-server mode:

```bash
docker compose up -d dashboard
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

Update:

```bash
./update.sh
```

## Uninstall / Cleanup

Stop containers:

```bash
docker compose down
```

Remove generated local data for bundled installs:

```bash
rm -rf workspaces config/code-server .env
```

Remove Docker images and unused Docker cache:

```bash
docker system prune -a
```

Only run `docker system prune -a` if you are okay deleting unused Docker images on the server.

## AWS Ports

Fresh install / bundled mode:

- `3000/tcp` for the VibeIDE dashboard
- `8080/tcp` for bundled code-server

Existing code-server mode:

- `3000/tcp` for the VibeIDE dashboard
- your existing code-server port, usually `8080/tcp`

Keep SSH on `22/tcp` open only to your own IP if you need server access.

## Port Binding

By default, Docker publishes dashboard and bundled code-server on all network interfaces:

```bash
DASHBOARD_HOST=0.0.0.0
BUNDLED_CODE_SERVER_HOST=0.0.0.0
```

For a more locked-down setup behind SSH tunnels or a reverse proxy, bind to localhost only:

```bash
DASHBOARD_HOST=127.0.0.1
BUNDLED_CODE_SERVER_HOST=127.0.0.1
```

## Release Checklist

Before sharing a release, verify the bundled install path on a fresh Ubuntu server:

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/vibe-dashboard/main/install.sh | bash
docker compose ps
docker compose logs
```

Confirm:

- Dashboard opens at `http://SERVER_IP:3000`.
- IDE opens at `http://SERVER_IP:8080`.
- The generated code-server password works.
- `codex --version` works in the IDE terminal.
- A project created in the dashboard appears in code-server.
- A file created in code-server appears in the dashboard.

## Security Notes

VibeIDE does not add dashboard authentication yet. Do not expose it broadly on the public internet.

For now:

- Set a strong `CODE_SERVER_PASSWORD`.
- Restrict AWS/security-group inbound rules to your own IP when possible.
- Do not commit `.env`, `workspaces/`, or `config/code-server/`.
- Use a reverse proxy with HTTPS before treating this as a public service.

## Docker Image Notes

The dashboard image is optimized enough for MVP use: it uses a slim Node base image, excludes local workspace/config data from the build context, and clears the npm cache after install.

Bundled IDE mode uses a custom code-server image from [docker/code-server/Dockerfile](docker/code-server/Dockerfile). It starts from the public code-server image and adds the basic tools needed on a fresh server, including Node.js LTS, npm, Python, build tools, and the Codex CLI. Dashboard-only mode does not use this image.

A future production optimization is to compile the backend to plain JavaScript and remove the `tsx` runtime from the image. That would reduce image size further, but it is intentionally deferred to avoid destabilizing the current installer.

## Troubleshooting

If Docker build fails during `apt-get update` with a message like `File has unexpected size` or `Mirror sync in progress`, wait a minute and retry the build without cache:

```bash
sudo docker compose build --no-cache
```

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

# VibeIDE Dashboard

A small local control panel for a self-hosted code-server machine.

The dashboard runs on the same Ubuntu server as code-server and manages project folders inside `/home/ubuntu/projects`.

## MVP Features

- List project folders in `/home/ubuntu/projects`.
- Create a new project folder.
- Delete a project folder after browser confirmation.
- Browse a project's top-level files and folders in the dashboard.
- Preview text files in the dashboard without editing them.
- Show CPU, memory, disk, uptime, and platform details.
- Open code-server with an `Open IDE` button.
- Open a specific project in code-server from the project row.

## Install

```bash
npm install
```

## Run In Development

Set `SERVER_IP` to your Ubuntu server IP so the `Open IDE` button points to code-server on port `8080`.

```bash
export SERVER_IP=your-server-ip
npm run dev
```

Open the dashboard:

```text
http://your-server-ip:3000
```

If `SERVER_IP` is omitted, the browser uses the dashboard hostname with port `8080`.

```text
http://current-dashboard-hostname:8080
```

For custom code-server URLs, set `CODE_SERVER_URL` instead.

```bash
export CODE_SERVER_URL=https://your-code-server-url
```

## Production Build

```bash
npm run build
npm run start
```

The backend serves the built frontend and API from:

```text
http://your-server-ip:3000
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

This MVP only uses `/home/ubuntu/projects` as its project root. Project names and file paths are validated before filesystem operations, and delete requests remove only direct child folders of `/home/ubuntu/projects`. File previews are read-only, limited to small text files, and skip binary files.

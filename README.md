# Vibe Dashboard

A small local dashboard for managing projects on an Ubuntu code-server machine.

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

## Environment

`.env.example` documents the supported local settings. Export values in your shell before starting the app when you need overrides.

```bash
export PORT=3000
export PROJECTS_ROOT=/home/ubuntu/projects
```

`PROJECTS_ROOT` should stay inside `/home/ubuntu/projects` unless the backend is intentionally expanded to allow another safe root.

## Scripts

```bash
npm run dev       # start frontend and backend
npm run build     # type-check and build the frontend
npm run start     # run the backend and serve dist/
npm run test      # run tests
npm run lint      # run ESLint
```

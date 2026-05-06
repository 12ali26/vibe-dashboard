import path from "node:path";

const defaultProjectsRoot = "/home/ubuntu/projects";

export function getPort(): number {
  return Number.parseInt(process.env.PORT ?? "3000", 10);
}

export function getProjectsRoot(): string {
  return path.resolve(process.env.WORKSPACES_DIR?.trim() || defaultProjectsRoot);
}

export function getCodeServerUrl(): string {
  const configuredUrl = process.env.CODE_SERVER_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  const serverIp = process.env.SERVER_IP?.trim();
  const codeServerPort = process.env.CODE_SERVER_PORT?.trim() || "8080";

  if (serverIp) {
    return `http://${serverIp}:${codeServerPort}`;
  }

  return "";
}

export function getCodeServerPort(): number {
  return Number.parseInt(process.env.CODE_SERVER_PORT ?? "8080", 10);
}

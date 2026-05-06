const defaultProjectsRoot = "/home/ubuntu/projects";

export function getPort(): number {
  return Number.parseInt(process.env.PORT ?? "3000", 10);
}

export function getProjectsRoot(): string {
  return defaultProjectsRoot;
}

export function getCodeServerUrl(): string {
  const configuredUrl = process.env.CODE_SERVER_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  const serverIp = process.env.SERVER_IP?.trim();

  if (serverIp) {
    return `http://${serverIp}:8080`;
  }

  return "";
}

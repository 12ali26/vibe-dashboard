import path from "node:path";

const defaultProjectsRoot = "/home/ubuntu/projects";

export function getPort(): number {
  return Number.parseInt(process.env.PORT ?? "3000", 10);
}

export function getProjectsRoot(): string {
  const configuredRoot = process.env.PROJECTS_ROOT ?? defaultProjectsRoot;
  const resolvedRoot = path.resolve(configuredRoot);
  const allowedRoot = path.resolve(defaultProjectsRoot);

  if (resolvedRoot !== allowedRoot && !resolvedRoot.startsWith(`${allowedRoot}${path.sep}`)) {
    throw new Error(`PROJECTS_ROOT must be inside ${allowedRoot}`);
  }

  return resolvedRoot;
}

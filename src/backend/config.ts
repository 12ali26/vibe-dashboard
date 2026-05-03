import path from "node:path";

const defaultProjectsRoot = "/home/ubuntu/projects";
const allowedHomeRoot = "/home/ubuntu";
const blockedRootPaths = new Set([
  "/",
  "/bin",
  "/boot",
  "/dev",
  "/etc",
  "/lib",
  "/lib64",
  "/opt",
  "/proc",
  "/root",
  "/run",
  "/sbin",
  "/srv",
  "/sys",
  "/tmp",
  "/usr",
  "/var",
  "/home/ubuntu/.ssh",
  "/home/ubuntu/.config",
  "/home/ubuntu/.cache",
  "/home/ubuntu/.local",
  "/home/ubuntu/.npm",
  "/home/ubuntu/.codex"
]);

export function getPort(): number {
  return Number.parseInt(process.env.PORT ?? "3000", 10);
}

function assertSafeWorkspaceRoot(root: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedHomeRoot = path.resolve(allowedHomeRoot);

  const isBlocked = Array.from(blockedRootPaths).some(
    (blockedPath) => resolvedRoot === blockedPath || resolvedRoot.startsWith(`${blockedPath}${path.sep}`)
  );

  if (isBlocked) {
    throw new Error(`Workspace root is not allowed: ${resolvedRoot}`);
  }

  if (resolvedRoot !== resolvedHomeRoot && !resolvedRoot.startsWith(`${resolvedHomeRoot}${path.sep}`)) {
    throw new Error(`Workspace roots must be inside ${resolvedHomeRoot}`);
  }

  return resolvedRoot;
}

export function getWorkspaceRoots(): string[] {
  const configuredRoots = process.env.WORKSPACE_ROOTS ?? process.env.PROJECTS_ROOT ?? defaultProjectsRoot;
  const roots = configuredRoots
    .split(",")
    .map((root) => root.trim())
    .filter(Boolean)
    .map(assertSafeWorkspaceRoot);

  return Array.from(new Set(roots));
}

export function getProjectsRoot(): string {
  return getWorkspaceRoots()[0] ?? defaultProjectsRoot;
}

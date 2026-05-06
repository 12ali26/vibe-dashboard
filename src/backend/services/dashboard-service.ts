import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type {
  DashboardResponse,
  ProjectFileContentResponse,
  ProjectFileEntry,
  ProjectFilesResponse,
  ProjectSummary,
  SystemSummary
} from "../../shared/types";
import { getCodeServerUrl, getProjectsRoot } from "../config";

const execFileAsync = promisify(execFile);
const bytesPerKilobyte = 1024;
const maxPreviewFileBytes = 256 * 1024;
const ignoredDirectoryNames = new Set([
  ".cache",
  ".codex",
  ".config",
  ".local",
  ".npm",
  ".ssh",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".venv",
  "__pycache__",
  "logs"
]);

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function detectProjectType(projectPath: string): Promise<ProjectSummary["type"]> {
  const [hasPackageJson, hasPyproject, hasRequirements, hasVenv, hasIndexHtml] = await Promise.all([
    pathExists(path.join(projectPath, "package.json")),
    pathExists(path.join(projectPath, "pyproject.toml")),
    pathExists(path.join(projectPath, "requirements.txt")),
    pathExists(path.join(projectPath, ".venv")),
    pathExists(path.join(projectPath, "index.html"))
  ]);

  if (hasPackageJson) {
    return "node";
  }

  if (hasPyproject || hasRequirements || hasVenv) {
    return "python";
  }

  if (hasIndexHtml) {
    return "web";
  }

  return "unknown";
}

function getDevCommands(type: ProjectSummary["type"]): string[] {
  if (type === "node") {
    return ["npm install", "npm run dev"];
  }

  if (type === "python") {
    return ["source .venv/bin/activate", "python app.py"];
  }

  if (type === "web") {
    return ["python3 -m http.server 8000"];
  }

  return [];
}

async function getGitSummary(projectPath: string): Promise<ProjectSummary["git"]> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", projectPath, "status", "--short", "--branch"], {
      timeout: 3000
    });
    const lines = stdout.trim().split("\n").filter(Boolean);
    const branchLine = lines[0] ?? "## unknown";
    const branch = branchLine.replace(/^##\s*/, "").split("...")[0] || "unknown";
    const changedFiles = Math.max(lines.length - 1, 0);

    return {
      branch,
      hasChanges: changedFiles > 0,
      changedFiles
    };
  } catch {
    return {
      branch: "unknown",
      hasChanges: false,
      changedFiles: 0
    };
  }
}

async function listProjects(projectsRoot: string): Promise<ProjectSummary[]> {
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true }).catch(() => []);
  const directories = entries
    .filter((entry) => entry.isDirectory() && !ignoredDirectoryNames.has(entry.name))
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));

  return Promise.all(
    directories.map(async (entry) => {
      const projectPath = path.join(projectsRoot, entry.name);
      const hasGit = await pathExists(path.join(projectPath, ".git"));
      const type = await detectProjectType(projectPath);

      return {
        name: entry.name,
        path: projectPath,
        root: projectsRoot,
        type,
        devCommands: getDevCommands(type),
        hasGit,
        git: hasGit ? await getGitSummary(projectPath) : undefined
      };
    })
  );
}

function assertSafeProjectName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Project name is required.");
  }

  if (trimmedName.length > 80) {
    throw new Error("Project name must be 80 characters or less.");
  }

  if (trimmedName === "." || trimmedName === ".." || trimmedName.startsWith(".")) {
    throw new Error("Project name cannot be hidden or relative.");
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(trimmedName)) {
    throw new Error("Project name can only use letters, numbers, dots, underscores, and hyphens.");
  }

  return trimmedName;
}

function getProjectPath(projectName: string): string {
  const projectsRoot = getProjectsRoot();
  const resolvedRoot = path.resolve(projectsRoot);
  const resolvedProjectPath = path.resolve(resolvedRoot, projectName);

  if (path.dirname(resolvedProjectPath) !== resolvedRoot) {
    throw new Error("Project path must stay inside the projects folder.");
  }

  return resolvedProjectPath;
}

function assertSafeRelativePath(relativePath: string): string {
  const normalizedPath = path.normalize(relativePath.trim());

  if (!relativePath.trim() || normalizedPath === ".") {
    return "";
  }

  if (path.isAbsolute(normalizedPath) || normalizedPath === ".." || normalizedPath.startsWith(`..${path.sep}`)) {
    throw new Error("File path must stay inside the project folder.");
  }

  return normalizedPath;
}

function getProjectChildPath(projectPath: string, relativePath: string): string {
  const safeRelativePath = assertSafeRelativePath(relativePath);
  const resolvedProjectPath = path.resolve(projectPath);
  const resolvedChildPath = path.resolve(resolvedProjectPath, safeRelativePath);

  if (resolvedChildPath !== resolvedProjectPath && !resolvedChildPath.startsWith(`${resolvedProjectPath}${path.sep}`)) {
    throw new Error("File path must stay inside the project folder.");
  }

  return resolvedChildPath;
}

function toRelativeProjectPath(projectPath: string, targetPath: string): string {
  return path.relative(projectPath, targetPath);
}

async function toProjectFileEntry(projectPath: string, entryPath: string, name: string): Promise<ProjectFileEntry | null> {
  const stats = await fs.lstat(entryPath);

  if (stats.isSymbolicLink()) {
    return null;
  }

  const isDirectory = stats.isDirectory();

  if (!isDirectory && !stats.isFile()) {
    return null;
  }

  return {
    name,
    path: toRelativeProjectPath(projectPath, entryPath),
    type: isDirectory ? "directory" : "file",
    sizeBytes: isDirectory ? null : stats.size,
    updatedAt: stats.mtime.toISOString()
  };
}

export async function createProject(name: string): Promise<ProjectSummary> {
  const projectName = assertSafeProjectName(name);
  const projectPath = getProjectPath(projectName);

  await fs.mkdir(projectPath);

  return {
    name: projectName,
    path: projectPath,
    root: getProjectsRoot(),
    type: "unknown",
    devCommands: [],
    hasGit: false
  };
}

export async function deleteProject(name: string): Promise<void> {
  const projectName = assertSafeProjectName(name);
  const projectPath = getProjectPath(projectName);
  const stats = await fs.lstat(projectPath);

  if (!stats.isDirectory()) {
    throw new Error("Only project folders can be deleted.");
  }

  await fs.rm(projectPath, {
    recursive: true,
    force: false
  });
}

export async function listProjectFiles(projectName: string, relativePath: string): Promise<ProjectFilesResponse> {
  const safeProjectName = assertSafeProjectName(projectName);
  const projectPath = getProjectPath(safeProjectName);
  const targetPath = getProjectChildPath(projectPath, relativePath);
  const targetStats = await fs.lstat(targetPath);

  if (!targetStats.isDirectory()) {
    throw new Error("Only folders can be browsed.");
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const visibleEntries = entries
    .filter((entry) => !entry.name.startsWith("."))
    .filter((entry) => !ignoredDirectoryNames.has(entry.name))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

  const fileEntries = await Promise.all(
    visibleEntries.map((entry) => toProjectFileEntry(projectPath, path.join(targetPath, entry.name), entry.name))
  );
  const currentPath = toRelativeProjectPath(projectPath, targetPath);
  const parentPath = currentPath ? path.dirname(currentPath) : null;

  return {
    projectName: safeProjectName,
    projectPath,
    currentPath,
    parentPath: parentPath === "." ? "" : parentPath,
    entries: fileEntries.filter((entry): entry is ProjectFileEntry => entry !== null)
  };
}

export async function getProjectFileContent(projectName: string, relativePath: string): Promise<ProjectFileContentResponse> {
  const safeProjectName = assertSafeProjectName(projectName);
  const projectPath = getProjectPath(safeProjectName);
  const filePath = getProjectChildPath(projectPath, relativePath);
  const stats = await fs.lstat(filePath);

  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error("Only regular files can be previewed.");
  }

  if (stats.size > maxPreviewFileBytes) {
    throw new Error("File is too large to preview.");
  }

  const buffer = await fs.readFile(filePath);

  if (buffer.includes(0)) {
    throw new Error("Binary files cannot be previewed.");
  }

  return {
    projectName: safeProjectName,
    projectPath,
    filePath: toRelativeProjectPath(projectPath, filePath),
    name: path.basename(filePath),
    sizeBytes: stats.size,
    updatedAt: stats.mtime.toISOString(),
    content: buffer.toString("utf8")
  };
}

type CpuSnapshot = {
  idle: number;
  total: number;
};

async function getCpuSnapshot(): Promise<CpuSnapshot> {
  const stat = await fs.readFile("/proc/stat", "utf8");
  const cpuLine = stat.split("\n")[0] ?? "";
  const values = cpuLine
    .replace("cpu", "")
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));
  const idle = (values[3] ?? 0) + (values[4] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);

  return { idle, total };
}

async function getCpuUsagePercent(): Promise<number> {
  try {
    const before = await getCpuSnapshot();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    const after = await getCpuSnapshot();
    const idleDifference = after.idle - before.idle;
    const totalDifference = after.total - before.total;

    if (totalDifference <= 0) {
      return 0;
    }

    return Math.round((1 - idleDifference / totalDifference) * 100);
  } catch {
    const loadAverage = os.loadavg()[0] ?? 0;

    return Math.min(100, Math.round((loadAverage / os.cpus().length) * 100));
  }
}

async function getDiskSummary(projectsRoot: string): Promise<SystemSummary["disk"]> {
  try {
    const { stdout } = await execFileAsync("df", ["-k", projectsRoot], { timeout: 3000 });
    const line = stdout.trim().split("\n")[1];

    if (!line) {
      throw new Error("Missing df output");
    }

    const columns = line.trim().split(/\s+/);
    const totalBytes = Number.parseInt(columns[1] ?? "0", 10) * bytesPerKilobyte;
    const usedBytes = Number.parseInt(columns[2] ?? "0", 10) * bytesPerKilobyte;
    const freeBytes = Number.parseInt(columns[3] ?? "0", 10) * bytesPerKilobyte;
    const usagePercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

    return {
      path: projectsRoot,
      totalBytes,
      usedBytes,
      freeBytes,
      usagePercent
    };
  } catch {
    return {
      path: projectsRoot,
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      usagePercent: 0
    };
  }
}

async function getSystemSummary(projectsRoot: string): Promise<SystemSummary> {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;

  return {
    platform: os.platform(),
    uptimeSeconds: Math.round(os.uptime()),
    cpuUsagePercent: await getCpuUsagePercent(),
    memory: {
      totalBytes,
      freeBytes,
      usedBytes,
      usagePercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0
    },
    disk: await getDiskSummary(projectsRoot),
    cpuCount: os.cpus().length
  };
}

export async function getDashboard(): Promise<DashboardResponse> {
  const projectsRoot = getProjectsRoot();
  const projects = await listProjects(projectsRoot);

  return {
    projectsRoot,
    projects,
    system: await getSystemSummary(projectsRoot),
    codeServerUrl: getCodeServerUrl(),
    updatedAt: new Date().toISOString()
  };
}

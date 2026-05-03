import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { DashboardResponse, ProjectSummary, SystemSummary } from "../../shared/types";
import { getWorkspaceRoots } from "../config";

const execFileAsync = promisify(execFile);
const bytesPerKilobyte = 1024;
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
  const workspaceRoots = getWorkspaceRoots();
  const projectGroups = await Promise.all(
    workspaceRoots.map(async (root) => ({
      root,
      projects: await listProjects(root)
    }))
  );
  const projects = projectGroups.flatMap((group) => group.projects);
  const primaryRoot = workspaceRoots[0] ?? "/home/ubuntu/projects";

  return {
    projectsRoot: primaryRoot,
    workspaceRoots,
    projectGroups,
    projects,
    system: await getSystemSummary(primaryRoot),
    updatedAt: new Date().toISOString()
  };
}

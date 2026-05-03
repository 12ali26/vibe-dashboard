import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { DashboardResponse, ProjectSummary, SystemSummary } from "../../shared/types";
import { getProjectsRoot } from "../config";

const execFileAsync = promisify(execFile);

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function detectProjectType(projectPath: string): Promise<ProjectSummary["type"]> {
  const [hasPackageJson, hasPyproject, hasRequirements, hasIndexHtml] = await Promise.all([
    pathExists(path.join(projectPath, "package.json")),
    pathExists(path.join(projectPath, "pyproject.toml")),
    pathExists(path.join(projectPath, "requirements.txt")),
    pathExists(path.join(projectPath, "index.html"))
  ]);

  if (hasPackageJson) {
    return "node";
  }

  if (hasPyproject || hasRequirements) {
    return "python";
  }

  if (hasIndexHtml) {
    return "web";
  }

  return "unknown";
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
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  return Promise.all(
    directories.map(async (entry) => {
      const projectPath = path.join(projectsRoot, entry.name);
      const hasGit = await pathExists(path.join(projectPath, ".git"));

      return {
        name: entry.name,
        path: projectPath,
        type: await detectProjectType(projectPath),
        hasGit,
        git: hasGit ? await getGitSummary(projectPath) : undefined
      };
    })
  );
}

function getSystemSummary(): SystemSummary {
  return {
    platform: os.platform(),
    uptimeSeconds: Math.round(os.uptime()),
    memory: {
      totalBytes: os.totalmem(),
      freeBytes: os.freemem()
    },
    cpuCount: os.cpus().length
  };
}

export async function getDashboard(): Promise<DashboardResponse> {
  const projectsRoot = getProjectsRoot();

  return {
    projectsRoot,
    projects: await listProjects(projectsRoot),
    system: getSystemSummary(),
    updatedAt: new Date().toISOString()
  };
}

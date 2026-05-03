import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { DashboardResponse, ProjectSummary, SystemSummary } from "../../shared/types";
import { getProjectsRoot } from "../config";

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
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

      return {
        name: entry.name,
        path: projectPath,
        hasGit: await pathExists(path.join(projectPath, ".git"))
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
    system: getSystemSummary()
  };
}

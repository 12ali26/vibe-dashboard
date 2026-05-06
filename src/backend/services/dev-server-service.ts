import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { DevServerSummary } from "../../shared/types";
import { assertSafeProjectName, getProjectPath } from "./dashboard-service";

type DevServerRecord = {
  projectName: string;
  command: string;
  child: ChildProcessWithoutNullStreams | null;
  status: DevServerSummary["status"];
  pid: number | null;
  startedAt: string | null;
  stoppedAt: string | null;
  exitCode: number | null;
  logs: string[];
};

const devServers = new Map<string, DevServerRecord>();
const maxLogLines = 200;

function appendLog(record: DevServerRecord, chunk: Buffer): void {
  const lines = chunk
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);

  record.logs.push(...lines);

  if (record.logs.length > maxLogLines) {
    record.logs.splice(0, record.logs.length - maxLogLines);
  }
}

function toSummary(record: DevServerRecord): DevServerSummary {
  return {
    projectName: record.projectName,
    command: record.command,
    status: record.status,
    pid: record.pid,
    startedAt: record.startedAt,
    stoppedAt: record.stoppedAt,
    exitCode: record.exitCode,
    logs: record.logs
  };
}

function getStoppedSummary(projectName: string): DevServerSummary {
  return {
    projectName,
    command: "npm run dev",
    status: "stopped",
    pid: null,
    startedAt: null,
    stoppedAt: null,
    exitCode: null,
    logs: []
  };
}

async function assertCanRunNpmDev(projectPath: string): Promise<void> {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };

  if (!packageJson.scripts?.dev) {
    throw new Error("This project does not have an npm dev script.");
  }
}

export function getDevServer(projectName: string): DevServerSummary {
  const safeProjectName = assertSafeProjectName(projectName);
  const record = devServers.get(safeProjectName);

  return record ? toSummary(record) : getStoppedSummary(safeProjectName);
}

export async function startDevServer(projectName: string): Promise<DevServerSummary> {
  const safeProjectName = assertSafeProjectName(projectName);
  const existingRecord = devServers.get(safeProjectName);

  if (existingRecord?.status === "running") {
    return toSummary(existingRecord);
  }

  const projectPath = getProjectPath(safeProjectName);

  await assertCanRunNpmDev(projectPath);

  const record: DevServerRecord = {
    projectName: safeProjectName,
    command: "npm run dev",
    child: null,
    status: "running",
    pid: null,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    exitCode: null,
    logs: []
  };
  const child = spawn("npm", ["run", "dev"], {
    cwd: projectPath,
    env: process.env
  });

  record.child = child;
  record.pid = child.pid ?? null;
  child.stdout.on("data", (chunk: Buffer) => appendLog(record, chunk));
  child.stderr.on("data", (chunk: Buffer) => appendLog(record, chunk));
  child.on("exit", (code) => {
    record.status = "stopped";
    record.pid = null;
    record.stoppedAt = new Date().toISOString();
    record.exitCode = code;
    record.child = null;
  });

  devServers.set(safeProjectName, record);

  return toSummary(record);
}

export function stopDevServer(projectName: string): DevServerSummary {
  const safeProjectName = assertSafeProjectName(projectName);
  const record = devServers.get(safeProjectName);

  if (!record || record.status === "stopped" || !record.child) {
    return record ? toSummary(record) : getStoppedSummary(safeProjectName);
  }

  record.child.kill("SIGTERM");

  setTimeout(() => {
    if (record.status === "running" && record.child) {
      record.child.kill("SIGKILL");
    }
  }, 3000);

  return toSummary(record);
}

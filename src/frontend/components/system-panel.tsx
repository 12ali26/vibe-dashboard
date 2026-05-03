import type { SystemSummary } from "../../shared/types";

type SystemPanelProps = {
  system: SystemSummary;
};

function formatBytes(bytes: number): string {
  const gibibytes = bytes / 1024 / 1024 / 1024;

  return `${gibibytes.toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

export function SystemPanel({ system }: SystemPanelProps) {
  const usedMemory = system.memory.totalBytes - system.memory.freeBytes;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>System</h2>
        <span>{system.platform}</span>
      </div>

      <dl className="stat-grid">
        <div>
          <dt>CPU cores</dt>
          <dd>{system.cpuCount}</dd>
        </div>
        <div>
          <dt>Memory used</dt>
          <dd>{formatBytes(usedMemory)}</dd>
        </div>
        <div>
          <dt>Memory free</dt>
          <dd>{formatBytes(system.memory.freeBytes)}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>{formatUptime(system.uptimeSeconds)}</dd>
        </div>
      </dl>
    </section>
  );
}

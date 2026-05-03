import type { SystemSummary } from "../../shared/types";

type SystemPanelProps = {
  system: SystemSummary;
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return "Unknown";
  }

  const gibibytes = bytes / 1024 / 1024 / 1024;

  return `${gibibytes.toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

export function SystemPanel({ system }: SystemPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>System</h2>
        <span>{system.platform}</span>
      </div>

      <dl className="stat-grid">
        <div className="stat-card">
          <dt>CPU usage</dt>
          <dd>{system.cpuUsagePercent}%</dd>
          <span>{system.cpuCount} cores</span>
          <meter min="0" max="100" value={system.cpuUsagePercent} />
        </div>
        <div className="stat-card">
          <dt>Memory</dt>
          <dd>{system.memory.usagePercent}%</dd>
          <span>
            {formatBytes(system.memory.usedBytes)} / {formatBytes(system.memory.totalBytes)}
          </span>
          <meter min="0" max="100" value={system.memory.usagePercent} />
        </div>
        <div className="stat-card">
          <dt>Disk</dt>
          <dd>{system.disk.usagePercent}%</dd>
          <span>
            {formatBytes(system.disk.usedBytes)} / {formatBytes(system.disk.totalBytes)}
          </span>
          <meter min="0" max="100" value={system.disk.usagePercent} />
        </div>
        <div className="stat-card">
          <dt>Uptime</dt>
          <dd>{formatUptime(system.uptimeSeconds)}</dd>
          <span>{system.disk.path}</span>
        </div>
      </dl>
    </section>
  );
}

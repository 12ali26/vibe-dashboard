import { useCallback, useEffect, useState } from "react";
import type { DevServerSummary, ProjectSummary } from "../../shared/types";
import { getDevServer, startDevServer, stopDevServer } from "../api/client";

type DevServerPanelProps = {
  project: ProjectSummary;
};

export function DevServerPanel({ project }: DevServerPanelProps) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "loaded"; data: DevServerSummary }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [isMutating, setIsMutating] = useState(false);

  const loadStatus = useCallback(async (): Promise<void> => {
    try {
      setState({ status: "loaded", data: await getDevServer(project.name) });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load dev server status." });
    }
  }, [project.name]);

  async function runAction(action: "start" | "stop"): Promise<void> {
    setIsMutating(true);

    try {
      const data = action === "start" ? await startDevServer(project.name) : await stopDevServer(project.name);
      setState({ status: "loaded", data });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : `Unable to ${action} dev server.` });
    } finally {
      setIsMutating(false);
    }
  }

  useEffect(() => {
    void loadStatus();

    const interval = window.setInterval(() => {
      void loadStatus();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [loadStatus]);

  const canStart = project.type === "node" && state.status === "loaded" && state.data.status === "stopped";
  const canStop = state.status === "loaded" && state.data.status === "running";

  return (
    <section className="dev-server-panel">
      <div className="dev-server-header">
        <div>
          <h3>Dev server</h3>
          <p>{project.type === "node" ? "npm run dev" : "Only Node projects are supported for now."}</p>
        </div>
        <div className="dev-server-actions">
          <button type="button" onClick={() => void loadStatus()} disabled={isMutating}>
            Refresh
          </button>
          <button type="button" onClick={() => void runAction("start")} disabled={isMutating || !canStart}>
            Start
          </button>
          <button type="button" onClick={() => void runAction("stop")} disabled={isMutating || !canStop}>
            Stop
          </button>
        </div>
      </div>

      {state.status === "loading" ? <p className="empty-state">Loading dev server status...</p> : null}
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      {state.status === "loaded" ? (
        <>
          <div className="dev-server-status">
            <span className={state.data.status === "running" ? "status-pill status-ok" : "status-pill"}>
              {state.data.status}
            </span>
            <span>PID: {state.data.pid ?? "-"}</span>
            <span>Exit: {state.data.exitCode ?? "-"}</span>
          </div>
          <pre className="dev-log">
            {state.data.logs.length > 0 ? state.data.logs.join("\n") : "No logs yet."}
          </pre>
        </>
      ) : null}
    </section>
  );
}

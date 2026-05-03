import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardResponse } from "../../shared/types";
import { getDashboard } from "../api/client";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { ProjectList } from "../components/project-list";
import { SystemPanel } from "../components/system-panel";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: DashboardResponse }
  | { status: "error"; message: string };

export function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRequestActive = useRef(false);

  const loadDashboard = useCallback((showLoading: boolean) => {
    if (isRequestActive.current) {
      return Promise.resolve();
    }

    isRequestActive.current = true;

    if (showLoading) {
      setState({ status: "loading" });
    } else {
      setIsRefreshing(true);
    }

    return getDashboard()
      .then((data) => {
        setState({ status: "loaded", data });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to load dashboard data.";
        setState({ status: "error", message });
      })
      .finally(() => {
        isRequestActive.current = false;
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    void loadDashboard(true);

    const refreshInterval = window.setInterval(() => {
      void loadDashboard(false);
    }, 10000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadDashboard]);

  if (state.status === "loading") {
    return <LoadingState />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local control panel</p>
          <h1>Vibe Dashboard</h1>
        </div>
        <div className="header-actions">
          <p className="root-path">{state.data.workspaceRoots.join(", ")}</p>
          <button className="refresh-button" type="button" onClick={() => void loadDashboard(false)} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </header>

      <section className="dashboard-grid" aria-label="Dashboard overview">
        <SystemPanel system={state.data.system} />
        <ProjectList projectGroups={state.data.projectGroups} updatedAt={state.data.updatedAt} />
      </section>
    </main>
  );
}

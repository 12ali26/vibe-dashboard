import { useEffect, useState } from "react";
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

  useEffect(() => {
    let isMounted = true;

    getDashboard()
      .then((data) => {
        if (isMounted) {
          setState({ status: "loaded", data });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Unable to load dashboard data.";
          setState({ status: "error", message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        <p className="root-path">{state.data.projectsRoot}</p>
      </header>

      <section className="dashboard-grid" aria-label="Dashboard overview">
        <SystemPanel system={state.data.system} />
        <ProjectList projects={state.data.projects} />
      </section>
    </main>
  );
}

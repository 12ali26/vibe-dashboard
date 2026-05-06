import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardResponse, ProjectSummary } from "../../shared/types";
import { createProject, deleteProject, getDashboard } from "../api/client";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { ProjectBrowser } from "../components/project-browser";
import { ProjectList } from "../components/project-list";
import { SystemPanel } from "../components/system-panel";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: DashboardResponse }
  | { status: "error"; message: string };

type ActiveView = "overview" | "projects" | "system";

function getOpenIdeUrl(configuredUrl: string): string {
  if (configuredUrl) {
    return configuredUrl;
  }

  return `http://${window.location.hostname}:8080`;
}

export function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectActionError, setProjectActionError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
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

  const handleCreateProject = useCallback(
    async (name: string) => {
      setIsSavingProject(true);
      setProjectActionError(null);

      try {
        await createProject(name);
        await loadDashboard(false);
      } catch (error) {
        setProjectActionError(error instanceof Error ? error.message : "Unable to create project.");
      } finally {
        setIsSavingProject(false);
      }
    },
    [loadDashboard]
  );

  const handleDeleteProject = useCallback(
    async (name: string) => {
      setIsSavingProject(true);
      setProjectActionError(null);

      try {
        await deleteProject(name);
        await loadDashboard(false);
      } catch (error) {
        setProjectActionError(error instanceof Error ? error.message : "Unable to delete project.");
      } finally {
        setIsSavingProject(false);
      }
    },
    [loadDashboard]
  );

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

  const projectCount = state.data.projects.length;
  const gitRepoCount = state.data.projects.filter((project) => project.hasGit).length;
  const dirtyRepoCount = state.data.projects.filter((project) => project.git?.hasChanges).length;
  const nodeProjectCount = state.data.projects.filter((project) => project.type === "node").length;
  const pythonProjectCount = state.data.projects.filter((project) => project.type === "python").length;
  const openIdeUrl = getOpenIdeUrl(state.data.codeServerUrl);

  function selectProject(project: ProjectSummary): void {
    setSelectedProject(project);
    setActiveView("projects");
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local control panel</p>
          <h1>Vibe Dashboard</h1>
        </div>
        <div className="header-actions">
          <p className="root-path">{state.data.projectsRoot}</p>
          <button className="refresh-button" type="button" onClick={() => void loadDashboard(false)} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
          <a className="ide-button" href={openIdeUrl} target="_blank" rel="noreferrer">
            Open IDE
          </a>
        </div>
      </header>

      <nav className="app-nav" aria-label="Dashboard navigation">
        <button
          className={activeView === "overview" ? "active" : ""}
          type="button"
          onClick={() => {
            setSelectedProject(null);
            setActiveView("overview");
          }}
        >
          Overview
        </button>
        <button
          className={activeView === "projects" ? "active" : ""}
          type="button"
          onClick={() => {
            setSelectedProject(null);
            setActiveView("projects");
          }}
        >
          Projects
        </button>
        <button
          className={activeView === "system" ? "active" : ""}
          type="button"
          onClick={() => {
            setSelectedProject(null);
            setActiveView("system");
          }}
        >
          System
        </button>
      </nav>

      {activeView === "overview" ? (
        <>
          <section className="summary-grid" aria-label="Workspace summary">
            <article className="summary-card">
              <span>Projects</span>
              <strong>{projectCount}</strong>
            </article>
            <article className="summary-card">
              <span>Git repos</span>
              <strong>{gitRepoCount}</strong>
            </article>
            <article className="summary-card">
              <span>Dirty repos</span>
              <strong>{dirtyRepoCount}</strong>
            </article>
            <article className="summary-card">
              <span>Node / Python</span>
              <strong>
                {nodeProjectCount} / {pythonProjectCount}
              </strong>
            </article>
          </section>
          <section className="dashboard-grid" aria-label="Dashboard overview">
            <SystemPanel system={state.data.system} />
            {selectedProject ? (
              <ProjectBrowser codeServerUrl={openIdeUrl} project={selectedProject} onBack={() => setSelectedProject(null)} />
            ) : (
              <ProjectList
                codeServerUrl={openIdeUrl}
                projects={state.data.projects}
                projectsRoot={state.data.projectsRoot}
                updatedAt={state.data.updatedAt}
                isSaving={isSavingProject}
                errorMessage={projectActionError}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onSelectProject={selectProject}
              />
            )}
          </section>
        </>
      ) : null}

      {activeView === "projects" && selectedProject ? (
        <ProjectBrowser codeServerUrl={openIdeUrl} project={selectedProject} onBack={() => setSelectedProject(null)} />
      ) : null}

      {activeView === "projects" && !selectedProject ? (
        <ProjectList
          codeServerUrl={openIdeUrl}
          projects={state.data.projects}
          projectsRoot={state.data.projectsRoot}
          updatedAt={state.data.updatedAt}
          isSaving={isSavingProject}
          errorMessage={projectActionError}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={selectProject}
        />
      ) : null}

      {activeView === "system" ? <SystemPanel system={state.data.system} /> : null}
    </main>
  );
}

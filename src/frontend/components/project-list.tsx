import type { ProjectSummary } from "../../shared/types";

type ProjectListProps = {
  projects: ProjectSummary[];
};

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <section className="panel project-panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <span>{projects.length}</span>
      </div>

      {projects.length === 0 ? (
        <p className="empty-state">No project folders found.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.path} className="project-row">
              <div>
                <h3>{project.name}</h3>
                <p>{project.path}</p>
              </div>
              <span className={project.hasGit ? "status-pill status-ok" : "status-pill"}>
                {project.hasGit ? "Git" : "Folder"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

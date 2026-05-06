import { Router } from "express";
import { createProject, deleteProject, getDashboard, listProjectFiles } from "../services/dashboard-service";

export const dashboardRouter = Router();

dashboardRouter.get("/dashboard", async (_request, response, next) => {
  try {
    response.json(await getDashboard());
  } catch (error) {
    next(error);
  }
});

dashboardRouter.post("/projects", async (request, response, next) => {
  try {
    const name = typeof request.body?.name === "string" ? request.body.name : "";
    const project = await createProject(name);

    response.status(201).json(project);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      response.status(409).json({ error: "A project with that name already exists." });
      return;
    }

    next(error);
  }
});

dashboardRouter.get("/projects/:name/files", async (request, response, next) => {
  try {
    const relativePath = typeof request.query.path === "string" ? request.query.path : "";

    response.json(await listProjectFiles(request.params.name, relativePath));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      response.status(404).json({ error: "Project folder was not found." });
      return;
    }

    next(error);
  }
});

dashboardRouter.delete("/projects/:name", async (request, response, next) => {
  try {
    await deleteProject(request.params.name);
    response.status(204).send();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      response.status(404).json({ error: "Project folder was not found." });
      return;
    }

    next(error);
  }
});

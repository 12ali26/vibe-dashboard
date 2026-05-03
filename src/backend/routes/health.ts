import { Router } from "express";
import type { HealthResponse } from "../../shared/types";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  const body: HealthResponse = {
    ok: true,
    service: "vibe-dashboard"
  };

  response.json(body);
});

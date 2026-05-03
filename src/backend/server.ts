import fs from "node:fs";
import path from "node:path";
import express from "express";
import { getPort } from "./config";
import { dashboardRouter } from "./routes/dashboard";
import { healthRouter } from "./routes/health";

const app = express();
const frontendDistPath = path.resolve("dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", dashboardRouter);

app.use(express.static(frontendDistPath));

app.get("*", (_request, response) => {
  if (fs.existsSync(frontendIndexPath)) {
    response.sendFile(frontendIndexPath);
    return;
  }

  response
    .type("text")
    .send("Vibe Dashboard API is running. The frontend has not been built yet. Run npm run build.");
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";

  response.status(500).json({
    error: message
  });
});

const port = getPort();

app.listen(port, () => {
  console.log(`Vibe Dashboard API listening on http://localhost:${port}`);
});

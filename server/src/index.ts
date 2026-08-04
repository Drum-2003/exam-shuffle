import cors from "cors";
import "dotenv/config";
import express from "express";
import { pathToFileURL } from "node:url";
import { requireAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { chaptersRouter } from "./routes/chapters.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { examsRouter } from "./routes/exams.js";
import { questionsRouter } from "./routes/questions.js";
import { subjectsRouter } from "./routes/subjects.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/subjects", requireAuth, subjectsRouter);
app.use("/api/chapters", requireAuth, chaptersRouter);
app.use("/api/questions", requireAuth, questionsRouter);
app.use("/api/exams", requireAuth, examsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Có lỗi máy chủ.", detail: err.message });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(port, () => {
    console.log(`Exam shuffle API is running at http://localhost:${port}`);
  });
}

export default app;

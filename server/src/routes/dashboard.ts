import { Router } from "express";
import { prisma } from "../prisma.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res) => {
  const [subjects, chapters, questions, exams] = await Promise.all([
    prisma.subject.count(),
    prisma.chapter.count(),
    prisma.question.count(),
    prisma.exam.count(),
  ]);

  res.json({ subjects, chapters, questions, exams });
});

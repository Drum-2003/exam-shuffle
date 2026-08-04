import { Router } from "express";
import { prisma } from "../prisma.js";

export const subjectsRouter = Router();

subjectsRouter.get("/", async (_req, res) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chapters: true, questions: true, exams: true } } },
  });
  res.json(subjects);
});

subjectsRouter.post("/", async (req, res) => {
  const { code, name, description } = req.body as { code?: string; name?: string; description?: string };
  if (!code?.trim() || !name?.trim()) {
    return res.status(400).json({ message: "Mã môn và tên môn là bắt buộc." });
  }

  const subject = await prisma.subject.create({
    data: { code: code.trim(), name: name.trim(), description: description?.trim() || null },
  });
  res.status(201).json(subject);
});

subjectsRouter.put("/:id", async (req, res) => {
  const { code, name, description } = req.body as { code?: string; name?: string; description?: string };
  if (!code?.trim() || !name?.trim()) {
    return res.status(400).json({ message: "Mã môn và tên môn là bắt buộc." });
  }

  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: { code: code.trim(), name: name.trim(), description: description?.trim() || null },
  });
  res.json(subject);
});

subjectsRouter.delete("/:id", async (req, res) => {
  await prisma.subject.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

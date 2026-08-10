import { Router } from "express";
import { prisma } from "../prisma.js";

export const chaptersRouter = Router();

chaptersRouter.get("/", async (req, res) => {
  const subjectId = String(req.query.subjectId || "");
  const chapters = await prisma.chapter.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: [{ subject: { name: "asc" } }, { orderIndex: "asc" }],
    include: { subject: true, _count: { select: { questions: true } } },
  });
  res.json(chapters);
});

chaptersRouter.post("/", async (req, res) => {
  const { name, orderIndex, subjectId } = req.body as {
    name?: string;
    orderIndex?: number | string;
    subjectId?: string;
  };
  if (!name?.trim() || !subjectId) {
    return res.status(400).json({ message: "Tên chương và môn học là bắt buộc." });
  }

  const chapter = await prisma.chapter.create({
    data: { name: name.trim(), orderIndex: Number(orderIndex || 1), subjectId },
    include: { subject: true },
  });
  res.status(201).json(chapter);
});

chaptersRouter.put("/:id", async (req, res) => {
  const { name, orderIndex, subjectId } = req.body as {
    name?: string;
    orderIndex?: number | string;
    subjectId?: string;
  };
  if (!name?.trim() || !subjectId) {
    return res.status(400).json({ message: "Tên chương và môn học là bắt buộc." });
  }

  const chapter = await prisma.chapter.update({
    where: { id: req.params.id },
    data: { name: name.trim(), orderIndex: Number(orderIndex || 1), subjectId },
    include: { subject: true },
  });
  res.json(chapter);
});

chaptersRouter.delete("/:id", async (req, res) => {
  const chapter = await prisma.chapter.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!chapter) return res.status(404).json({ message: "Không tìm thấy chương." });

  const questionIds = (
    await prisma.question.findMany({
      where: { chapterId: req.params.id },
      select: { id: true },
    })
  ).map((question) => question.id);

  const examIds = questionIds.length
    ? (
        await prisma.exam.findMany({
          where: {
            codes: {
              some: {
                questions: {
                  some: {
                    questionId: { in: questionIds },
                  },
                },
              },
            },
          },
          select: { id: true },
        })
      ).map((exam) => exam.id)
    : [];

  await prisma.$transaction(async (tx) => {
    if (examIds.length) await tx.exam.deleteMany({ where: { id: { in: examIds } } });
    await tx.chapter.delete({ where: { id: req.params.id } });
  });

  res.status(204).send();
});

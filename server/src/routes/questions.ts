import type { Prisma } from "@prisma/client";
import { Router } from "express";
import multer from "multer";
import xlsx from "xlsx";
import { prisma } from "../prisma.js";
import { type Difficulty, normalizeQuestionInput, validateQuestionInput } from "../utils/questions.js";

export const questionsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });
const importHeaders = [
  "question",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctOption",
  "difficulty",
  "subjectName",
  "subjectCode",
  "chapterName",
  "chapterOrder",
];

questionsRouter.get("/", async (req, res) => {
  const search = String(req.query.search || "").trim();
  const subjectId = String(req.query.subjectId || "");
  const chapterId = String(req.query.chapterId || "");
  const difficulty = String(req.query.difficulty || "") as Difficulty;

  const questions = await prisma.question.findMany({
    where: {
      ...(search ? { content: { contains: search, mode: "insensitive" } } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(chapterId ? { chapterId } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    include: { subject: true, chapter: true, answers: { orderBy: { label: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(questions);
});

questionsRouter.post("/", async (req, res) => {
  const input = normalizeQuestionInput(req.body);
  const errors = validateQuestionInput(input);
  if (errors.length) return res.status(400).json({ message: "Câu hỏi chưa hợp lệ.", errors });

  const question = await prisma.question.create({
    data: {
      content: input.content,
      subjectId: input.subjectId,
      chapterId: input.chapterId,
      difficulty: input.difficulty as Difficulty,
      answers: { create: input.answers },
    },
    include: { subject: true, chapter: true, answers: { orderBy: { label: "asc" } } },
  });
  res.status(201).json(question);
});

questionsRouter.put("/:id", async (req, res) => {
  const input = normalizeQuestionInput(req.body);
  const errors = validateQuestionInput(input);
  if (errors.length) return res.status(400).json({ message: "Câu hỏi chưa hợp lệ.", errors });

  const question = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.answer.deleteMany({ where: { questionId: req.params.id } });
    return tx.question.update({
      where: { id: req.params.id },
      data: {
        content: input.content,
        subjectId: input.subjectId,
        chapterId: input.chapterId,
        difficulty: input.difficulty as Difficulty,
        answers: { create: input.answers },
      },
      include: { subject: true, chapter: true, answers: { orderBy: { label: "asc" } } },
    });
  });
  res.json(question);
});

questionsRouter.delete("/:id", async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

questionsRouter.get("/import-template", async (_req, res) => {
  const [subjects, chapters] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.chapter.findMany({ include: { subject: true }, orderBy: [{ subject: { name: "asc" } }, { orderIndex: "asc" }] }),
  ]);
  const sampleChapter = chapters[0];
  const questionRows = [
    importHeaders,
    [
      "Ví dụ: Đơn vị vận tốc trong hệ SI là gì?",
      "Đáp án A",
      "Đáp án B",
      "Đáp án C",
      "Đáp án D",
      "A",
      "EASY",
      sampleChapter?.subject.name || subjects[0]?.name || "Vật lý 10",
      sampleChapter?.subject.code || subjects[0]?.code || "PHY10",
      sampleChapter?.name || "Động học chất điểm",
      sampleChapter?.orderIndex || 1,
    ],
  ];
  const referenceRows = [
    ["subjectName", "subjectCode", "chapterName", "chapterOrder", "ghiChu"],
    ...chapters.map((chapter) => [chapter.subject.name, chapter.subject.code, chapter.name, chapter.orderIndex, "Có thể copy sang sheet Cau hoi"]),
    ...subjects
      .filter((subject) => !chapters.some((chapter) => chapter.subjectId === subject.id))
      .map((subject) => [subject.name, subject.code, "", "", "Môn học chưa có chương"]),
  ];

  const workbook = xlsx.utils.book_new();
  const questionSheet = xlsx.utils.aoa_to_sheet(questionRows);
  questionSheet["!cols"] = [
    { wch: 46 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
  ];
  const referenceSheet = xlsx.utils.aoa_to_sheet(referenceRows);
  referenceSheet["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 32 }];

  xlsx.utils.book_append_sheet(workbook, questionSheet, "Cau hoi");
  xlsx.utils.book_append_sheet(workbook, referenceSheet, "Mon va chuong");

  const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="template-import-cau-hoi.xlsx"');
  res.send(buffer);
});

questionsRouter.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Vui lòng chọn file Excel." });

  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  const rowErrors: Array<{ row: number; errors: string[] }> = [];

  const normalized = rows.map((row, index) => {
    const input = normalizeQuestionInput({
      question: row.question,
      optionA: row.optionA,
      optionB: row.optionB,
      optionC: row.optionC,
      optionD: row.optionD,
      correctOption: row.correctOption,
      difficulty: row.difficulty as Difficulty,
      subjectId: row.subjectId,
      chapterId: row.chapterId,
    });
    const subjectName = String(row.subjectName || "").trim();
    const chapterName = String(row.chapterName || "").trim();
    const subjectCode = String(row.subjectCode || subjectName || "").trim();
    const chapterOrder = Number(row.chapterOrder || 1);
    const errors = validateQuestionInput(input).filter((error) => !["Phải chọn môn học.", "Phải chọn chương."].includes(error));
    if (!input.subjectId && !subjectName) errors.push("Phải nhập subjectName hoặc subjectId.");
    if (!input.chapterId && !chapterName) errors.push("Phải nhập chapterName hoặc chapterId.");
    if (!input.subjectId && !subjectCode) errors.push("Phải nhập subjectCode hoặc subjectName.");
    if (errors.length) rowErrors.push({ row: index + 2, errors });
    return {
      ...input,
      subjectName,
      subjectCode,
      chapterName,
      chapterOrder,
    };
  });

  if (rowErrors.length) {
    return res.status(400).json({ message: "File Excel có dòng chưa hợp lệ.", rowErrors });
  }

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdQuestions = [];

    for (const input of normalized) {
      let subjectId = input.subjectId;
      let chapterId = input.chapterId;

      if (!subjectId) {
        const subject = await tx.subject.upsert({
          where: { code: input.subjectCode },
          update: { name: input.subjectName || input.subjectCode },
          create: {
            code: input.subjectCode,
            name: input.subjectName || input.subjectCode,
            description: "Tạo tự động khi import Excel",
          },
        });
        subjectId = subject.id;
      }

      if (!chapterId) {
        const existingChapter = await tx.chapter.findFirst({
          where: {
            subjectId,
            name: { equals: input.chapterName, mode: "insensitive" },
          },
        });
        const nextChapterOrder =
          input.chapterOrder && Number.isFinite(input.chapterOrder) && input.chapterOrder > 0
            ? input.chapterOrder
            : ((await tx.chapter.aggregate({ where: { subjectId }, _max: { orderIndex: true } }))._max.orderIndex || 0) + 1;
        const orderConflict = await tx.chapter.findUnique({
          where: { subjectId_orderIndex: { subjectId, orderIndex: nextChapterOrder } },
        });
        const chapter =
          existingChapter ||
          (await tx.chapter.create({
            data: {
              subjectId,
              name: input.chapterName,
              orderIndex: orderConflict ? ((await tx.chapter.aggregate({ where: { subjectId }, _max: { orderIndex: true } }))._max.orderIndex || 0) + 1 : nextChapterOrder,
            },
          }));
        chapterId = chapter.id;
      }

      createdQuestions.push(
        await tx.question.create({
        data: {
          content: input.content,
          difficulty: input.difficulty as Difficulty,
            subjectId,
            chapterId,
          answers: { create: input.answers },
        },
        }),
      );
    }

    return createdQuestions;
  });

  res.status(201).json({ imported: created.length });
});

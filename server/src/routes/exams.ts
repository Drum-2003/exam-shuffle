import type { Prisma } from "@prisma/client";
import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { buildAnswersDocx, buildExamDocx, buildExamPdf } from "../utils/exporters.js";
import { type Difficulty, optionLabels } from "../utils/questions.js";
import { pickRandom, shuffle } from "../utils/shuffle.js";

export const examsRouter = Router();

const includeExamDetail = {
  subject: true,
  codes: {
    include: {
      questions: {
        include: {
          answers: true,
          question: { include: { subject: true, chapter: true } },
        },
      },
    },
  },
} as const;

type QuestionWithAnswers = Prisma.QuestionGetPayload<{ include: { answers: true } }>;

async function findExam(id: string) {
  return prisma.exam.findUnique({
    where: { id },
    include: includeExamDetail,
  });
}

function filterExamCode(exam: Awaited<ReturnType<typeof findExam>>, codeQuery: unknown) {
  if (!exam || !codeQuery) return exam;

  const code = Number(codeQuery);
  if (!Number.isInteger(code)) return null;

  const selectedCode = exam.codes.find((item) => item.code === code);
  if (!selectedCode) return null;

  return {
    ...exam,
    codes: [selectedCode],
  };
}

async function getPool(subjectId: string, chapterIds: string[], difficulty: Difficulty): Promise<QuestionWithAnswers[]> {
  return prisma.question.findMany({
    where: { subjectId, chapterId: { in: chapterIds }, difficulty },
    include: { answers: true },
  });
}

examsRouter.post("/generate", async (req: AuthRequest, res) => {
  const {
    title,
    subjectId,
    chapterIds,
    totalQuestions,
    codeCount,
    startCode,
    easyCount,
    mediumCount,
    hardCount,
  } = req.body as {
    title?: string;
    subjectId?: string;
    chapterIds?: string[];
    totalQuestions?: number | string;
    codeCount?: number | string;
    startCode?: number | string;
    easyCount?: number | string;
    mediumCount?: number | string;
    hardCount?: number | string;
  };

  const totals = {
    total: Number(totalQuestions || 0),
    codes: Number(codeCount || 0),
    start: Number(startCode || 101),
    EASY: Number(easyCount || 0),
    MEDIUM: Number(mediumCount || 0),
    HARD: Number(hardCount || 0),
  };

  if (!subjectId || !chapterIds?.length) {
    return res.status(400).json({ message: "Vui lòng chọn môn học và ít nhất một chương." });
  }
  if (totals.total <= 0 || totals.codes <= 0) {
    return res.status(400).json({ message: "Tổng số câu và số mã đề phải lớn hơn 0." });
  }
  if (totals.EASY + totals.MEDIUM + totals.HARD !== totals.total) {
    return res.status(400).json({ message: "Tổng số câu theo độ khó phải bằng tổng số câu." });
  }
  if (!req.user?.id) {
    return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
  }
  const createdById = req.user.id;

  const [easyPool, mediumPool, hardPool] = await Promise.all([
    getPool(subjectId, chapterIds, "EASY"),
    getPool(subjectId, chapterIds, "MEDIUM"),
    getPool(subjectId, chapterIds, "HARD"),
  ]);
  const availability = {
    EASY: easyPool.length,
    MEDIUM: mediumPool.length,
    HARD: hardPool.length,
  };

  if (availability.EASY < totals.EASY || availability.MEDIUM < totals.MEDIUM || availability.HARD < totals.HARD) {
    return res.status(400).json({
      message: "Ngân hàng câu hỏi không đủ theo cấu hình.",
      availability,
      required: { EASY: totals.EASY, MEDIUM: totals.MEDIUM, HARD: totals.HARD },
    });
  }

  const baseQuestions = [
    ...pickRandom(easyPool, totals.EASY),
    ...pickRandom(mediumPool, totals.MEDIUM),
    ...pickRandom(hardPool, totals.HARD),
  ];

  const exam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdExam = await tx.exam.create({
      data: {
        title: title?.trim() || "Đề kiểm tra trắc nghiệm",
        subjectId,
        createdById,
        totalQuestions: totals.total,
      },
    });

    for (let codeIndex = 0; codeIndex < totals.codes; codeIndex += 1) {
      const examCode = await tx.examCode.create({
        data: { examId: createdExam.id, code: totals.start + codeIndex },
      });
      const shuffledQuestions = shuffle(baseQuestions);

      for (const [questionIndex, question] of shuffledQuestions.entries()) {
        const shuffledAnswers = shuffle(question.answers);
        const answerRows = shuffledAnswers.map((answer, answerIndex) => ({
          label: optionLabels[answerIndex],
          originalLabel: answer.label,
          content: answer.content,
          isCorrect: answer.isCorrect,
          orderIndex: answerIndex + 1,
        }));
        const correctOption = answerRows.find((answer) => answer.isCorrect)?.label || "A";

        await tx.examQuestion.create({
          data: {
            examCodeId: examCode.id,
            questionId: question.id,
            orderIndex: questionIndex + 1,
            questionSnapshot: question.content,
            correctOption,
            answers: { create: answerRows },
          },
        });
      }
    }

    return tx.exam.findUniqueOrThrow({ where: { id: createdExam.id }, include: includeExamDetail });
  });

  res.status(201).json(exam);
});

examsRouter.get("/", async (req, res) => {
  const subjectId = String(req.query.subjectId || "");
  const exams = await prisma.exam.findMany({
    where: subjectId ? { subjectId } : undefined,
    include: { subject: true, codes: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(exams);
});

examsRouter.get("/:id", async (req, res) => {
  const exam = await findExam(req.params.id);
  if (!exam) return res.status(404).json({ message: "Không tìm thấy đề thi." });
  res.json(exam);
});

examsRouter.delete("/:id", async (req, res) => {
  await prisma.exam.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

examsRouter.get("/:id/export/docx", async (req, res) => {
  const exam = await findExam(req.params.id);
  if (!exam) return res.status(404).json({ message: "Không tìm thấy đề thi." });
  const selectedExam = filterExamCode(exam, req.query.code);
  if (!selectedExam) return res.status(404).json({ message: "Không tìm thấy mã đề." });
  const codeSuffix = req.query.code ? `-ma-${req.query.code}` : "";
  const buffer = await buildExamDocx(selectedExam);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="de-thi-${exam.id}${codeSuffix}.docx"`);
  res.send(buffer);
});

examsRouter.get("/:id/export/answers/docx", async (req, res) => {
  const exam = await findExam(req.params.id);
  if (!exam) return res.status(404).json({ message: "Không tìm thấy đề thi." });
  const selectedExam = filterExamCode(exam, req.query.code);
  if (!selectedExam) return res.status(404).json({ message: "Không tìm thấy mã đề." });
  const codeSuffix = req.query.code ? `-ma-${req.query.code}` : "";
  const buffer = await buildAnswersDocx(selectedExam);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="dap-an-${exam.id}${codeSuffix}.docx"`);
  res.send(buffer);
});

examsRouter.get("/:id/export/pdf", async (req, res) => {
  const exam = await findExam(req.params.id);
  if (!exam) return res.status(404).json({ message: "Không tìm thấy đề thi." });
  const selectedExam = filterExamCode(exam, req.query.code);
  if (!selectedExam) return res.status(404).json({ message: "Không tìm thấy mã đề." });
  const codeSuffix = req.query.code ? `-ma-${req.query.code}` : "";
  const buffer = await buildExamPdf(selectedExam);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="de-thi-${exam.id}${codeSuffix}.pdf"`);
  res.send(buffer);
});

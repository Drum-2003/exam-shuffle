export const optionLabels = ["A", "B", "C", "D"] as const;
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type QuestionInput = {
  content?: string;
  question?: string;
  subjectId?: string;
  chapterId?: string;
  difficulty?: Difficulty;
  answers?: Array<{ label?: string; content?: string; isCorrect?: boolean }>;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
};

export function normalizeQuestionInput(input: QuestionInput) {
  const answers =
    input.answers?.map((answer, index) => ({
      label: (answer.label || optionLabels[index] || "").toUpperCase(),
      content: answer.content?.trim() || "",
      isCorrect: Boolean(answer.isCorrect),
    })) ||
    optionLabels.map((label) => ({
      label,
      content: String(input[`option${label}` as keyof QuestionInput] || "").trim(),
      isCorrect: String(input.correctOption || "").toUpperCase() === label,
    }));

  return {
    content: (input.content || input.question || "").trim(),
    subjectId: input.subjectId || "",
    chapterId: input.chapterId || "",
    difficulty: input.difficulty,
    answers,
  };
}

export function validateQuestionInput(input: ReturnType<typeof normalizeQuestionInput>) {
  const errors: string[] = [];
  if (!input.content) errors.push("Nội dung câu hỏi không được rỗng.");
  if (!input.subjectId) errors.push("Phải chọn môn học.");
  if (!input.chapterId) errors.push("Phải chọn chương.");
  if (!["EASY", "MEDIUM", "HARD"].includes(String(input.difficulty))) {
    errors.push("Độ khó phải là EASY, MEDIUM hoặc HARD.");
  }
  if (input.answers.length !== 4 || input.answers.some((answer) => !answer.content)) {
    errors.push("Phải có đủ 4 đáp án A/B/C/D.");
  }
  if (input.answers.filter((answer) => answer.isCorrect).length !== 1) {
    errors.push("Phải chọn đúng 1 đáp án đúng.");
  }
  return errors;
}

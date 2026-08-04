export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type Subject = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  _count?: { chapters: number; questions: number; exams: number };
};

export type Chapter = {
  id: string;
  name: string;
  orderIndex: number;
  subjectId: string;
  subject?: Subject;
  _count?: { questions: number };
};

export type Answer = {
  id?: string;
  label: string;
  content: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  content: string;
  difficulty: Difficulty;
  subjectId: string;
  chapterId: string;
  subject?: Subject;
  chapter?: Chapter;
  answers: Answer[];
};

export type ExamAnswer = {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type ExamQuestion = {
  id: string;
  orderIndex: number;
  questionSnapshot: string;
  correctOption: string;
  answers: ExamAnswer[];
};

export type ExamCode = {
  id: string;
  code: number;
  questions: ExamQuestion[];
};

export type Exam = {
  id: string;
  title: string;
  totalQuestions: number;
  createdAt: string;
  subject: Subject;
  codes: ExamCode[];
};

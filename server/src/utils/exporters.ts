import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { existsSync } from "node:fs";
import PDFDocument from "pdfkit";

type ExamDetail = {
  title: string;
  subject: { name: string };
  codes: Array<{
    code: number;
    questions: Array<{
      orderIndex: number;
      questionSnapshot: string;
      correctOption: string;
      answers: Array<{ label: string; content: string; isCorrect: boolean; orderIndex: number }>;
    }>;
  }>;
};
type ExamCodeDetail = ExamDetail["codes"][number];

const regularPdfFontCandidates = [
  process.env.PDF_FONT_REGULAR,
  "C:/Windows/Fonts/arial.ttf",
  "C:/Windows/Fonts/segoeui.ttf",
  "C:/Windows/Fonts/tahoma.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
].filter(Boolean) as string[];

const boldPdfFontCandidates = [
  process.env.PDF_FONT_BOLD,
  "C:/Windows/Fonts/arialbd.ttf",
  "C:/Windows/Fonts/segoeuib.ttf",
  "C:/Windows/Fonts/tahomabd.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
].filter(Boolean) as string[];

function firstExistingPath(paths: string[]) {
  return paths.find((path) => existsSync(path));
}

function configurePdfFonts(doc: InstanceType<typeof PDFDocument>) {
  const regularPath = firstExistingPath(regularPdfFontCandidates);
  const boldPath = firstExistingPath(boldPdfFontCandidates);

  if (!regularPath) {
    return { regular: "Helvetica", bold: "Helvetica-Bold" };
  }

  doc.registerFont("Vietnamese-Regular", regularPath);
  if (boldPath) doc.registerFont("Vietnamese-Bold", boldPath);

  return {
    regular: "Vietnamese-Regular",
    bold: boldPath ? "Vietnamese-Bold" : "Vietnamese-Regular",
  };
}

function sortExam(exam: ExamDetail) {
  return {
    ...exam,
    codes: [...exam.codes]
      .sort((a, b) => a.code - b.code)
      .map((code) => ({
        ...code,
        questions: [...code.questions]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((question) => ({
            ...question,
            answers: [...question.answers].sort((a, b) => a.orderIndex - b.orderIndex),
          })),
      })),
  };
}

function centeredText(text: string, options: { bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text,
        bold: options.bold,
        size: options.size,
        color: options.color,
      }),
    ],
  });
}

function answerRowsDocx(question: ExamCodeDetail["questions"][number]) {
  const answers = [...question.answers].sort((a, b) => a.orderIndex - b.orderIndex);
  const rowPairs = [
    [answers[0], answers[1]],
    [answers[2], answers[3]],
  ];

  return rowPairs.map(
    ([left, right]) =>
      new TableRow({
        children: [left, right].map(
          (answer) =>
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${answer?.label || ""}. `, bold: true }),
                    new TextRun(answer?.content || ""),
                  ],
                }),
              ],
            }),
        ),
      }),
  );
}

function buildExamCodeDocxChildren(exam: ExamDetail, code: ExamCodeDetail) {
  const children: Array<Paragraph | Table> = [
    centeredText("BỘ GIÁO DỤC VÀ ĐÀO TẠO - ĐỀ THI TRẮC NGHIỆM", { bold: true, size: 22 }),
    centeredText(`MÔN THI: ${exam.subject.name.toUpperCase()}`, { bold: true, size: 28, color: "315EA8" }),
    centeredText(`${exam.title}  |  MÃ ĐỀ THI: ${code.code}  |  Thời gian làm bài: 45 phút`, { size: 22 }),
    new Paragraph({
      border: {
        bottom: { color: "888888", space: 1, style: BorderStyle.SINGLE, size: 8 },
      },
      spacing: { after: 280 },
    }),
  ];

  for (const question of code.questions) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 80 },
        children: [
          new TextRun({ text: `Câu ${question.orderIndex}: `, bold: true }),
          new TextRun(question.questionSnapshot),
        ],
      }),
      new Table({
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: answerRowsDocx(question),
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );
  }

  return children;
}

export async function buildExamDocx(examDetail: ExamDetail) {
  const exam = sortExam(examDetail);
  const sections = exam.codes.map((code) => ({
    properties: {
      page: {
        margin: { top: 720, right: 720, bottom: 720, left: 720 },
      },
    },
    children: buildExamCodeDocxChildren(exam, code),
  }));

  const document = new Document({ sections });
  return Packer.toBuffer(document);
}

export async function buildAnswersDocx(examDetail: ExamDetail) {
  const exam = sortExam(examDetail);
  const children = exam.codes.map((code) => {
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Câu")] }),
          new TableCell({ children: [new Paragraph("Đáp án đúng")] }),
        ],
      }),
      ...code.questions.map(
        (question) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(question.orderIndex))] }),
              new TableCell({ children: [new Paragraph(question.correctOption)] }),
            ],
          }),
      ),
    ];

    return [
      new Paragraph({
        children: [new TextRun({ text: `Bảng đáp án - Mã đề ${code.code}`, bold: true, size: 28 })],
      }),
      new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      new Paragraph({ text: "" }),
    ];
  });

  const document = new Document({ sections: [{ children: children.flat() }] });
  return Packer.toBuffer(document);
}

export function buildExamPdf(examDetail: ExamDetail) {
  const exam = sortExam(examDetail);
  const doc = new PDFDocument({ margin: 36, size: "A4" });
  const fonts = configurePdfFonts(doc);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const usableWidth = pageRight - pageLeft;
  const answerColumnGap = 24;
  const answerColumnWidth = (usableWidth - answerColumnGap) / 2;

  function ensureSpace(height: number) {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  function drawHeader(code: ExamCodeDetail) {
    doc.font(fonts.bold).fontSize(11).fillColor("#333333").text("BỘ GIÁO DỤC VÀ ĐÀO TẠO - ĐỀ THI TRẮC NGHIỆM", pageLeft, doc.y, {
      width: usableWidth,
      align: "center",
    });
    doc.moveDown(0.25);
    doc.font(fonts.bold).fontSize(15).fillColor("#315EA8").text(`MÔN THI: ${exam.subject.name.toUpperCase()}`, pageLeft, doc.y, {
      width: usableWidth,
      align: "center",
    });
    doc.moveDown(0.25);
    doc.font(fonts.regular).fontSize(10.5).fillColor("#333333").text(exam.title, pageLeft, doc.y, {
      width: usableWidth,
      align: "center",
    });
    doc.moveDown(0.15);
    const metaY = doc.y;
    doc.font(fonts.bold).fillColor("#BD3F3F").text(`MÃ ĐỀ THI: ${code.code}`, pageLeft, metaY, {
      width: usableWidth / 2 - 8,
      align: "right",
      lineBreak: false,
    });
    doc.font(fonts.regular).fillColor("#333333").text("Thời gian làm bài: 45 phút", pageLeft + usableWidth / 2 + 8, metaY, {
      width: usableWidth / 2 - 8,
      align: "left",
      lineBreak: false,
    });
    doc.x = pageLeft;
    doc.y = metaY + 16;
    doc.moveDown(0.75);
    const y = doc.y;
    doc.moveTo(pageLeft, y).lineTo(pageRight, y).lineWidth(1).strokeColor("#444444").stroke();
    doc.moveDown(1.1);
  }

  function drawQuestion(question: ExamCodeDetail["questions"][number]) {
    const answers = [...question.answers].sort((a, b) => a.orderIndex - b.orderIndex);
    const questionText = `Câu ${question.orderIndex}: ${question.questionSnapshot}`;
    doc.font(fonts.bold).fontSize(10.5);
    const questionHeight = doc.heightOfString(questionText, { width: usableWidth });
    doc.font(fonts.regular).fontSize(10.5);
    const answerHeights = answers.map((answer) => doc.heightOfString(`${answer.label}. ${answer.content}`, { width: answerColumnWidth }));
    const rowOneHeight = Math.max(answerHeights[0] || 0, answerHeights[1] || 0);
    const rowTwoHeight = Math.max(answerHeights[2] || 0, answerHeights[3] || 0);

    ensureSpace(questionHeight + rowOneHeight + rowTwoHeight + 34);

    doc.font(fonts.bold).fontSize(10.5).fillColor("#333333").text(questionText, pageLeft, doc.y, {
      width: usableWidth,
    });
    doc.moveDown(0.45);

    for (let row = 0; row < 2; row += 1) {
      const left = answers[row * 2];
      const right = answers[row * 2 + 1];
      const rowY = doc.y;
      doc.font(fonts.regular).fontSize(10.5).fillColor("#333333");
      if (left) doc.text(`${left.label}. ${left.content}`, pageLeft + 18, rowY, { width: answerColumnWidth - 18 });
      if (right) doc.text(`${right.label}. ${right.content}`, pageLeft + answerColumnWidth + answerColumnGap + 18, rowY, { width: answerColumnWidth - 18 });
      doc.x = pageLeft;
      doc.y = rowY + Math.max(answerHeights[row * 2] || 0, answerHeights[row * 2 + 1] || 0) + 6;
    }

    doc.x = pageLeft;
    doc.moveDown(0.45);
  }

  exam.codes.forEach((code, codeIndex) => {
    if (codeIndex > 0) doc.addPage();
    drawHeader(code);
    code.questions.forEach(drawQuestion);
  });

  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

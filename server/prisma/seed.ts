import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const optionLabels = ["A", "B", "C", "D"] as const;
type Difficulty = "EASY" | "MEDIUM" | "HARD";

async function createQuestion(input: {
  content: string;
  difficulty: Difficulty;
  subjectId: string;
  chapterId: string;
  options: [string, string, string, string];
  correct: "A" | "B" | "C" | "D";
}) {
  await prisma.question.create({
    data: {
      content: input.content,
      difficulty: input.difficulty,
      subjectId: input.subjectId,
      chapterId: input.chapterId,
      answers: {
        create: input.options.map((content, index) => ({
          label: optionLabels[index],
          content,
          isCorrect: optionLabels[index] === input.correct,
        })),
      },
    },
  });
}

async function main() {
  await prisma.examAnswer.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.examCode.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "teacher@example.com",
      username: "teacher",
      name: "Giáo viên Demo",
      passwordHash: await bcrypt.hash("123456", 10),
    },
  });

  const math = await prisma.subject.create({
    data: { code: "MATH10", name: "Toán 10", description: "Ngân hàng câu hỏi demo môn Toán lớp 10" },
  });
  const physics = await prisma.subject.create({
    data: { code: "PHY10", name: "Vật lý 10", description: "Ngân hàng câu hỏi demo môn Vật lý lớp 10" },
  });

  const algebra = await prisma.chapter.create({
    data: { subjectId: math.id, name: "Mệnh đề và tập hợp", orderIndex: 1 },
  });
  const functions = await prisma.chapter.create({
    data: { subjectId: math.id, name: "Hàm số bậc nhất", orderIndex: 2 },
  });
  const motion = await prisma.chapter.create({
    data: { subjectId: physics.id, name: "Động học chất điểm", orderIndex: 1 },
  });
  const dynamics = await prisma.chapter.create({
    data: { subjectId: physics.id, name: "Động lực học chất điểm", orderIndex: 2 },
  });

  const mathQuestions = [
    ["Ký hiệu nào biểu diễn tập số tự nhiên?", "N", "Z", "Q", "R", "A", "EASY", algebra.id],
    ["Mệnh đề nào sau đây là mệnh đề đúng?", "2 là số chẵn", "3 là số chẵn", "5 < 2", "7 = 8", "A", "EASY", algebra.id],
    ["Tập nghiệm của x + 2 = 5 là gì?", "{2}", "{3}", "{5}", "{7}", "B", "EASY", algebra.id],
    ["Nếu A = {1,2} và B = {2,3}, A giao B là gì?", "{1}", "{2}", "{3}", "{1,3}", "B", "MEDIUM", algebra.id],
    ["Phủ định của mệnh đề 'mọi học sinh đều chăm chỉ' là gì?", "Không học sinh nào chăm chỉ", "Có học sinh không chăm chỉ", "Mọi học sinh không chăm chỉ", "Có học sinh chăm chỉ", "B", "MEDIUM", algebra.id],
    ["Số phần tử của tập con của tập có 3 phần tử là bao nhiêu?", "3", "6", "8", "9", "C", "MEDIUM", algebra.id],
    ["Hàm số y = 2x + 1 có hệ số góc là bao nhiêu?", "1", "2", "-1", "0", "B", "EASY", functions.id],
    ["Đồ thị hàm số y = ax + b là đường gì nếu a khác 0?", "Đường tròn", "Parabol", "Đường thẳng", "Hyperbol", "C", "EASY", functions.id],
    ["Hàm số y = -3x + 2 đồng biến hay nghịch biến?", "Đồng biến", "Nghịch biến", "Không đổi", "Không xác định", "B", "MEDIUM", functions.id],
    ["Giao điểm của y = x + 1 với trục Oy là điểm nào?", "(0,1)", "(1,0)", "(0,-1)", "(-1,0)", "A", "MEDIUM", functions.id],
    ["Với hàm y = 4x - 7, giá trị y khi x = 3 là bao nhiêu?", "5", "7", "12", "19", "A", "HARD", functions.id],
    ["Hai đường thẳng y = 2x + 1 và y = 2x - 3 có quan hệ gì?", "Cắt nhau", "Song song", "Vuông góc", "Trùng nhau", "B", "HARD", functions.id],
  ] as const;

  for (const [content, a, b, c, d, correct, difficulty, chapterId] of mathQuestions) {
    await createQuestion({
      content,
      difficulty: difficulty as Difficulty,
      subjectId: math.id,
      chapterId,
      options: [a, b, c, d],
      correct,
    });
  }

  const physicsQuestions = [
    ["Đơn vị vận tốc trong hệ SI là gì?", "m/s", "km/h", "N", "J", "A", "EASY", motion.id],
    ["Công thức tính tốc độ trung bình là gì?", "v = s/t", "v = t/s", "v = s.t", "v = m.a", "A", "EASY", motion.id],
    ["Chuyển động thẳng đều có quỹ đạo là gì?", "Đường thẳng", "Đường tròn", "Parabol", "Đường gấp khúc", "A", "EASY", motion.id],
    ["Chuyển động thẳng đều có đại lượng nào không đổi?", "Vận tốc", "Gia tốc", "Quãng đường", "Thời gian", "A", "MEDIUM", motion.id],
    ["Một vật đi 120 m trong 10 s, tốc độ trung bình là bao nhiêu?", "10 m/s", "12 m/s", "20 m/s", "1200 m/s", "B", "MEDIUM", motion.id],
    ["Độ dịch chuyển là đại lượng có tính chất gì?", "Vô hướng", "Có hướng", "Luôn dương", "Luôn bằng quãng đường", "B", "MEDIUM", motion.id],
    ["Một vật chuyển động thẳng nhanh dần đều có gia tốc dương, vận tốc thay đổi thế nào?", "Tăng đều", "Giảm đều", "Không đổi", "Đổi chiều liên tục", "A", "HARD", motion.id],
    ["Đồ thị vận tốc - thời gian của chuyển động thẳng biến đổi đều là đường gì?", "Đường thẳng", "Đường tròn", "Parabol", "Hyperbol", "A", "HARD", motion.id],
    ["Đơn vị lực trong hệ SI là gì?", "N", "J", "W", "Pa", "A", "EASY", dynamics.id],
    ["Định luật II Newton có dạng nào?", "F = ma", "P = mg/h", "A = F/s", "v = at²", "A", "EASY", dynamics.id],
    ["Trọng lực tác dụng lên vật có phương như thế nào?", "Thẳng đứng", "Nằm ngang", "Tiếp tuyến quỹ đạo", "Vuông góc mặt phẳng ngang", "A", "EASY", dynamics.id],
    ["Một vật khối lượng 2 kg chịu lực 6 N thì gia tốc là bao nhiêu?", "2 m/s²", "3 m/s²", "6 m/s²", "12 m/s²", "B", "MEDIUM", dynamics.id],
    ["Lực ma sát trượt phụ thuộc trực tiếp vào đại lượng nào?", "Áp lực", "Vận tốc", "Thời gian", "Quãng đường", "A", "MEDIUM", dynamics.id],
    ["Khi hợp lực tác dụng lên vật bằng 0, vật có thể ở trạng thái nào?", "Đứng yên hoặc chuyển động thẳng đều", "Chỉ đứng yên", "Chỉ nhanh dần", "Chỉ chậm dần", "A", "MEDIUM", dynamics.id],
    ["Một vật 5 kg chịu hợp lực 20 N, gia tốc của vật là bao nhiêu?", "2 m/s²", "4 m/s²", "10 m/s²", "100 m/s²", "B", "HARD", dynamics.id],
    ["Cặp lực và phản lực trong định luật III Newton có đặc điểm nào?", "Cùng độ lớn, ngược chiều", "Cùng chiều", "Cùng đặt lên một vật", "Luôn triệt tiêu nhau trên cùng vật", "A", "HARD", dynamics.id],
  ] as const;

  for (const [content, a, b, c, d, correct, difficulty, chapterId] of physicsQuestions) {
    await createQuestion({
      content,
      difficulty: difficulty as Difficulty,
      subjectId: physics.id,
      chapterId,
      options: [a, b, c, d],
      correct,
    });
  }

  console.log("Seeded teacher@example.com / 123456 and demo question bank.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

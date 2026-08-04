# Exam Shuffle

Ứng dụng xáo trộn câu hỏi trắc nghiệm và sinh nhiều mã đề từ ngân hàng câu hỏi. Hệ thống hỗ trợ quản lý môn học, chương, câu hỏi, import Excel, sinh đề theo cơ cấu độ khó, lưu đáp án cố định và xuất Word/PDF theo từng mã đề.

## Tính năng

- Quản lý môn học, chương và ngân hàng câu hỏi trắc nghiệm.
- Import câu hỏi từ Excel bằng tên môn và tên chương, không cần tự điền `subjectId` hoặc `chapterId`.
- Tự tạo môn/chương khi import nếu dữ liệu chưa tồn tại.
- Sinh nhiều mã đề từ cùng một ngân hàng câu hỏi.
- Xáo thứ tự câu hỏi và đáp án cho từng mã đề.
- Xem trước từng mã đề và bảng đáp án.
- Tải riêng từng mã đề ra Word hoặc PDF.
- Tải bảng đáp án Word theo từng mã đề.
- Giao diện Next.js, Tailwind CSS v4 và HeroUI v3.

## Công nghệ

- Client: Next.js, React, TypeScript, Tailwind CSS v4, HeroUI v3
- Server: Express.js, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + bcrypt
- Import Excel: multer + xlsx
- Export: docx + pdfkit

## Tài khoản demo

```text
Email: teacher@example.com
Username: teacher
Password: 123456
```

## Cài đặt

```bash
npm install
```

Tạo file môi trường:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Trên Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env.local
```

## Cấu hình môi trường

Server dùng `server/.env`:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/exam-shuffle?schema=public"
JWT_SECRET="change-this-secret"
PORT=4000
CLIENT_URL="http://localhost:3000"
```

Client dùng `client/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

## Database

Tạo database PostgreSQL tên `exam-shuffle`.

Ví dụ bằng `psql`:

```bash
psql -U postgres
CREATE DATABASE "exam-shuffle";
\q
```

Chạy migrate và seed:

```bash
npm run db:migrate
npm run db:seed
```

Seed sẽ xóa dữ liệu cũ và tạo lại tài khoản demo, môn học, chương và câu hỏi mẫu đủ để test sinh đề.

## Chạy local

Chạy client và server cùng lúc:

```bash
npm run dev
```

Hoặc chạy riêng:

```bash
npm run dev:server
npm run dev:client
```

Địa chỉ mặc định:

- Client: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

## Luồng test nhanh

1. Đăng nhập bằng `teacher@example.com / 123456`.
2. Vào Tổng quan để kiểm tra dữ liệu mẫu.
3. Vào Sinh đề.
4. Chọn Toán 10 hoặc Vật lý 10.
5. Chọn chương, số câu và cơ cấu độ khó.
6. Sinh 2 mã đề bắt đầu từ mã 101.
7. Vào Đề đã tạo để xem từng mã đề.
8. Tải Word/PDF hoặc bảng đáp án theo từng mã đề.

## Import Excel

Vào Import Excel và tải file mẫu. Sheet đầu tiên dùng các cột:

| question | optionA | optionB | optionC | optionD | correctOption | difficulty | subjectName | subjectCode | chapterName | chapterOrder |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Ý nghĩa:

- `question`: nội dung câu hỏi.
- `optionA`, `optionB`, `optionC`, `optionD`: 4 đáp án.
- `correctOption`: đáp án đúng, dùng `A`, `B`, `C` hoặc `D`.
- `difficulty`: độ khó, dùng `EASY`, `MEDIUM` hoặc `HARD`.
- `subjectName`: tên môn học, ví dụ `Vật lý 10`.
- `subjectCode`: mã môn duy nhất, ví dụ `PHY10`.
- `chapterName`: tên chương, ví dụ `Động học chất điểm`.
- `chapterOrder`: thứ tự chương, ví dụ `1`.

Khi import, hệ thống tự tìm hoặc tạo môn/chương theo `subjectCode`, `subjectName` và `chapterName`. File cũ dùng `subjectId`, `chapterId` vẫn được hỗ trợ.

## Xuất đề

Sau khi sinh đề, mỗi mã đề được tải riêng:

- Word đề thi: `de-thi-...-ma-101.docx`
- PDF đề thi: `de-thi-...-ma-101.pdf`
- Word đáp án: `dap-an-...-ma-101.docx`

PDF đã nhúng font Unicode để hiển thị tiếng Việt.

## Deploy Vercel

Theo tài liệu Express on Vercel, Express app có thể deploy khi entrypoint như `src/index.ts` export ứng dụng bằng `export default app`. Server trong repo đã cấu hình theo hướng này; `app.listen()` chỉ chạy khi chạy local.

Khuyến nghị deploy thành 2 Vercel project:

1. API project
   - Root Directory: `server`
   - Environment Variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `CLIENT_URL`
   - `CLIENT_URL` là domain frontend được phép gọi API. Có thể dùng nhiều domain, ngăn cách bằng dấu phẩy.

2. Client project
   - Root Directory: `client`
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL="https://your-api.vercel.app/api"`

Sau khi đổi environment variables trên Vercel, redeploy project tương ứng.

## Scripts

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run typecheck
npm run build
npm run db:migrate
npm run db:seed
npm run db:studio
```

....
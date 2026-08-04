# Ứng dụng xáo trộn câu hỏi trắc nghiệm

Ứng dụng xáo trộn câu hỏi trắc nghiệm và sinh đề từ ngân hàng câu hỏi. Hệ thống hỗ trợ quản lý môn học, chương, câu hỏi, sinh nhiều mã đề và lưu đáp án cố định để xem lại hoặc xuất file.

## Stack

- Client: Next.js, TypeScript, Tailwind CSS v4, HeroUI v3
- Server: Express.js, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + bcrypt
- Import: multer + xlsx
- Export: docx, pdfkit

## Tài khoản demo

- Email: `teacher@example.com`
- Username: `teacher`
- Password: `123456`

## Chuẩn bị PostgreSQL

Tạo database tên `exam-shuffle` với user PostgreSQL có mật khẩu `123456`.

Ví dụ bằng `psql`:

```bash
psql -U postgres
CREATE DATABASE "exam-shuffle";
\q
```

Tạo file `server/.env` từ mẫu:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Trên Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env.local
```

Nội dung mặc định:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/exam-shuffle?schema=public"
JWT_SECRET="change-this-secret"
PORT=4000
CLIENT_URL="http://localhost:3000"
```

Client dùng file `client/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

## Deploy server lên Vercel

Theo tài liệu Express on Vercel, Express app cần export ứng dụng ở entrypoint như `src/index.ts`. Server trong repo đã export `default app`; `app.listen()` chỉ chạy khi chạy local bằng `npm run dev:server` hoặc `npm run start --workspace server`.

Khi tạo Vercel project cho API:

1. Chọn Root Directory là `server`.
2. Thêm Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CLIENT_URL`: domain frontend được phép gọi API, ví dụ `https://your-client.vercel.app`. Nếu có nhiều domain, ngăn cách bằng dấu phẩy.
3. Sau khi deploy API, đặt `NEXT_PUBLIC_API_URL` trong project client thành `https://your-api.vercel.app/api`.

## Cài đặt

```bash
npm install
```

## Migrate và seed data

```bash
npm run db:migrate
npm run db:seed
```

Seed sẽ tạo tài khoản giáo viên demo, môn học, chương và câu hỏi mẫu.

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

- Client: http://localhost:3000
- API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

## Các lệnh hữu ích

```bash
npm run typecheck
npm run build
npm run db:studio
```

## Luồng demo nhanh

1. Đăng nhập bằng `teacher@example.com / 123456`.
2. Vào Tổng quan để xem dữ liệu mẫu.
3. Vào Sinh đề, chọn môn Toán 10, chọn các chương có sẵn.
4. Tạo 6 câu, 2 mã đề, mã bắt đầu 101, cấu hình 3 dễ, 2 trung bình, 1 khó.
5. Xem preview từng mã đề, kiểm tra bảng đáp án và tải file Word/PDF.

## Format import Excel

File Excel dùng sheet đầu tiên, dòng đầu là header:

| question | optionA | optionB | optionC | optionD | correctOption | difficulty | subjectName | subjectCode | chapterName | chapterOrder |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

- `correctOption`: `A`, `B`, `C` hoặc `D`
- `difficulty`: `EASY`, `MEDIUM` hoặc `HARD`
- `subjectName`, `chapterName`: điền tên môn và tên chương dễ đọc, hệ thống sẽ tự tìm hoặc tạo mới khi import
- `subjectCode`: mã môn duy nhất, ví dụ `MATH10`, `PHY10`
- `chapterOrder`: thứ tự chương, ví dụ `1`, `2`, `3`
- File cũ dùng `subjectId`, `chapterId` vẫn được hỗ trợ nếu đã có ID từ database

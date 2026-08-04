import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, username, password } = req.body as {
    email?: string;
    username?: string;
    password?: string;
  };
  const login = email || username;

  if (!login || !password) {
    return res.status(400).json({ message: "Vui lòng nhập email/tên đăng nhập và mật khẩu." });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: login }, { username: login }],
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Thông tin đăng nhập không đúng." });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    },
  });
});

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as {
      id: string;
      email: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    }

    req.user = { id: user.id, email: user.email };
    return next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

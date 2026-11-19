import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { Users } from "../config/db";
import { env } from "../config/env";
import type { Role } from "../types";

export const signToken = (payload: { id: string; email: string; role: Role }) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: "2h" });

/**
 * Verifies the Bearer JWT and loads the *current* user from MongoDB, so role
 * and plan changes (admin edits, Stripe upgrades) apply immediately.
 */
export const verifyToken: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as { email?: string };
    if (!payload.email) return res.status(401).json({ message: "Unauthorized: invalid token" });

    const user = await Users.findOne({ email: payload.email });
    if (!user) return res.status(401).json({ message: "Unauthorized: user not found" });

    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan ?? "free",
    };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: token expired or invalid" });
  }
};

const requireRole =
  (role: Role): RequestHandler =>
  (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: `Forbidden: ${role} access only` });
    }
    next();
  };

export const verifyStudent = requireRole("student");
export const verifyTutor = requireRole("tutor");
export const verifyAdmin = requireRole("admin");
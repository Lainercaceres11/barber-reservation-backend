import { Request, Response, NextFunction } from "express";

import jwt, { JwtPayload } from "jsonwebtoken";

type UserRole = "customer" | "barber" | "admin";

interface AuthPayload extends JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication token required",
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      error: "Authentication configuration error",
    });
    return;
  }

  try {
    const verified = jwt.verify(token, secret);

    if (
      typeof verified === "string" ||
      typeof verified.sub !== "string" ||
      !["customer", "barber", "admin"].includes(String(verified.role))
    ) {
      res.status(401).json({
        error: "Invalid token payload",
      });
      return;
    }

    (req as AuthenticatedRequest).user = verified as AuthPayload;
    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

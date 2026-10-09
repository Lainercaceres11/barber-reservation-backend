import { Request, Response, NextFunction } from "express";

import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
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

    (req as AuthenticatedRequest).user = verified;

    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

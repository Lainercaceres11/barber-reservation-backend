import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

type UserRole = "customer" | "barber" | "admin";

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    if (!user || typeof user === "string") {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const role = user.role;

    if (typeof role !== "string" || !allowedRoles.includes(role as UserRole)) {
      res.status(403).json({
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
};

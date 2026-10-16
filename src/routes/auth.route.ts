import { Router } from "express";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/auth/controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/me", authenticateToken, getCurrentUser);

export default authRouter;

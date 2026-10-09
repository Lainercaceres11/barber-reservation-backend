import { Router } from "express";

import { getUsers } from "../controllers/users/controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const userRouter = Router();

userRouter.get("/", authenticateToken, getUsers);

export default userRouter;

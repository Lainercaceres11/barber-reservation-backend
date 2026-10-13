import { Router } from "express";

import { getUsers } from "../controllers/users/controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const userRouter = Router();

userRouter.get("/", authenticateToken, authorizeRoles("customer"), getUsers);

export default userRouter;

import { Router } from "express";

import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import {
  createBarber,
  deleteBarber,
  getAllBarber,
  getBarberById,
  updateBarber,
} from "../controllers/barber/controller";

const barberRouter = Router();

barberRouter.get("/", authenticateToken, getAllBarber);
barberRouter.get("/:id", authenticateToken, getBarberById);
barberRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createBarber,
);
barberRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("customer"),
  updateBarber,
);
barberRouter.put(
  "/deleted/:id",
  authenticateToken,
  authorizeRoles("customer"),
  deleteBarber,
);

export default barberRouter;

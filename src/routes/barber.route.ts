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
import uploadImage from "../middlewares/upload-image";

const barberRouter = Router();

barberRouter.get("/", getAllBarber);
barberRouter.get("/:id", getBarberById);
barberRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("barber"),
  uploadImage.single("image"),
  createBarber,
);
barberRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  updateBarber,
);
barberRouter.put(
  "/deleted/:id",
  authenticateToken,
  authorizeRoles("barber"),
  deleteBarber,
);

export default barberRouter;

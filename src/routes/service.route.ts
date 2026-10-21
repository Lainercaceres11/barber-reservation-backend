import { Router } from "express";
import {
  createService,
  deleteService,
  getServices,
  getServicesById,
  updateService,
} from "../controllers/services/controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import uploadImage from "../middlewares/upload-image";

const serviceRouter = Router();

serviceRouter.get("/", getServices);
serviceRouter.get("/:id", getServicesById);
serviceRouter.post(
  "/",
  authenticateToken,
  uploadImage.single("image"),
  authorizeRoles("barber"),
  createService,
);
serviceRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("barber"),
  updateService,
);
serviceRouter.put(
  "/deleted/:id",
  authenticateToken,
  authorizeRoles("barber"),
  deleteService,
);

export default serviceRouter;

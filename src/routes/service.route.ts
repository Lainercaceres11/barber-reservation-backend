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

const serviceRouter = Router();

serviceRouter.get("/", authenticateToken, getServices);
serviceRouter.get("/:id", authenticateToken, getServicesById);
serviceRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createService,
);
serviceRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  updateService,
);
serviceRouter.put(
  "/deleted/:id",
  authenticateToken,
  authorizeRoles("admin"),
  deleteService,
);

export default serviceRouter;

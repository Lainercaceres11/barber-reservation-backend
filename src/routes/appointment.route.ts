import { Router } from "express";

import { authenticateToken } from "../middlewares/auth.middleware";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  createAppointment,
  getAppointments,
  getAvailability,
  markNoShow,
} from "../controllers/appointments/controller";
import { authorizeRoles } from "../middlewares/role.middleware";

const appointmentRouter = Router();

appointmentRouter.get("/", authenticateToken, getAppointments);
appointmentRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("customer"),
  createAppointment,
);
appointmentRouter.patch(
  "/:id/confirm",
  authenticateToken,
  authorizeRoles("barber"),
  confirmAppointment,
);

appointmentRouter.patch("/:id/cancel", authenticateToken, cancelAppointment);

appointmentRouter.patch(
  "/:id/complete",
  authenticateToken,
  authorizeRoles("barber"),
  completeAppointment,
);

appointmentRouter.patch("/:id/no-show", authenticateToken, markNoShow);
appointmentRouter.get("/availables", authenticateToken, getAvailability);

export default appointmentRouter;

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

const appointmentRouter = Router();

appointmentRouter.get("/", authenticateToken, getAppointments);
appointmentRouter.post("/", authenticateToken, createAppointment);
appointmentRouter.patch("/:id/confirm", authenticateToken, confirmAppointment);

appointmentRouter.patch("/:id/cancel", authenticateToken, cancelAppointment);

appointmentRouter.patch(
  "/:id/complete",
  authenticateToken,
  completeAppointment,
);

appointmentRouter.patch("/:id/no-show", authenticateToken, markNoShow);
appointmentRouter.get("/availables", authenticateToken, getAvailability);

export default appointmentRouter;

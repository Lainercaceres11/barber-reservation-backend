import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  createBarberSchedules,
  deleteBarberSchedule,
  getBarberAvailability,
  getBarbersSchedules,
  updateBarberSchedule,
} from "../controllers/barber-schedules/controller";

const barberSchedulesRouter = Router();

barberSchedulesRouter.get(
  "/:id/schedules",
  authenticateToken,
  getBarbersSchedules,
);

barberSchedulesRouter.post(
  "/:id/schedules",
  authenticateToken,
  createBarberSchedules,
);

barberSchedulesRouter.put("/:id/schedules/:scheduleId", updateBarberSchedule);

barberSchedulesRouter.delete(
  "/:id/schedules/:scheduleId",
  deleteBarberSchedule,
);

barberSchedulesRouter.get("/:id/availability", getBarberAvailability);

export default barberSchedulesRouter;

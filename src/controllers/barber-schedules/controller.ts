import { Request, Response } from "express";
import User from "../../models/user";
import BarberSchedule from "../../models/barber-schedules";
import { Op } from "sequelize";
import Appointment from "../../models/appointments";

export const getBarbersSchedules = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
    return res.status(400).json({
      message: "Invalid barber ID",
    });
  }

  try {
    const barber = await User.findOne({
      where: {
        id,
        role: "barber",
        is_active: true,
      },
      attributes: ["id", "name"],
    });

    if (!barber) {
      return res.status(404).json({
        message: "Barber not found",
      });
    }

    const schedules = await BarberSchedule.findAll({
      where: {
        barber_id: barber.id,
      },
      order: [
        ["day_of_week", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    return res.status(200).json({
      message: "Barber schedules",
      data: schedules,
    });
  } catch (error) {
    console.error("Get barber schedules error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const createBarberSchedules = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time } = req.body;

  if (!id || typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
    return res.status(400).json({
      message: "Invalid barber ID",
    });
  }

  if (
    day_of_week === undefined ||
    day_of_week === null ||
    !start_time ||
    !end_time
  ) {
    return res.status(400).json({
      message: "Day, start time and end time are required",
    });
  }

  if (!Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6) {
    return res.status(400).json({
      message: "Day of week must be an integer between 0 and 6",
    });
  }

  // 4. Validar el formato de las horas (HH:mm o HH:mm:ss)
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

  if (
    typeof start_time !== "string" ||
    typeof end_time !== "string" ||
    !timeRegex.test(start_time) ||
    !timeRegex.test(end_time)
  ) {
    return res.status(400).json({
      message: "Times must use the HH:mm or HH:mm:ss format",
    });
  }

  // Convertir las horas a segundos para compararlas
  const toSeconds = (time: string): number => {
    const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);

    return hours * 3600 + minutes * 60 + seconds;
  };

  const startSeconds = toSeconds(start_time);
  const endSeconds = toSeconds(end_time);

  // 5. Validar que la hora final sea posterior a la inicial
  if (endSeconds <= startSeconds) {
    return res.status(400).json({
      message: "End time must be later than start time",
    });
  }

  try {
    // 6. Verificar que exista un barbero activo
    const barber = await User.findOne({
      where: {
        id,
        role: "barber",
        is_active: true,
      },
      attributes: ["id", "name"],
    });

    if (!barber) {
      return res.status(404).json({
        message: "Active barber not found",
      });
    }

    // 7. Consultar horarios del mismo barbero y día
    const existingSchedules = await BarberSchedule.findAll({
      where: {
        barber_id: barber.id,
        day_of_week,
      },
    });

    // 8. Detectar horarios que se solapan
    const hasOverlap = existingSchedules.some((schedule) => {
      const existingStart = toSeconds(schedule.start_time);
      const existingEnd = toSeconds(schedule.end_time);

      return startSeconds < existingEnd && endSeconds > existingStart;
    });

    if (hasOverlap) {
      return res.status(409).json({
        message: "The schedule overlaps with an existing schedule",
      });
    }

    // 9. Crear el horario
    const createdSchedule = await BarberSchedule.create({
      barber_id: barber.id,
      day_of_week,
      start_time,
      end_time,
    });

    // 10. Responder con el horario creado
    return res.status(201).json({
      message: "Barber schedule created successfully",
      data: createdSchedule,
    });
  } catch (error) {
    console.error("Create barber schedule error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateBarberSchedule = async (req: Request, res: Response) => {
  const { id, scheduleId } = req.params;
  const { day_of_week, start_time, end_time } = req.body;

  // 1. Validar los IDs
  if (!id || typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
    return res.status(400).json({
      message: "Invalid barber ID",
    });
  }

  // 2. Validar los campos obligatorios
  if (
    day_of_week === undefined ||
    day_of_week === null ||
    !start_time ||
    !end_time
  ) {
    return res.status(400).json({
      message: "Day, start time and end time are required",
    });
  }

  // 3. Validar el día
  if (!Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6) {
    return res.status(400).json({
      message: "Day must be an integer between 0 and 6",
    });
  }

  // 4. Validar formato de las horas
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

  if (
    typeof start_time !== "string" ||
    typeof end_time !== "string" ||
    !timeRegex.test(start_time) ||
    !timeRegex.test(end_time)
  ) {
    return res.status(400).json({
      message: "Times must use HH:mm or HH:mm:ss format",
    });
  }

  const toSeconds = (time: string): number => {
    const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);

    return hours * 3600 + minutes * 60 + seconds;
  };

  if (toSeconds(end_time) <= toSeconds(start_time)) {
    return res.status(400).json({
      message: "End time must be later than start time",
    });
  }

  try {
    // 5. Verificar que el barbero esté activo
    const barber = await User.findOne({
      where: {
        id,
        role: "barber",
        is_active: true,
      },
      attributes: ["id", "name"],
    });

    if (!barber) {
      return res.status(404).json({
        message: "Active barber not found",
      });
    }

    // 6. Buscar el horario y comprobar que pertenezca al barbero
    const schedule = await BarberSchedule.findOne({
      where: {
        id: scheduleId,
        barber_id: barber.id,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found for this barber",
      });
    }

    // 7. Consultar otros horarios del mismo día,
    // excluyendo el horario que estamos actualizando
    const existingSchedules = await BarberSchedule.findAll({
      where: {
        barber_id: barber.id,
        day_of_week,
        id: {
          [Op.ne]: schedule.id,
        },
      },
    });

    // 8. Comprobar solapamientos
    const startSeconds = toSeconds(start_time);
    const endSeconds = toSeconds(end_time);

    const hasOverlap = existingSchedules.some((item) => {
      const existingStart = toSeconds(item.start_time);
      const existingEnd = toSeconds(item.end_time);

      return startSeconds < existingEnd && endSeconds > existingStart;
    });

    if (hasOverlap) {
      return res.status(409).json({
        message: "The schedule overlaps with an existing schedule",
      });
    }

    // 9. Actualizar la instancia encontrada
    await schedule.update({
      day_of_week,
      start_time,
      end_time,
    });

    return res.status(200).json({
      message: "Barber schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Update barber schedule error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteBarberSchedule = async (req: Request, res: Response) => {
  const { id, scheduleId } = req.params;

  // 1. Validar los IDs
  if (!id || typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
    return res.status(400).json({
      message: "Invalid barber ID",
    });
  }

  try {
    // 2. Verificar que el usuario sea un barbero
    // Permitimos limpiar horarios aunque esté inactivo.
    const barber = await User.findOne({
      where: {
        id,
        role: "barber",
      },
      attributes: ["id", "name"],
    });

    if (!barber) {
      return res.status(404).json({
        message: "Barber not found",
      });
    }

    // 3. Buscar el horario asociado a ese barbero
    const schedule = await BarberSchedule.findOne({
      where: {
        id: scheduleId,
        barber_id: barber.id,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found for this barber",
      });
    }

    // 4. Eliminar el horario
    await schedule.destroy();

    return res.status(200).json({
      message: "Barber schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete barber schedule error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getBarberAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.query;

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      message: "La fecha debe tener el formato YYYY-MM-DD",
    });
  }

  try {
    const barber = await User.findOne({
      where: {
        id,
        role: "barber",
        is_active: true,
      },
    });

    if (!barber) {
      return res.status(404).json({
        message: "Barbero no encontrado",
      });
    }

    // Día de la semana: domingo = 0, sábado = 6.
    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();

    const schedules = await BarberSchedule.findAll({
      where: {
        barber_id: barber.id,
        day_of_week: dayOfWeek,
      },
      order: [["start_time", "ASC"]],
    });

    // Inicio y fin del día en hora colombiana (UTC-5).
    const startOfDay = new Date(`${date}T00:00:00-05:00`);
    const endOfDay = new Date(
      new Date(`${date}T00:00:00-05:00`).getTime() + 24 * 60 * 60 * 1000,
    );

    const bookedAppointments = await Appointment.findAll({
      where: {
        barber_id: barber.id,
        status: {
          [Op.in]: ["pending", "confirmed"],
        },
        starts_at: { [Op.lt]: endOfDay },
        ends_at: { [Op.gt]: startOfDay },
      },
      attributes: ["starts_at", "ends_at"],
      order: [["starts_at", "ASC"]],
    });

    return res.status(200).json({
      data: {
        barber_id: barber.id,
        date,
        schedules,
        booked_appointments: bookedAppointments,
      },
    });
  } catch (error) {
    console.error("Get barber availability error:", error);

    return res.status(500).json({
      message: "Error al consultar la disponibilidad",
    });
  }
};

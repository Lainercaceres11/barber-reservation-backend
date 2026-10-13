import { Request, Response } from "express";

import { Appointment, Service, User } from "../../models/association";

import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/database";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { Transaction } from "sequelize";

export const getAppointments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sub, role } = (
      req as Request & { user: { sub: string; role: string } }
    ).user;

    console.log({ sub, role });

    const where: Record<string, unknown> = {};

    if (role === "customer") {
      where.customer_id = sub;
    } else if (role === "barber") {
      where.barber_id = sub;
    } else if (role !== "admin") {
      res.status(403).json({
        message: "No tienes permisos para consultar las citas",
      });
      return;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "barber",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Service,
          as: "service",
          attributes: ["id", "name", "price", "duration_minutes"],
        },
      ],
      order: [["starts_at", "ASC"]],
    });

    res.status(200).json({
      message: "Citas consultadas correctamente",
      data: appointments,
    });
  } catch (error) {
    console.error("Error al consultar citas:", error);

    res.status(500).json({
      message: "Error interno al consultar las citas",
    });
  }
};

interface CreateAppointmentBody {
  barber_id: number;
  service_id: number;
  starts_at: string;
  customer_notes?: string;
}

interface CreateAppointmentResult {
  create_appointment: string;
}

export const createAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { sub, role } = authenticatedReq.user!;

    if (role !== "customer") {
      res.status(403).json({
        message: "Solo los clientes pueden solicitar citas",
      });
      return;
    }

    const { barber_id, service_id, starts_at, customer_notes } =
      req.body as CreateAppointmentBody;

    if (
      !barber_id ||
      !Number.isInteger(Number(barber_id)) ||
      !service_id ||
      !Number.isInteger(Number(service_id)) ||
      typeof starts_at !== "string" ||
      Number.isNaN(Date.parse(starts_at))
    ) {
      res.status(400).json({
        message:
          "Debes proporcionar un barbero, un servicio y una fecha válida",
      });
      return;
    }

    const results = await sequelize.query<CreateAppointmentResult>(
      `SELECT public.create_appointment(
        :customer_id,
        :barber_id,
        :service_id,
        CAST(:starts_at AS TIMESTAMPTZ)
      ) AS create_appointment`,
      {
        replacements: {
          customer_id: sub,
          barber_id: Number(barber_id),
          service_id: Number(service_id),
          starts_at,
        },
        type: QueryTypes.SELECT,
      },
    );

    const appointmentId = results[0]?.create_appointment;

    if (!appointmentId) {
      res.status(500).json({
        message: "No se pudo crear la cita",
      });
      return;
    }

    res.status(201).json({
      message: "Solicitud de cita creada correctamente",
      data: {
        id: appointmentId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error al crear la cita:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "original" in error &&
      typeof error.original === "object" &&
      error.original !== null &&
      "code" in error.original &&
      error.original.code === "23P01"
    ) {
      res.status(409).json({
        message: "Ese horario ya no está disponible",
      });
      return;
    }

    res.status(500).json({
      message: "Error interno al crear la cita",
    });
  }
};

export const confirmAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sub, role } = (
      req as Request & {
        user: { sub: string; role: string };
      }
    ).user;

    // Solo los barberos pueden confirmar citas
    if (role !== "barber") {
      res.status(403).json({
        message: "No tienes permisos para confirmar citas",
      });
      return;
    }

    const { id } = req.params;

    // Buscar una cita pendiente que pertenezca al barbero
    const appointment = await Appointment.findOne({
      where: {
        id,
        barber_id: sub,
        status: "pending",
      },
    });

    if (!appointment) {
      res.status(404).json({
        message: "Cita no encontrada o ya no está pendiente",
      });
      return;
    }

    // Confirmar la cita
    await appointment.update({
      status: "confirmed",
    });

    res.status(200).json({
      message: "Cita confirmada correctamente",
      data: appointment,
    });
  } catch (error) {
    console.error("Error al confirmar la cita:", error);

    res.status(500).json({
      message: "Error interno al confirmar la cita",
    });
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sub, role } = (
      req as Request & {
        user: { sub: string; role: string };
      }
    ).user;

    const { id } = req.params;

    if (typeof id !== "string" || !/^\d+$/.test(id)) {
      res.status(400).json({
        message: "El ID de la cita no es válido",
      });
      return;
    }

    // Solo clientes y barberos pueden cancelar
    if (role !== "customer" && role !== "barber") {
      res.status(403).json({
        message: "No tienes permisos para cancelar citas",
      });
      return;
    }

    // Buscar la cita según el rol
    const where: Record<string, unknown> = {
      id,
      status: ["pending", "confirmed"],
    };

    if (role === "customer") {
      where.customer_id = sub;
    } else {
      where.barber_id = sub;
    }

    // Buscar la cita
    const appointment = await Appointment.findOne({ where });

    if (!appointment) {
      res.status(404).json({
        message: "Cita no encontrada o no se puede cancelar",
      });
      return;
    }

    // Guardar el estado anterior ANTES de actualizar
    const previousStatus = appointment.status;

    // Cambiar el estado
    await appointment.update({
      status: "cancelled",
    });

    // Registrar el cambio en el historial
    await Appointment.sequelize!.query(
      `INSERT INTO appointment_status_history (
        appointment_id,
        old_status,
        new_status,
        changed_by
      )
      VALUES (
        :appointment_id,
        :old_status,
        :new_status,
        :changed_by
      )`,
      {
        replacements: {
          appointment_id: appointment.id,
          old_status: previousStatus,
          new_status: "cancelled",
          changed_by: sub,
        },
      },
    );
    res.status(200).json({
      message: "Cita cancelada correctamente",
      data: appointment,
    });
  } catch (error) {
    console.error("Error al cancelar la cita:", error);

    res.status(500).json({
      message: "Error interno al cancelar la cita",
    });
  }
};

export const completeAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sub, role } = (
      req as Request & {
        user: { sub: string; role: string };
      }
    ).user;

    if (role !== "barber") {
      res.status(403).json({
        message: "Solo el barbero puede completar una cita",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !/^\d+$/.test(id)) {
      res.status(400).json({
        message: "El ID de la cita no es válido",
      });
      return;
    }

    const appointment = await Appointment.findOne({
      where: {
        id,
        barber_id: sub,
        status: "confirmed",
      },
    });

    if (!appointment) {
      res.status(404).json({
        message: "Cita no encontrada o no está confirmada",
      });
      return;
    }

    const previousStatus = appointment.status;

    await appointment.update({
      status: "completed",
    });

    await Appointment.sequelize!.query(
      `INSERT INTO appointment_status_history (
        appointment_id, old_status, new_status, changed_by
      )
      VALUES (
        :appointment_id, :old_status, :new_status, :changed_by
      )`,
      {
        replacements: {
          appointment_id: appointment.id,
          old_status: previousStatus,
          new_status: "completed",
          changed_by: sub,
        },
      },
    );

    res.status(200).json({
      message: "Cita completada correctamente",
      data: appointment,
    });
  } catch (error) {
    console.error("Error al completar la cita:", error);

    res.status(500).json({
      message: "Error interno al completar la cita",
    });
  }
};

export const markNoShow = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sub, role } = (
      req as Request & {
        user: { sub: string; role: string };
      }
    ).user;

    if (role !== "barber") {
      res.status(403).json({
        message: "Solo el barbero puede registrar una inasistencia",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !/^\d+$/.test(id)) {
      res.status(400).json({
        message: "El ID de la cita no es válido",
      });
      return;
    }

    const appointment = await Appointment.findOne({
      where: {
        id,
        barber_id: sub,
        status: "confirmed",
      },
    });

    if (!appointment) {
      res.status(404).json({
        message: "Cita no encontrada o no está confirmada",
      });
      return;
    }

    const now = Date.now();
    const startTime = new Date(appointment.starts_at).getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    if (now < startTime + fifteenMinutes) {
      res.status(400).json({
        message: "Aún no han transcurrido 15 minutos desde el inicio",
      });
      return;
    }

    const previousStatus = appointment.status;

    await appointment.update({
      status: "no_show",
    });

    await Appointment.sequelize!.query(
      `INSERT INTO appointment_status_history (
        appointment_id, old_status, new_status, changed_by
      )
      VALUES (
        :appointment_id, :old_status, :new_status, :changed_by
      )`,
      {
        replacements: {
          appointment_id: appointment.id,
          old_status: previousStatus,
          new_status: "no_show",
          changed_by: sub,
        },
      },
    );

    res.status(200).json({
      message: "Inasistencia registrada correctamente",
      data: appointment,
    });
  } catch (error) {
    console.error("Error al registrar la inasistencia:", error);

    res.status(500).json({
      message: "Error interno al registrar la inasistencia",
    });
  }
};

export const getAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { barber_id, service_id, date } = req.query;

    if (!barber_id || !service_id || !date) {
      res.status(400).json({
        message: "Barbero, servicio y fecha son obligatorios",
      });
      return;
    }

    // 1. Consultar horario y duración del servicio
    const [schedule] = await sequelize.query<any>(
      `
      SELECT bs.start_time, bs.end_time, s.duration_minutes
      FROM barber_schedules bs
      JOIN services s ON s.id = :service_id
      WHERE bs.barber_id = :barber_id
        AND bs.day_of_week = EXTRACT(DOW FROM CAST(:date AS DATE))
        AND s.is_active = true
      `,
      {
        replacements: { barber_id, service_id, date },
        type: QueryTypes.SELECT,
      },
    );

    if (!schedule) {
      res.status(200).json({ data: [] });
      return;
    }

    // 2. Consultar citas ocupadas ese día
    const appointments = await sequelize.query<any>(
      `
      SELECT starts_at, ends_at
      FROM appointments
      WHERE barber_id = :barber_id
        AND status IN ('pending', 'confirmed')
        AND (starts_at AT TIME ZONE 'America/Bogota')::DATE =
            CAST(:date AS DATE)
      `,
      {
        replacements: { barber_id, date },
        type: QueryTypes.SELECT,
      },
    );

    // 3. Generar horarios disponibles cada 30 minutos
    const available: string[] = [];

    const start = String(schedule.start_time)
      .slice(0, 5)
      .split(":")
      .map(Number);
    const end = String(schedule.end_time).slice(0, 5).split(":").map(Number);

    const opening = start[0]! * 60 + start[1]!;
    const closing = end[0]! * 60 + end[1]!;
    const duration = Number(schedule.duration_minutes);

    for (let minutes = opening; minutes + duration <= closing; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      const time =
        `${String(hour).padStart(2, "0")}:` +
        `${String(minute).padStart(2, "0")}`;

      const startsAt = new Date(`${date}T${time}:00-05:00`);
      const endsAt = new Date(startsAt.getTime() + duration * 60000);

      // Anticipación mínima de 5 horas
      if (startsAt.getTime() < Date.now() + 5 * 60 * 60 * 1000) {
        continue;
      }

      // Verificar si el horario se cruza con otra cita
      const occupied = appointments.some((appointment) => {
        const existingStart = new Date(appointment.starts_at).getTime();
        const existingEnd = new Date(appointment.ends_at).getTime();

        return (
          startsAt.getTime() < existingEnd && endsAt.getTime() > existingStart
        );
      });

      if (!occupied) {
        available.push(time);
      }
    }

    res.status(200).json({
      message: "Disponibilidad consultada correctamente",
      data: available,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al consultar la disponibilidad",
    });
  }
};

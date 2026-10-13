import User from "./user";
import Service from "./service";
import Appointment from "./appointments";

// Cliente de la cita
Appointment.belongsTo(User, {
  foreignKey: "customer_id",
  as: "customer",
});

// Barbero asignado a la cita
Appointment.belongsTo(User, {
  foreignKey: "barber_id",
  as: "barber",
});

// Servicio reservado
Appointment.belongsTo(Service, {
  foreignKey: "service_id",
  as: "service",
});

export { Appointment, User, Service };

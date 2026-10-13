import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

interface AppointmentAttributes {
  id: number;
  customer_id: number;
  barber_id: number;
  service_id: number;
  starts_at: Date;
  ends_at: Date;
  service_price: string;
  service_duration_minutes: number;
  status: AppointmentStatus;
  customer_notes: string | null;
  created_at?: Date;
  updated_at?: Date;
}

type AppointmentCreationAttributes = Optional<
  AppointmentAttributes,
  "id" | "status" | "customer_notes" | "created_at" | "updated_at"
>;

class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  declare id: number;
  declare customer_id: number;
  declare barber_id: number;
  declare service_id: number;
  declare starts_at: Date;
  declare ends_at: Date;
  declare service_price: string;
  declare service_duration_minutes: number;
  declare status: AppointmentStatus;
  declare customer_notes: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

Appointment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    barber_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    service_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    service_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    service_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    customer_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "appointments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Appointment;

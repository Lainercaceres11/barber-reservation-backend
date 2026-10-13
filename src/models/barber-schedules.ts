import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface BarberScheduleAttributes {
  id: number;
  barber_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

type BarberScheduleCreationAttributes = Optional<
  BarberScheduleAttributes,
  "id"
>;

class BarberSchedule
  extends Model<BarberScheduleAttributes, BarberScheduleCreationAttributes>
  implements BarberScheduleAttributes
{
  declare id: number;
  declare barber_id: number;
  declare day_of_week: number;
  declare start_time: string;
  declare end_time: string;
}

BarberSchedule.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    barber_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    day_of_week: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: {
        min: 0,
        max: 6,
      },
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "barber_schedules",
    timestamps: false,
  },
);

export default BarberSchedule;

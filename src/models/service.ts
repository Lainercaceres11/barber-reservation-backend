import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../config/database";

interface ServiceAttributes {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type ServiceCreationAttributes = Optional<
  ServiceAttributes,
  "id" | "description" | "is_active" | "created_at" | "updated_at"
>;

class Service
  extends Model<ServiceAttributes, ServiceCreationAttributes>
  implements ServiceAttributes
{
  declare id: number;
  declare image_url: string | null;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare duration_minutes: number;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

Service.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    image_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "services",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Service;

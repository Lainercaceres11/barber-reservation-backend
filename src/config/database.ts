import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  logging: false,
});

const dbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection established successfully.");

    await sequelize.sync();
    console.log("Database tables synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export default dbConnection;

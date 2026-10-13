import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import "./models/association";

import dbConnection from "./config/database";
import userRouter from "./routes/user.route";
import authRouter from "./routes/auth.route";
import serviceRouter from "./routes/service.route";
import barberRouter from "./routes/barber.route";
import barberSchedulesRouter from "./routes/barber-schedules.route";
import appointmentRouter from "./routes/appointment.route";

dotenv.config();

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Server barber backend running",
  });
});

//routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/services", serviceRouter);
app.use("/barbers", barberRouter);
app.use("/barbers", barberSchedulesRouter);
app.use("/appointments", appointmentRouter);

app.listen(PORT, async () => {
  dbConnection();
  console.log(`Server runnin on port ${PORT}`);
});

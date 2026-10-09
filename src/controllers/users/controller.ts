import { Request, Response } from "express";
import User from "../../models/user";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"],
    });

    if (!users) {
      return res.status(400).json({ message: "users not found" });
    }

    return res.status(200).json({ message: "Users", data: users });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

import { Request, Response } from "express";
import User from "../../models/user";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../../utils/upload-to-cloudinary";

export const getAllBarber = async (req: Request, res: Response) => {
  try {
    const barber = await User.findAll({
      where: { role: "barber", is_active: true },
      attributes: {
        exclude: ["password_hash"],
      },
    });

    if (!barber) {
      return res.status(404).json({ message: "barber not found" });
    }

    return res.status(200).json({ message: "Barbers", data: barber });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getBarberById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string" || !id) {
    return res.status(404).json({ message: "Id is required" });
  }
  try {
    const barber = await User.findOne({
      where: {
        id,
        role: "barber",
        is_active: true,
      },
      attributes: {
        exclude: ["password_hash"],
      },
    });

    if (!barber) {
      return res.status(404).json({ message: "barber not found" });
    }

    return res.status(200).json({ message: "Barber", data: barber });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createBarber = async (req: Request, res: Response) => {
  const { name, email, phone, password_hash } = req.body;
  const image = req.file;

  if (!name || !email || !password_hash) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  }

  if (password_hash.length < 8) {
    return res.status(400).json({ message: "Password is to short" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  const existEmail = await User.findOne({
    where: { email: email },
  });

  if (existEmail) {
    return res.status(400).json({ message: "User email exist" });
  }

  const encrypted_password = await bcrypt.hash(password_hash, 10);

  try {
    let imageUrl: string | null = null;

    if (image) {
      const uploadedImage = await uploadToCloudinary(image, "users");
      imageUrl = uploadedImage.secure_url;
    }
    const newUser = await User.create({
      name,
      email,
      phone,
      image_url: imageUrl,
      password_hash: encrypted_password,
      role: "barber",
    });

    const { password_hash: _, ...barberData } = newUser.toJSON();

    return res
      .status(201)
      .json({ message: "Barber created", data: barberData });
  } catch (error) {
    console.log("Register error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateBarber = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  if (!id || typeof id != "string") {
    return res.status(404).json({ message: "Id must be string" });
  }

  if (!name || !email || !phone) {
    return res.status(400).json({ message: "All field are required" });
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
      return res.status(404).json({ message: "barber not found" });
    }

    await barber.update({ name, email, phone });

    const { password_hash: _, ...barberData } = barber.toJSON();

    return res
      .status(200)
      .json({ message: "Barber updated susccesfully", data: barberData });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteBarber = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id != "string") {
    return res.status(400).json({ message: "Id must be string" });
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
      return res.status(404).json({ message: "Barber not found" });
    }

    await barber.update({ is_active: false });

    return res.status(200).json({
      message: "Barber deactivated successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

import { Request, Response } from "express";
import Service from "../../models/service";
import { uploadToCloudinary } from "../../utils/upload-to-cloudinary";

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
    });

    if (!services) {
      return res.status(404).json({ message: "services not found" });
    }

    return res.status(200).json({ message: "Services", data: services });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getServicesById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string" || !id) {
    return res.status(404).json({ message: "Id is required" });
  }
  try {
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "service not found" });
    }

    return res.status(200).json({ message: "Services", data: service });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createService = async (req: Request, res: Response) => {
  const { name, description, price, duration_minutes } = req.body;
  const image = req.file;

  const parsedPrice = Number(price);
  const parsedDuration = Number(duration_minutes);

  if (
    typeof name !== "string" ||
    !name.trim() ||
    (description !== undefined &&
      description !== null &&
      typeof description !== "string") ||
    price === undefined ||
    price === "" ||
    !Number.isFinite(parsedPrice) ||
    parsedPrice < 0 ||
    duration_minutes === undefined ||
    duration_minutes === "" ||
    !Number.isInteger(parsedDuration) ||
    parsedDuration <= 0
  ) {
    return res.status(400).json({
      message: "Invalid service data",
    });
  }

  try {
    let imageUrl: string | null = null;

    if (image) {
      const uploadedImage = await uploadToCloudinary(image, "services");
      imageUrl = uploadedImage.secure_url;
    }

    const newService = await Service.create({
      name: name.trim(),
      description,
      price: parsedPrice,
      duration_minutes: parsedDuration,
      image_url: imageUrl,
    });

    return res.status(201).json({
      message: "Service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error("Error creating service:", error);

    return res.status(500).json({
      message: "Error creating service",
    });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, duration_minutes } = req.body;

  if (!id || typeof id != "string") {
    return res.status(404).json({ message: "Id must be string" });
  }

  if (!name || !description || !price || !duration_minutes) {
    return res.status(400).json({ message: "All field are required" });
  }

  try {
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const updateService = await Service.update(
      { description, duration_minutes, name, price },
      {
        where: { id },
      },
    );

    return res
      .status(200)
      .json({ message: "Service updated susccesfully", data: updateService });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id != "string") {
    return res.status(400).json({ message: "Id must be string" });
  }

  try {
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const deleteService = await Service.update(
      { is_active: false },
      {
        where: { id },
      },
    );

    return res.status(200).json({
      message: "Service deactivated susccesfully",
      data: deleteService,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

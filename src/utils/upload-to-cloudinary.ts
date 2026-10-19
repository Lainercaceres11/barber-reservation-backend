import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `klip-barbershop/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }

        if (!result) {
          return reject(new Error("No se recibió respuesta de Cloudinary."));
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

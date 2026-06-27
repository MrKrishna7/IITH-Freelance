import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET, 
});
const onCloudinary = async (filePath) => {
  if (!filePath) return null;
  try {
    const uploaded = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    console.log("img uploaded ", uploaded.original_filename);
    await fs.unlinkSync(filePath);
    return uploaded;
  } catch (err) {
    await fs.unlinkSync(filePath);
    console.log("Error uploading image ", err.message);
    return null;
  }
};
export { onCloudinary };

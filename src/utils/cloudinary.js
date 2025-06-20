import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dd7rzfpcx',
    api_key: process.env.CLOUDINARY_API_KEY || '325267138495394',
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.error("Error uploading file to Cloudinary:", error);
        throw error;
    }
}

const deleteClodudinaryFiles = async (publicId, resource_type) => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resource_type })
    } catch (error) {
        console.log("Error in delete cloudinary files", error)
        throw error
    }
}

export { uploadOnCloudinary, deleteClodudinaryFiles }

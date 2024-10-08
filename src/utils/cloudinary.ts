import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiError";

type Result = {
  publicId: string;
  url: string;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


//* Old upload function
// const uploadOnCloudinar = async (localFilePath: string) => {
//     try {
//         if (!localFilePath) return null
//         //upload the file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto",
//             folder: "myVideoChatApp/userProfilePictures",
//         })

//         fs.unlinkSync(localFilePath)
//         return response;

//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// }

const uploadOnCloudinary = async (files: Express.Multer.File[] = []) => {
  const uploadPromise: Promise<UploadApiResponse>[] = files.map((file) => {
    return new Promise((resolve, reject) => {
      let folder = "myVideoChatApp/userProfilePictures";
      if(file.fieldname === "files") {
        folder = "myVideoChatApp/chatFiles";
      }
      cloudinary.uploader.upload(
        file.path,
        {
          resource_type: "auto",
          folder: folder,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result !== undefined) {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error removing file", err);
            });
            resolve(result);
          } else {
            reject(new Error("Upload result is undefined"));
          }
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromise);
    return results.map((result): Result => {
      return {
        publicId: result.public_id,
        url: result.url,
      };
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new ApiError(500, "Error uploading files");
  }
};

const deleteOnCloudinary = async (publicId: string, resource_type: string) => {
  try {
    await cloudinary.api.delete_resources([publicId], {
      type: "upload",
      resource_type: resource_type
    });
    
    console.log(`Successfully deleted resource: ${publicId}`);
  } catch (error) {
    console.error('Error deleting resource from Cloudinary:', error);
    throw error;
  }
};

export { deleteOnCloudinary, uploadOnCloudinary };

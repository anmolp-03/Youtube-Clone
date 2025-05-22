import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY , 
    api_secret:process.env.CLOUDINARY_API_SECRET 
});
// console.log("Cloudinary Config:", cloudinary.config());


const uploadOnCloudinary = async (localFilePath, resourceType="auto") => {
    try{
        if (!localFilePath) return null;

        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
        });

        console.log('File uploaded successfully on Cloudinary ', response.url);

        fs.unlinkSync(localFilePath)
        return response
    }
    catch (error) {
        // error aati hai toh file ko apne server se remove krdo
        // kyuki malicious ya corrupted file reh jaayegi nhi toh
        try {
            fs.unlinkSync(localFilePath); // Changed to the synchronous version
            console.log('info', `Local file ${localFilePath} deleted due to upload error.`);
        } catch (unlinkError) {
            console.log('error', 'Error deleting local file:', unlinkError);
        }
        
        console.error('Error uploading file on Cloudinary ', error);
        return null;

    }
}

export {uploadOnCloudinary}

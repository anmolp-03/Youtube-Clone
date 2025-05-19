import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY , 
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null;

        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        console.log('File uploaded successfully on Cloudinary ', response.url);

        return response
    }
    catch (error) {
        // error aati hai toh file ko apne server se remove krdo
        // kyuki malicious ya corrupted file reh jaayegi nhi toh
        fs.unlink(localFilePath)
        
        console.error('Error uploading file on Cloudinary ', error);
        return null;

    }
}

export {uploadOnCloudinary}

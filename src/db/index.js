import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB = async() => {
    try{
        const connectionObj = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDB connected successfully!! DB Host: ${connectionObj.connection.host}`)
    } catch(error){
        console.log("MongoDB connection error: ", error);
        process.exit(1);    // current process exit
    }
}

export default connectDB
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path: "./.env",
})

connectDB()         //db connect hone ke baad kuch promises return krta hai
.then(()=> {        // isliye then catch
    app.listen(process.env.PORT || 8000, ()=>{
        console.log("Server is running on port : ", process.env.PORT);
    })
    console.log("Database connected");
})             
.catch((error) => {
    console.log("MongoDB connection failed :( ", error);
})

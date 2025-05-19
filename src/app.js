import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true
}))

//ab alag alag origin se data aa rha toh alag format ho skti

// suppose hum json data accept kr rhe toh kitna kar rhe
app.use(express.json({ limit:"16kb" }))

//url data
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(express.static("public"))   //kuch aur images ya pdf ya kuch aaya jo hum store krna chahte ... toh static in public folder

//user ke browser ki cookies access aur set kr paaye 
app.use(cookieParser())  

//Routes import
import userRouter from "./routes/user.routes.js"

//router activation  
app.use("/api/v1/users", userRouter)

// ye /users will go to /users/register


export { app }
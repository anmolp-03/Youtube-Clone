import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,            //google search easy krne ke liye
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
    },
    avatar:{
        type: String,       // cloudinary ka url store hoga 
        required: true,
    },
    coverImage: {
        type: String,       
    },
    password:{
        type: String,
        required: [true, "Password is required"],
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        }
    ],
    refreshToken: {
        type: String,
    }

    // bcrypt passwords hash krta h
    // jwt tokens banaate h


},{timestamps: true})

//jab bhi save krna ho user data uske pehle encryption ho
// ab pwd encryption decryption takes time ... so async
// middleware 'next' hoga tabhi just uske pehle ye 'pre' run hoga

userSchema.pre("save", async function (next) {
    // agar password em koyi modification krna ho toh hi
    // esa nhi ki any field change ke baad save krne pr pwd change ho jaaye
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10)
    }   
    next()
} )

//check if password is correct
// await bcrypt.compare(password, this.password) pauses the execution of isPasswordCorrect until the password comparison is done. 

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

//jwt tokens are like keys
// jo hume token bhejega, hum usse data bhej denge
userSchema.methods.generateAcessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema )
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => {
    const {username, fullname, email, password} = req.body
    console.log("Email: ", email);

    if(fullname===""){
        throw new ApiError(400, "Fullname is required!")
    }

    if(username===""){
        throw new ApiError(400, "Username is required!")
    }

    if(email===""){
        throw new ApiError(400, "Email is required!")
    }

    if(password===""){
        throw new ApiError(400, "Password is required!")
    }

    // if( 
    //     [fullName , email ,username , password ].some( (feild) => 
    //         feild?.trim() === ""
    //     )
    //  ) {
    //     throw new ApiError( 400 , "all feilds are required" ) 
    // }


    // check if user already exists?
    // user model will itself call mongoDB
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) throw new ApiError(409, "User with email or username already exists");

    // check images and avatar
    // wese req.body me sab data mil jata hai express ke thru
    // but kyuki humne routes me middleware add kra hai register user ek pehle
    // toh multer hume req.files me se image au avatar deta h\
    // check user.routes.js

    //multer ek local path laakr dega

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is empty")

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError(400, "Avatar is empty")

    // sab le liya ho toh object banao aur databse me entry krdo
    // user hi baat kr rha database se

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",      //not compulory, can be empty
        email,
        username: toLowerCase(),
        password
    })

    // check krlo user bana ki nhi aur saath me password aur token remove krdo
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) throw new ApiError(500, "Something went wrong while registering the User")
        
    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully ! :))")
    )

})

export { registerUser }


// 1. get user data from frontend
//      but we don't have frontend so we take it from postman
// 2. then validate data
// 3. check if user already exists : username, email
// 4. check image
// 4. check avatar
// 5. upload them to cloudinary, check avatar
// 6. create user object - db me send krne ke liye 
// 6. create entry in db
// 7. remove password and refresh token field from response
// 8. check for user creation
// 9. resturn res
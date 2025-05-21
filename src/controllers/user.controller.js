import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { verifyJWT } from "../middleware/auth.middleware.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // access token user ko dedenge
        // refresh token db me bhi save krna rehta h
        user.refreshToken = refreshToken
        await user.save(
            {validateBeforeSave : false}
        )

        return {refreshToken, accessToken}

    } catch(err){
        throw new ApiError(500, "Something went wrong while generating Tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
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
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    } else {
        coverImageLocalPath = ""; // or handle missing cover image case
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is empty")

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError(400, "Avatar not uploaded on cloudinary")

    // sab le liya ho toh object banao aur databse me entry krdo
    // user hi baat kr rha database se

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",      //not compulory, can be empty
        email,
        username: username.toLowerCase(),
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

const loginUser = asyncHandler( async (req, res) => {
    // 1. req body data le aao
    // 2. username or email?
    // 3. find the user
    // 4. check password
    // 5. generate access and refresh token
    // 6. return tokens as cookies
    
    const {email, username, password} = req.body

    if(!(email || username)){
        throw new ApiError(400, "Provide username or email for Login!")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) throw new ApiError(404, "User Not Found!")

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(401, "Invalid User Password!")

    // generate access and refresh token 
    // ye boht baar use krenge
    // isliye iska alag method upar banaya h
    const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // ab ye tokens toh naye method se aa gye
    // pr hume toh user se associated chahiye
    // user ke andar tokens ki field abhi bhi empty h

    //cookies
    const options = {
        httpOnly: true,
        secure: true            //this makes cookies only modifiable from server
    }

    return res
    .status(200)
    .cookie("AccessToken", accessToken,options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully!"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    // ab login register me toh hum userinfo le rhe 
    // aur phir usko db me find krke modify kr rhe
    // pr logout ke time thodi hum user se input le skte
    // toh usko find kese kre db me?
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true            //this makes cookies only modifiable from server
    }

    return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200,{}, "User logged out"))
})

// accessToken ka endpoint (matlab wo khtm hone waala ho)
// tab usko refreshToken ke thru regenerate krenge
const refreshAccessToken = asyncHandler( async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            throw new ApiError(401, "Unauthorised request of refresh token")
        }
    
        //decode krlo token ko
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if( !user ){
            throw new ApiError( 401 , "Invalid user decoded refresh token")
        }
    
        if(incomingRefreshToken != user?.refreshToken){
            throw new ApiError( 401 , "refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true , 
            secure : true 
        } 
        
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .clearCookie("AccessToken", options)
        .clearCookie("RefreshToken", options)
        .json(new ApiResponse(200,{
            accessToken,
            refreshToken: newrefreshToken
        }, "Access Token Refreshed Successfully!"))
    } catch (error) {
        throw new ApiError( 401 , error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        // ab change password ho pa rha 
        // matlab user logged in hai => login hua kyuki middleware lagaya auth wala
        // aur middleware last me req.user=user krdiya tha
        // matlab apan usse user le aa skte
        const user = await User.findById(req.user?._id)

        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if(!isOldPasswordCorrect) throw new ApiError(400, "Invalid Old Password!")

        user.password = newPassword

        // middleware run hone se pehle ek 'pre' run hoga jo user model me banaya tha
        await user.save({validateBeforeSave: false})

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully!"))
    } catch (error) {
        throw new ApiError( 400 , error?.message || "Invalid Request")
    }
})

const getCurrentUser = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json( new ApiResponse(200 , req.user , "Current User fetched successfully"))
})

const updateProfileDetails = asyncHandler( async (req,res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "Please fill all fields")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                fullname: fullname,
                email: email
            }
        }, 
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200 ,user , "Account details updated successfully"  ))
})

//files update krni ho
// multer middleware ke thru files accept kr skte
// only logged in people can do that

const updateAvatar = asyncHandler( async (req,res) => {

    // req.files liya tha upar kyuki multiple files leni thi udhr
    // yaha pr hume ek hi file chahiye
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required!")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400, "Error while uploading avatar!")

    await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                avatar: avatar.url
            }
        }, 
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200 , req.user , "Avatar updated successfully"))
})

const updateCoverImage = asyncHandler( async (req,res) => {

    const coverImageLocalPathLocalPath = req.file?.path

    if(!coverImageLocalPathLocalPath) throw new ApiError(400, "Cover Image file is required!")

    const coverImage = await uploadOnCloudinary(coverImageLocalPathLocalPath)

    if(!coverImage.url) throw new ApiError(400, "Error while uploading Cover Image!")

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                coverImage: coverImage.url
            }
        }, 
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200 , req.user , "Cover Image updated successfully"))
})

// aggregate pipeline use krte hai
// toh db me aggregate function lagaaye toh uss array ka harr ek object ek stage hoga

// ab user model se hume subscription model ko connect krna hai
// aur intention to connect this (no. of subscribers, follow/unfollow flag, no. of sunscribed)

const getUserChannelProfile = asyncHandler( async (req, res) => {
    // this function basically aggregates normal User and CHannel user
    // i.e. subscribers and users ( check subscription.model , you'll understand)

    // hume username url se milega 
    const {username} = req.params

    if(!username?.trim) throw new ApiError("Username is missing!")

    // username se hum db me find kr skte
    // pr usse pura object milega phir usme se id lenge
    // isse better hai hum aggregation pipeline me ek match() hota hai
    // jo basically join ki tarah kaam krta
    console.log("username: ", username);

    const channel = await User.aggregate([
        {
            $match: {       //pipeline 1 me humne username match krke nikaal liya
                username: username?.toLowerCase()
            }
        },
        {                       // pipeline 2 me hume uss user ko kitno ne subscribe kr rkha hai
            $lookup: {
                from: "subscriptions",       // model me se sab lowercase aur plural
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {                       // pipeline 3 me uss user ne kitno ko subscribe kr rkha hai wo count
            $lookup: {
                from: "subscriptions",       
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {                       // pipeline 4 me kuch nayi fields add krenge
            $addFields: {
                subscribersCount: {         // pipeline 2 me jo saare documents jama ho gye unko count krenge
                    $size: "$subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {             // subscribe/subscribed button
                    $cond: {                // jo document hai usme subscribers ki list me hum h ki nhi
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {         // pipeline 5 - display
                fullname: 1,
                username: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedTo: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    console.log("channel: ",channel)

    if(!channel?.length){
        throw new ApiError(400, "Channel doesn't exist ")
    }

    return res
    .status(200)
    .json( new ApiResponse(200 , channel[0] , "User Channel Fetched successfully"))
})

// nested lookup concept 
// watch video 21 for this
const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //ab owner ki saari info aa gyi pr hume sab nhi chahie
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json( new ApiResponse(200 , user[0].watchHistory , "Watch history Fetched successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateProfileDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}



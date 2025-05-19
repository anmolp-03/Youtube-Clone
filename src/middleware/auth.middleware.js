import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

/**
 JWT (JSON Web Token) is a secure way to verify user identity. 
 It's like a digital ID card that a user gets after logging in. 
 The server uses this token to check if a user is authenticated.
*/

// The token can be stored in cookies (like small files on your computer) or in the request header.

// verify user tokens
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // token ka access kese loge?
        // req ke pass cookies ka access h
        // jo cookie-parser ke thru diya humne
        const token = req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401, "Unauthorised request")
        }
    
        // Verify the JWT token using the secret key from environment variables
        // This checks whether the token is genuine and not tampered with
        const decodedTokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        console.log("this is decoded jwt from authMiddleware...") ; 
        console.log(decodedTokenInfo) ; 
    
        const user = await User.findById(decodedTokenInfo?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401 , "Invalid access token")
        }
    
        // Attach the authenticated user to the request object for use in subsequent middleware or route handlers
        req.user = user ;

        // move to next middleware
        next()

    } catch (error) {
        throw new ApiError( 401 , error?.message || "invalid access token" )
    }
})
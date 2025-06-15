import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized access, token is missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        if (!decodedToken) {
            throw new ApiError(401, "Unauthorized access, invalid token");
        }

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Unauthorized access");
    }

})
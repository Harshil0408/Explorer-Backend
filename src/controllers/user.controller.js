import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
}

export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, username } = req.body;

    if (
        [fullName, email, password, username].some(field => field.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [
            { username }, { email }
        ]
    })

    if (existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new APiResponse(201, createdUser, "User registered successfully")
    )
})

export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username || !email) {
        throw new ApiError(400, "Username or email are required");
    }

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await user.comparePassword(password)
        .then(isMatch => {
            if (!isMatch) {
                throw new ApiError(401, "Invalid password");
            }
        });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");;

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new APiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        ));

})

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: "" }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APiResponse(200, null, "User logged out successfully"));

})
import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/coudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - check if details are empty
    // upload them on cloudinary
    // create user object- create entry in db
    // remove pass and refresh token field from response
    // check for user creation
    // return response

    const { email, password, username, fullname } = req.body
    // console.log("fullname:"+fullname+"email:"+email + "username: " +username+ "pasword:"+password)

    if (
        [email, password, username, fullname].some((field) => (field || "").trim() === "")) {
        throw new ApiError(400, "Details cannot be empty")
    }

    // check if user already exists:email, username
    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() },
        { email: email.toLowerCase() }]
    })
    if (existedUser)
        throw new ApiError(409, "Username or email already exist")

    // console.log(req.files.avatar[0].path)

    // check for images, avatar
    const avatarFilePath = req.files?.avatar[0]?.path
    // const coverImageFilePath = req.files?.coverImage[0]?.path

    let coverImageFilePath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageFilePath = req.files.coverImage[0].path
    }

    if (!avatarFilePath)
        throw new ApiError(400, "Avatar file is required ")

    const avatar = await uploadOnCloudinary(avatarFilePath)
    const coverImage = await uploadOnCloudinary(coverImageFilePath)

    // console.log(avatar)
    if (!avatar)
        throw new ApiError(400, "Avatar file is required 2")

    const createdUser = await User.create({
        username: username.toLowerCase(),
        fullname,
        password,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const user = await User.findById(createdUser._id).select("-password -refreshToken")

    if (!user)
        throw new ApiError(500, "Something went wrong while creating the user")

    return res.status(201).json(
        new ApiResponse(201, "User registered successfully", user)
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req.body -> data
    const { username, password, email } = req.body

    // check username or email
    if (!username && !email) {
        throw new ApiError(400, "Username or email required !!")
    }
    if (username && email) {
        throw new ApiError(400, "Provide either username or email,not both")
    }

    // find user
    const user = await User.findOne(username ? { username: username.toLowerCase() } : { email: email.toLowerCase() })

    if (!user)
        throw new ApiError(401, "wrong user credentials")

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid)
        throw new ApiError(401, "Wrong user credentials")

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    // const loggedInUser = User.findById(user._id).select("-password -refreshToken") //this basically means give all the data of the user in loggedInUser except password and refresh Token

    const loggedInUser = user.toObject();
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;

    const options = ({
        httpOnly: true,
        secure: true
    })

    res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                "User successfully logged in !",
                {
                    user: loggedInUser, accessToken, refreshToken
                }
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true
        }
    )

    console.log(user)
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User logged out successfully", {})
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken)
        throw new ApiError(401, "Invalid refresh Token")

    console.log(incomingRefreshToken)
    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET)
    console.log(decodedToken)

    const user = await User.findById(decodedToken?._id)
    if (!user)
        throw new ApiError(401, "Invalid refresh token")

    if (incomingRefreshToken !== user?.refreshToken)
        throw new ApiError(401, "Refresh Token expired") //sending this error message because if user doesn't contain refresh token that means refresh token has been expired

    const { newRefreshToken, accessToken } = generateAccessAndRefreshToken(user._id)

    console.log(`refresh token :${newRefreshToken} , access token: ${accessToken}`)

    const options = {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, "refresh token generated successfully",
                { newRefreshToken, accessToken }
            )
        )


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
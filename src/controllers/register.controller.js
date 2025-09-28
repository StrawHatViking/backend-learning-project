import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/coudinary.js";
import ApiResponse from "../utils/apiResponse.js";

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
        [email, password, username, fullname].some((field) => (field||"").trim() === "")) {
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
export default registerUser
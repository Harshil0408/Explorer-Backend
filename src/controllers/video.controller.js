import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { Video } from '../models/video.model.js'
import { APiResponse } from '../utils/apiResponse.js'

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const result = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: {
                    isPublished: true,
                    ...(userId && { owner: userId }),
                    ...(query && { title: { $regex: query, $options: "i" } })
                }
            },
            {
                $sort: {
                    [sortBy]: sortType === 'asc' ? 1 : -1
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                    owner: 1
                }
            }
        ]),
        {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    )

    return res.status(200).json(
        new APiResponse(200, result, "Videos fetched successfully")
    )

});


const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    const videoFile = req.files?.videoFile?.[0]?.path
    const thumbnail = req.files?.thumbnail?.[0]?.path

    console.log({ title, description, videoFile, thumbnail })

    if (!title || !description || !videoFile || !thumbnail) {
        throw new ApiError(400, "All fields are required")
    }

    const videoUploadedOnCloudinary = await uploadOnCloudinary(videoFile)
    const thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnail)

    const duration = videoUploadedOnCloudinary?.duration

    const newVideo = await Video.create({
        title,
        description,
        duration: `${Math.floor(duration)}s`,
        videoFile: videoUploadedOnCloudinary.secure_url,
        thumbnail: thumbnailUploadOnCloudinary.secure_url,
        owner: req.user._id,
        isPublished: true,
        views: 0
    })

    return res.status(200).json(
        new APiResponse(200, newVideo, "Video published successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const result = await Video.findById(videoId)

    if (!result) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(
        new APiResponse(200, result, "Video fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const result = await Video.findByIdAndDelete(videoId)

    if (!result) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(
        new APiResponse(200, "Video deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

   

})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
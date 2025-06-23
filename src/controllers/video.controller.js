import mongoose from 'mongoose'
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/apiError.js'
import { Video } from '../models/video.model.js'
import { APiResponse } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { VideoView } from '../models/videoview.model.js'
import { deleteClodudinaryFiles, uploadOnCloudinary } from '../utils/cloudinary.js'
import { Like } from '../models/like.model.js'

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

    if (!title || !description || !videoFile || !thumbnail) {
        throw new ApiError(400, "All fields are required")
    }

    const videoUploadedOnCloudinary = await uploadOnCloudinary(videoFile)
    const thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnail)

    const videoPublicId = videoUploadedOnCloudinary.public_id
    const thumbnailPublicId = thumbnailUploadOnCloudinary.public_id

    const duration = videoUploadedOnCloudinary?.duration

    const newVideo = await Video.create({
        title,
        description,
        duration: `${Math.floor(duration)}s`,
        videoFile: videoUploadedOnCloudinary.secure_url,
        videoPublicId,
        thumbnail: thumbnailUploadOnCloudinary.secure_url,
        thumbnailPublicId,
        owner: req.user._id,
        isPublished: true,
        views: 0
    })

    return res.status(200).json(
        new APiResponse(200, newVideo, "Video published successfully")
    )

})
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    const result = await Video.findById(videoId).populate("owner", "username avatar");
    if (!result) throw new ApiError(404, "Video not found");

    const videoView = await VideoView.findOne({ user: userId, video: videoId });

    if (!videoView) {
        await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
        videoView = await VideoView.create({ user: userId, video: videoId, watchedTime: 0 });
    }

    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    await User.findByIdAndUpdate(userId, {
        $addToSet: { watchHistory: videoObjectId }
    });

    return res.status(200).json(
        new APiResponse(200, result, "Video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const updates = req.body

    const videoFile = req.files?.videoFile?.[0]?.path
    const thumbnail = req.files?.thumbnail?.[0]?.path

    const video = await Video.findById(videoId)
    if (!video) {
        new APiResponse(200, "Video not found")
    }

    if (videoFile) {
        try {
            const newVideoUpload = await uploadOnCloudinary(videoFile)

            if (video.videoPublicId) {
                await deleteClodudinaryFiles(video.videoPublicId, "video")
            }

            video.videoFile = newVideoUpload.secure_url
            video.videoPublicId = newVideoUpload.public_id
            video.duration = `${Math.floor(newVideoUpload.duration)}`

        } catch (error) {
            throw new ApiError(500, "Failed to update video")
        }
    }

    if (thumbnail) {
        try {
            const newThumbnailUpload = await uploadOnCloudinary(thumbnail)

            if (video.thumbnailPublicId) {
                await deleteClodudinaryFiles(video.thumbnailPublicId, "image")
            }

            video.thumbnail = newThumbnailUpload.secure_url
            video.thumbnailPublicId = newThumbnailUpload.public_id
            video.duration = `${Math.floor(newThumbnailUpload.duration)}`
        } catch (error) {
            throw new ApiError(500, "Failed to update thumbnail")
        }
    }

    if (updates && Object.keys(updates).length > 0) {
        Object.keys(updates).forEach((key) => {
            video[key] = updates[key]
        })
    }

    await video.save()

    return res.status(200).json(
        new APiResponse(200, video, "Video data updated successfully")
    )

});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    try {
        if (video.videoPublicId) {
            await deleteClodudinaryFiles(video.videoPublicId, "video")
        }
    } catch (error) {
        console.log("Failed to delete video")
    }

    try {
        if (video.thumbnailPublicId) {
            await deleteClodudinaryFiles(video.thumbnailPublicId, "image")
        }
    } catch (error) {
        console.log("Failed to delte thumbnail")
    }

    await video.deleteOne()

    return res.status(200).json(
        new APiResponse(200, null, "Video is deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not fount")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res.status(200).json(
        new APiResponse(200, null, `Video has been ${video.isPublished ? 'published' : "unpublished"}`)
    )

})

const getTrendingVideos = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    const videos = Video.aggregate([
        {
            $match: { isPublished: true }
        },
        {
            $sort: {
                views: -1
            }
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: 'likes',
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: 'owner',
                foreignField: '_id',
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                likeCount: { $size: "$likes" },
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])

    return res.status(200).json(
        new APiResponse(200, videos, "Trending videos fetched successfully")
    );

})

const getWatchUserHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const user = await User.findById(userId)
        .populate({
            path: "watchHistory",
            options: { sort: { createdAt: -1 } },
            populate: {
                path: "owner",
                select: "username avatar"
            },
            select: "title thumbnail duration views createdAt owner"
        })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new APiResponse(200, user.watchHistory, "Watch history fetched successfully")
    );

})

const getCreatorDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const stats = await Video.aggregate([
        {
            $match: {
                owner: userId,
                isPublished: true
            }
        },
        {
            $lookup: {
                from: 'likes',
                localField: "_id",
                foreignField: 'video',
                as: 'likes'
            }
        },
        {
            $project: {
                title: 1,
                views: 1,
                likeCount: { $size: '$likes' }
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: "$likeCount" },
                topVideos: {
                    $first: {
                        $arrayElemAt: [
                            {
                                $slice: [
                                    {
                                        $sortArray: {
                                            input: "$$ROOT",
                                            sortBy: { views: -1 }
                                        }
                                    },
                                    1
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        }
    ])

    if (!stats.length) {
        return res.status(200).json(new APiResponse(200, {
            totalVideos: 0,
            totalViews: 0,
            totalLikes: 0,
            topVideos: null
        }, "Dashboard stats fetched"))
    }

    return res.stats(200).json(
        new APiResponse(200, stats[0], "Dashboard stats fetched")
    )

})

const updateWatchProgress = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { watchedTime } = req.body
    const userId = req.user._id

    if (!videoId || watchedTime === null) {
        throw new ApiError(400, "VideoId and watched time are required")
    }

    const updated = await VideoView.findByIdAndUpdate(
        { user: userId, video: videoId },
        { $max: { watchedTime } },
        { new: true, upsert: true }
    )

    return res.status(200).json(
        new APiResponse(200, { watchedTime: updated.watchedTime }, "Watch progress updated")
    )

})

export const softDeleteVideos = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    const video = await Video.findOne({ _id: videoId, owner: userId })

    if (!video) {
        throw new ApiError(404, "Video not found or unauthorized")
    }

    video.isDeleted = true
    await Video.save()

    return res.status(200).json(
        new APiResponse(200, null, "Video deleted successfully")
    )

})

export const reportVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { reason } = req.body
    const userId = req.user._id

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!reason || reason.trim() === '') {
        throw new ApiError(400, "Reason is requied to report a video")
    }

    if (video.reportedBy.includes(userId)) {
        throw new ApiError(400, "You have already reported this video")
    }

    video.reportedBy.push(userId)
    video.reportReason = reason
    await video.save()

    return res.stats(200).json(
        new APiResponse(200, null, "Video reported successfully")
    )

})

const downloadVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { downloads: 1 } },
        { new: true }
    )

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res.stats(200).json(
        new APiResponse(200, { videoFile: video.videoFile }, "Video download link fetched")
    )

})

export const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {
            $match: { likedBy: userId, video: { $ne: null } }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'videoDetails'
            }
        },
        {
            $unwind: 'videoDetails'
        },
        {
            $lookup: {
                from: 'users',
                localField: 'videoDetails.owner',
                foreignField: '_id',
                as: 'owner'
            }
        }, {
            $unwind: '$owner'
        },
        {
            $project: {
                video: {
                    _id: "$videoDetails._id",
                    title: "$videoDetails.title",
                    thumbnail: "$videoDetails.thumbnail",
                    views: "$videoDetails.views",
                    duration: "$videoDetails.duration",
                    createdAt: "$videoDetails.createdAt"
                },
                owner: {
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])

    return res.status(200).json(
        new APiResponse(200, likedVideos, "Liked videos fetched successfully")
    );

})

export const getPrivateVideosAllowedToUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Video.find({
        isPrivate: true,
        allowedUsers: userId,
        isDeleted: false
    }).populate("owner", "username avatar");

    return res.status(200).json(
        new APiResponse(200, videos, "Private videos fetched successfully")
    );
});

export const getSuggestedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const user = await User.findById(userId).select("blockedUsers")
    const blockedUsers = user?.blockedUsers || []

    const suggestedVideos = await Video.aggregate([
        {
            $match: {
                isPublished: true,
                isDeleted: false,
                owner: { $nin: blockedUsers }
            }
        },
        {
            $sample: { size: 10 }
        },
        {
            $lookup: {
                form: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        {
            $unwind: 'owner'
        }, {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])

    return res.stats(200).json(
        new APiResponse(200, suggestedVideos, "Suggested videos fetched")
    )

})

export const searchVideosWithFilters = asyncHandler(async (req, res) => {
    const { query = '', tags = [], minDuration = 0, maxDuration = 10000, page = 1, limit = 10 } = req.query

    const searchQuery = {
        isPublished: true,
        isDeleted: true,
        title: { $regex: query, $options: 'i' },
        duration: { $gte: `${minDuration}`, $lte: `${maxDuration}` },
        ...(tags.length > 0 && { tags: { $in: tags.map(tag => tag.toLowerCase()) } })
    }

    const result = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: searchQuery
            }, {
                $lookup: {
                    from: "users",
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            {
                $unwind: 'owner'
            },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    tags: 1,
                    createdAt: 1,
                    owner: {
                        _id: "$owner._id",
                        username: "$owner.username",
                        avatar: "$owner.avatar"
                    }
                }
            }
        ]),
        {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    )

    return res.status(200).json(
        new APiResponse(200, result, "Seach result found")
    )

})

const getVideoAnaylitcs = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    const viewsCount = await VideoView.countDocuments({ video: videoId })
    const totalWatchTime = await Video.aggregate([
        { $match: { video: video._id } },
        { $group: { _id: null, total: { $sum: "$watchedTime" } } }
    ])

    const likeCount = await Like.countDocuments({ video: videoId })

    return res.stats(200).json(
        new APiResponse(200, {
            views: viewsCount,
            totalWatchTime: totalWatchTime?.[0]?.total || 0,
            likes: likeCount
        }, "Video analytics fetched")
    )

})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
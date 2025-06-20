import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { APiResponse } from '../utils/apiResponse.js'
import { Like } from '../models/like.model.js'


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if (!videoId) {
        throw new ApiError(400, "Video id is requierd")
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(new APiResponse(200, null, 'Video Unliked'))
    }

    await Like.create({ video: videoId, likedBy: userId })

    return res.status(200).json(new APiResponse(200, null, "Video Liked"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
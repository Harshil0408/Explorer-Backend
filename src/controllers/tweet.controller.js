import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { Tweet } from "../models/tweet.model.js"
import { APiResponse } from '../utils/ApiResponse.js'
import mongoose from "mongoose"
import { text } from "express"

const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Content can't be empty")
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweet = Tweet.create({
        content,
        owner: userId
    })

    return res.status(200).json(
        new APiResponse(200, tweet, "Tweet craeted successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweets = Tweet.find({ owner: userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new APiResponse(200, tweets, "Tweets fetched successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    const userId = req.user._id

    if (!mongoose.Types.ObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "Tweet not found")

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    tweet.content = content || tweet.content
    await tweet.save()

    return res.status(200).json(
        new APiResponse(200, tweet, "Tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id

    if (!mongoose.Types.ObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }

    const tweet = Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await tweet.deleteOne()

    return res.status(200).json(
        new APiResponse(200, null, "Tweet deleted successfully")
    )

})
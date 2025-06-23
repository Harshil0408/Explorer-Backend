import mongoose from "mongoose"
import { ApiError } from '../utils/ApiError.js'
import { APiResponse } from '../utils/ApiResponse.js'
import { Playlist } from '../models/playlist.model.js'
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const userId = req.user_id

    if (!name || description) {
        throw new ApiError(400, "Name and Description are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId
    })

    return res.status(200).json(
        new APiResponse(200, playlist, "Playlist created succesfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "UserId is required")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: new mongoose.Types.ObjectId(userId)
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'videos',
                foreignField: '_id',
                as: 'videoDetails'
            }

        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $project: {
                name: 1,
                description: 1,
                updatedAt: 1,
                videoCount: { $size: "$videos" },
                videoDetails: {
                    _id: 1,
                    title: 1,
                    thumbnail: 1,
                    videoFile: 1
                }
            }
        }
    ])

    return res.status(200).json(
        new APiResponse(200, playlist, "User playlist with videos fetched successfully")
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'videos',
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: "ownerInfo"
            }
        },
        {
            $unwind: "$ownerInfo"
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                "ownerInfo._id": 1,
                "ownerInfo.username": 1,
                "ownerinfo.fullname": 1,
                "ownerInfo.avatar": 1,
                videoDetails: {
                    _id: 1,
                    title: 1,
                    thumbnail: 1,
                    videoFile: 1
                }
            }
        }
    ])

    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new APiResponse(200, playlist[0], "Playlist fetched successfully")
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "PlaylistId or videoId is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: videoId }
        },
        {
            new: true
        }
    )

    if (!updatePlaylist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new APiResponse(200, updatePlaylist, "Video added to playlist successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "PlaylistId and VideoId is not provided")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        {
            new: true
        }
    ).populate("videos", "title thumbnail videoFile")

    if (!updatePlaylist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new APiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required")
    }

    const deleted = await Playlist.findByIdAndDelete(playlistId)

    if (!deleted) {
        throw new ApiError(404, "Playlist not found")
    }

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required")
    }

    if (!name && !description) {
        throw new ApiError(400, "At least one of name or description is required to update")
    }

    const updatedPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            ...(name && { name }),
            ...(description && { description })
        },
        {
            new: true
        }
    )

    if (!updatedPlayList) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new APiResponse(200, updatedPlayList, "Playlist updated succesfully")
    )

})
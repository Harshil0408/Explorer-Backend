import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Playlist name is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required"],
    }
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistSchema);
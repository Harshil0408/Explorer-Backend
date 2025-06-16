import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "Content is required"],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required"],
    }
}, { timestamps: true });

export const Tweet = mongoose.model("Tweet", tweetSchema);
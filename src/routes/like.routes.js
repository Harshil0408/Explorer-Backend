import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { getTotalLikesOnVideo, getVideosLikedByUser, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router()

router.post(
    '/like-video/:videoId',
    verifyJwt,
    toggleVideoLike
)

router.get(
    '/like-video/:videoId',
    verifyJwt,
    getTotalLikesOnVideo
)

router.get(
    '/user-liked-videos',
    verifyJwt,
    getVideosLikedByUser
)

export default router
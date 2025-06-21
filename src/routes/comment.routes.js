import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware'
import { addVideoComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller";

const router = Router()

router.get(
    'video-comments/:videoId',
    verifyJwt,
    getVideoComments
)

router.post(
    'video-comment/:videoId',
    verifyJwt,
    addVideoComment
)

router.patch(
    'video-comment/:commentId',
    verifyJwt,
    updateComment
)

router.delete(
    'video-comment/:commentId',
    verifyJwt,
    deleteComment
)

export default router
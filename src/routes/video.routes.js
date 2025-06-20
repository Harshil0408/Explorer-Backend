import { Router } from 'express'
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'
import { deleteVideo, getAllVideos, getVideoById, publishVideo } from '../controllers/video.controller.js'

const router = Router()

router.post(
    '/publish-video',
    verifyJwt,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ])
    ,
    publishVideo
)

router.get(
    '/getAllVideos',
    verifyJwt,
    getAllVideos
)

router.get(
    '/getVideo/:videoId',
    verifyJwt,
    getVideoById
)

router.delete(
    '/deleteVideo/:videoId',
    verifyJwt,
    deleteVideo
)

export default router
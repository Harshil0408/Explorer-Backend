import { Router } from 'express'
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from '../controllers/video.controller.js'

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

router.post(
    '/togglePublish/:videoId',
    verifyJwt,
    togglePublishStatus
)

router.patch(
    '/updateVideo/:videoId',
    verifyJwt,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    updateVideo
);


export default router
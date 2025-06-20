import { asyncHandler } from '../utils/asyncHandler'

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

const updateComment = asyncHandler(async (req, res) => {

})

const deleteComment = asyncHandler(async (req, res) => {

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
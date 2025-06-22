import { asyncHandler } from '../utils/asyncHandler'

const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy!",
        timestamp: new Date().toISOString()
    })
})

export {
    healthCheck
}
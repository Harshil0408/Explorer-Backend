
import express from 'express'
const app = express();

import 'dotenv/config'
import connectDB from './db/index.js';

connectDB()

// ; (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONOGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("ERRR", error)
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("ERROR", error)
//         throw err
//     }
// })()
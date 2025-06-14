
import express from 'express'
const app = express();

import 'dotenv/config'
import connectDB from './db/index.js';

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MONGODB CONNECTION ERROR", err)
    })

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
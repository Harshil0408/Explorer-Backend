import connectDB from './db/index.js';
import { app } from './app.js';
import dotenv from 'dotenv'
dotenv.config()


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MONGODB CONNECTION ERROR", err)
    })

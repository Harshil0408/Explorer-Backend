import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}))

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.routes.js'
import likeRoutes from './routes/like.routes.js'

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/videos', videoRoutes)
app.use('/api/v1/likes', likeRoutes)

export { app }
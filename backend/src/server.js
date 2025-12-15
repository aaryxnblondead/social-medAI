import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*'}));
app.use(helmet());
app.use(morgan('dev'));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bigness';
mongoose.connect(mongoUri, { autoIndex: true }).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// Health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Routes
import authRouter from './routes/auth.js';
import brandsRouter from './routes/brands.js';
import trendsRouter from './routes/trends.js';
import postsRouter from './routes/posts.js';
import oauthRouter from './routes/oauth/index.js';
import oauthPublicRouter from './routes/oauth/public.js';
import analyticsRouter from './routes/analytics.js';
import { startJobs } from './jobs/scheduler.js';
import metaRouter from './routes/meta.js';

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/brands', brandsRouter);
app.use('/api/v1/trends', trendsRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/oauth', oauthRouter);
app.use('/api/v1/oauth/public', oauthPublicRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/meta', metaRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
  startJobs();
});

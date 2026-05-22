import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';

import authRoutes from './routes/auth';
import jobRoutes from './routes/job';
import candidateRoutes from './routes/candidate';
import interviewRoutes from './routes/interview';
import evaluationRoutes from './routes/evaluation';
import offerRoutes from './routes/offer';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);
app.use('/api/candidates', authMiddleware, candidateRoutes);
app.use('/api/interviews', authMiddleware, interviewRoutes);
app.use('/api/evaluations', authMiddleware, evaluationRoutes);
app.use('/api/offers', authMiddleware, offerRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] HireFlow ATS Server running on port ${PORT}`);
});

export default app;

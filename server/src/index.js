import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import submissionsRoutes from './routes/submissions.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'JoinEazy API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/assignments', assignmentsRoutes);
app.use('/api/v1/submissions', submissionsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/courses', coursesRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JoinEazy Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Server export for testing
export default app;

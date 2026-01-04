import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import engineerRoutes from './routes/engineers';
import serviceRoutes from './routes/services';
import notificationRoutes from './routes/notifications';
import teamTaskRoutes from './routes/teamTasks';
import importRoutes from './routes/import';
import chatbotRoutes from './routes/chatbot';
import emailRoutes from './routes/email';
import reminderRoutes from './routes/reminder';

// Initialize scheduler
import './services/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
// Support multiple origins (comma-separated) or single origin
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl, or same-origin requests via proxy)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      console.warn(`CORS: Blocked origin ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task Tracker API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/engineers', engineerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/team-tasks', teamTaskRoutes);
app.use('/api/import', importRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/reminder', reminderRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});


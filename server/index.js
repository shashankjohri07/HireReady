import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import resumeRouter from './routes/resume.js';
import newsRouter from './routes/news.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev ? '*' : (process.env.CORS_ORIGIN ?? false),
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '10mb' }));

// Simple request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use('/api/chat', chatRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/news', newsRouter);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server → http://localhost:${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));

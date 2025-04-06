import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import { createTables } from './config/tables.js';
import authRouter from './routes/auth.js';
import quarterRouter from './routes/quarter.js';
import lessonRouter from './routes/lesson.js';
import gameRouter from './routes/game.js';

// Load environment variables
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/quarters', quarterRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/game', gameRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // Test database connection and create tables
    await pool.connect();
    console.log('Successfully connected to database');
    await createTables();
  } catch (err) {
    console.error('Error during startup:', err.stack);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

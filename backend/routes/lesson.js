import express from 'express';
import { pool } from '../config/db.js';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const lessonRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'powerpoint',
      'image/jpeg': 'image',
      'image/png': 'image',
      'video/mp4': 'video',
      'video/webm': 'video',
    };

    if (allowedTypes[file.mimetype]) {
      file.contentType = allowedTypes[file.mimetype];
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// fetch all lessons for a specific quarter
lessonRouter.get('/:quarterId/lessons', async (req, res) => {
  const { quarterId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM lessons WHERE quarter_id = $1 ORDER BY lesson_number ASC',
      [quarterId]
    );

    res.json({
      success: true,
      lessons: result.rows,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons',
    });
  }
});

// fetch specific lesson details according to ID
lessonRouter.get('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [
      lessonId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    res.json({
      success: true,
      lesson: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching lesson details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson details',
    });
  }
});

lessonRouter.get('/:lessonId/presentations', async (req, res) => {
  const { lessonId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM presentations WHERE lesson_id = $1 ORDER BY display_order ASC',
      [lessonId]
    );

    res.json({
      success: true,
      presentations: result.rows,
    });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch presentations',
    });
  }
});

// POST create a new lesson for a specific quarter
lessonRouter.post('/:quarterId/lessons', async (req, res) => {
  const { quarterId } = req.params;
  const { title } = req.body;
  const userId = 1; // Hardcoded for now, should come from auth token

  try {
    const result = await pool.query(
      'INSERT INTO lessons (quarter_id, title, created_by) VALUES ($1, $2, $3) RETURNING *',
      [quarterId, title, userId]
    );

    res.json({
      success: true,
      lesson: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson',
    });
  }
});

// POST upload presentations for a lesson
lessonRouter.post(
  '/:lessonId/presentations',
  upload.array('files'),
  async (req, res) => {
    const { lessonId } = req.params;
    const files = req.files;
    const userId = 1; // Hardcoded for now, should come from auth token

    try {
      const presentations = [];

      for (const file of files) {
        // Get the next display order
        const orderResult = await pool.query(
          'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM presentations WHERE lesson_id = $1',
          [lessonId]
        );
        const displayOrder = orderResult.rows[0].next_order;

        // Insert the presentation
        const result = await pool.query(
          `INSERT INTO presentations 
                 (lesson_id, content_type, file_url, display_order, created_by) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
          [lessonId, file.contentType, file.filename, displayOrder, userId]
        );

        presentations.push(result.rows[0]);
      }

      res.json({
        success: true,
        presentations,
      });
    } catch (error) {
      // Delete uploaded files if operation fails
      for (const file of files) {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        await fs.remove(filePath).catch(console.error);
      }

      console.error('Error uploading presentations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload presentations',
      });
    }
  }
);

export default lessonRouter;

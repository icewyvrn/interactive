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
  const { lessonId, title } = req.body;
  const userId = 1; // Hardcoded for now, should come from auth token

  try {
    const result = await pool.query(
      'INSERT INTO lessons (id, quarter_id, title, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [lessonId, quarterId, title, userId]
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
    const { titles, descriptions } = req.body; // Parse metadata as JSON from request body
    const userId = 1; // Hardcoded for now, should come from auth token

    try {
      const presentations = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Get the next display order
        const orderResult = await pool.query(
          'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM presentations WHERE lesson_id = $1',
          [lessonId]
        );
        const displayOrder = orderResult.rows[0].next_order;

        // Get title and description if available
        let title = null;
        let description = null;

        if (titles && Array.isArray(titles) && titles[i]) {
          title = titles[i];
        }

        if (descriptions && Array.isArray(descriptions) && descriptions[i]) {
          description = descriptions[i];
        }

        // Insert the presentation with title and description
        const result = await pool.query(
          `INSERT INTO presentations 
           (lesson_id, content_type, file_url, title, description, display_order, created_by) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [
            lessonId,
            file.contentType,
            file.filename,
            title,
            description,
            displayOrder,
            userId,
          ]
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

// DELETE a specific presentation
lessonRouter.delete('/:lessonId/presentations/:presentationId', async (req, res) => {
  const { presentationId } = req.params;

  try {
    // Fetch the presentation to get the file path
    const presentationResult = await pool.query(
      'SELECT file_url FROM presentations WHERE id = $1',
      [presentationId]
    );

    if (presentationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found',
      });
    }

    const filePath = path.join(__dirname, '../uploads', presentationResult.rows[0].file_url);

    // Delete the presentation record from the database
    await pool.query('DELETE FROM presentations WHERE id = $1', [presentationId]);

    // Remove the file from the filesystem
    await fs.remove(filePath);

    res.json({
      success: true,
      message: 'Presentation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete presentation',
    });
  }
});

// DELETE a specific lesson and its associated presentations
lessonRouter.delete('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;

  try {
    const presentationsResult = await pool.query(
      'SELECT file_url FROM presentations WHERE lesson_id = $1',
      [lessonId]
    );

    // Delete all associated presentation files from the filesystem
    for (const presentation of presentationsResult.rows) {
      const filePath = path.join(__dirname, '../uploads', presentation.file_url);
      await fs.remove(filePath).catch(console.error);
    }

    // Delete all presentations associated with the lesson
    await pool.query('DELETE FROM presentations WHERE lesson_id = $1', [lessonId]);

    // Delete the lesson itself
    const lessonResult = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING *', [lessonId]);

    if (lessonResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    res.json({
      success: true,
      message: 'Lesson and associated presentations deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson',
    });
  }
});

export default lessonRouter;
import express from 'express';
import { pool } from '../config/db.js';

const quarterRouter = express.Router();

// GET all quarters
quarterRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quarters ORDER BY id ASC');

    res.json({
      success: true,
      quarters: result.rows,
    });
  } catch (error) {
    console.error('Error fetching quarters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quarters',
    });
  }
});

export default quarterRouter;

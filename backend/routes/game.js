import express from 'express';
import { pool } from '../config/db.js';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const gameRouter = express.Router();

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
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
    };

    if (allowedTypes[file.mimetype]) {
      file.contentType = allowedTypes[file.mimetype];
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, and GIF images are allowed.'
        )
      );
    }
  },
});

// Fetch games for a lesson
gameRouter.get('/lessons/:lessonId/games', async (req, res) => {
  const { lessonId } = req.params;

  try {
    // Fetch drag and drop games with their rounds and choices
    const dragDropResult = await pool.query(
      `
        SELECT
          ddg.id,
          'drag-drop' as game_type,
          ddg.total_rounds,
          ddg.created_at,
          json_agg(
            json_build_object(
              'id', dgr.id,
              'round_number', dgr.round_number,
              'question_text', dgr.question_text,
              'choices', (
                SELECT json_agg(
                  json_build_object(
                    'id', drc.id,
                    'word', drc.word,
                    'is_correct', drc.is_correct
                  )
                )
                FROM dd_round_choices drc
                WHERE drc.round_id = dgr.id
              )
            )
          ) as rounds
        FROM drag_and_drop_games ddg
        LEFT JOIN dd_game_rounds dgr ON ddg.id = dgr.game_id
        WHERE ddg.lesson_id = $1
        GROUP BY ddg.id
      `,
      [lessonId]
    );

    // Fetch matching games with their rounds, choices and matches
    const matchingResult = await pool.query(
      `
        SELECT
          mg.id,
          'matching' as game_type,
          mg.total_rounds,
          mg.created_at,
          json_agg(
            json_build_object(
              'id', mgr.id,
              'round_number', mgr.round_number,
              'first_choices', (
                SELECT json_agg(
                  json_build_object(
                    'id', mfc.id,
                    'word', mfc.word,
                    'image_url', mfc.image_url,
                    'display_order', mfc.display_order
                  )
                  ORDER BY mfc.display_order
                )
                FROM mg_first_choices mfc
                WHERE mfc.round_id = mgr.id
              ),
              'second_choices', (
                SELECT json_agg(
                  json_build_object(
                    'id', msc.id,
                    'word', msc.word,
                    'image_url', msc.image_url,
                    'display_order', msc.display_order
                  )
                  ORDER BY msc.display_order
                )
                FROM mg_second_choices msc
                WHERE msc.round_id = mgr.id
              ),
              'correct_matches', (
                SELECT json_agg(
                  json_build_object(
                    'id', mcm.id,
                    'first_choice_id', mcm.first_choice_id,
                    'second_choice_id', mcm.second_choice_id
                  )
                )
                FROM mg_correct_matches mcm
                WHERE mcm.round_id = mgr.id
              )
            )
          ) as rounds
        FROM mg_games mg
        LEFT JOIN mg_game_rounds mgr ON mg.id = mgr.game_id
        WHERE mg.lesson_id = $1
        GROUP BY mg.id
      `,
      [lessonId]
    );

    // Fetch multiple choice games with their rounds and choices
    const multipleChoiceResult = await pool.query(
      `
        SELECT
          mc.id,
          'multiple-choice' as game_type,
          mc.total_rounds,
          mc.created_at,
          json_agg(
            json_build_object(
              'id', mcr.id,
              'round_number', mcr.round_number,
              'question', mcr.question,
              'choices', (
                SELECT json_agg(
                  json_build_object(
                    'id', mcc.id,
                    'choice_text', mcc.choice_text,
                    'is_correct', mcc.is_correct,
                    'display_order', mcc.display_order
                  )
                  ORDER BY mcc.display_order
                )
                FROM mc_round_choices mcc
                WHERE mcc.round_id = mcr.id
              )
            )
          ) as rounds
        FROM mc_games mc
        LEFT JOIN mc_game_rounds mcr ON mc.id = mcr.game_id
        WHERE mc.lesson_id = $1
        GROUP BY mc.id
      `,
      [lessonId]
    );

    // Combine the results
    const allGames = [
      ...dragDropResult.rows,
      ...matchingResult.rows,
      ...multipleChoiceResult.rows,
    ];

    res.json({
      success: true,
      games: allGames,
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games',
    });
  }
});

// Create drag and drop game
gameRouter.post('/lessons/:lessonId/games/drag-drop', async (req, res) => {
  const { lessonId } = req.params;
  const { totalRounds, rounds } = req.body;
  const userId = 1; // TODO: Get from auth token

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create the game
    const gameResult = await client.query(
      `INSERT INTO drag_and_drop_games (lesson_id, total_rounds, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [lessonId, totalRounds, userId]
    );

    const gameId = gameResult.rows[0].id;

    // Insert rounds
    for (const [index, round] of rounds.entries()) {
      // Create round
      const roundResult = await client.query(
        `INSERT INTO dd_game_rounds (game_id, round_number, question_text, blank_position)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [gameId, index + 1, round.questionText, round.blankPosition]
      );

      const roundId = roundResult.rows[0].id;

      // Insert choices for the round
      for (const choice of round.choices) {
        await client.query(
          `INSERT INTO dd_round_choices (round_id, word, is_correct)
           VALUES ($1, $2, $3)`,
          [roundId, choice.word, choice.isCorrect]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      game: {
        id: gameId,
        lessonId,
        totalRounds,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating drag and drop game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
    });
  } finally {
    client.release();
  }
});

// Create matching game
gameRouter.post('/lessons/:lessonId/games/matching', async (req, res) => {
  const { lessonId } = req.params;
  const { totalRounds, rounds } = req.body;
  const userId = 1; // TODO: Get from auth token

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create the game
    const gameResult = await client.query(
      `INSERT INTO mg_games (lesson_id, total_rounds, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [lessonId, totalRounds, userId]
    );

    const gameId = gameResult.rows[0].id;

    // Insert rounds
    for (const [index, round] of rounds.entries()) {
      // Create round
      const roundResult = await client.query(
        `INSERT INTO mg_game_rounds (game_id, round_number)
         VALUES ($1, $2)
         RETURNING id`,
        [gameId, index + 1]
      );

      const roundId = roundResult.rows[0].id;

      // Insert first choices
      const firstChoiceIds = [];
      for (const [choiceIndex, choice] of round.firstChoices.entries()) {
        const result = await client.query(
          `INSERT INTO mg_first_choices (round_id, word, image_url, display_order)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            roundId,
            choice.word || null,
            choice.imageUrl || null,
            choice.displayOrder,
          ]
        );
        firstChoiceIds.push(result.rows[0].id);
      }

      // Insert second choices
      const secondChoiceIds = [];
      for (const [choiceIndex, choice] of round.secondChoices.entries()) {
        const result = await client.query(
          `INSERT INTO mg_second_choices (round_id, word, image_url, display_order)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            roundId,
            choice.word || null,
            choice.imageUrl || null,
            choice.displayOrder,
          ]
        );
        secondChoiceIds.push(result.rows[0].id);
      }

      // Insert matches
      for (const match of round.matches) {
        await client.query(
          `INSERT INTO mg_correct_matches (round_id, first_choice_id, second_choice_id)
           VALUES ($1, $2, $3)`,
          [
            roundId,
            firstChoiceIds[match.firstChoiceIndex],
            secondChoiceIds[match.secondChoiceIndex],
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      game: {
        id: gameId,
        lessonId,
        totalRounds,
        gameType: 'matching',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating matching game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
    });
  } finally {
    client.release();
  }
});

// Create multiple choice game
gameRouter.post(
  '/lessons/:lessonId/games/multiple-choice',
  async (req, res) => {
    const { lessonId } = req.params;
    const { totalRounds, rounds } = req.body;
    const userId = 1; // TODO: Get from auth token

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create the game
      const gameResult = await client.query(
        `INSERT INTO mc_games (lesson_id, total_rounds, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
        [lessonId, totalRounds, userId]
      );

      const gameId = gameResult.rows[0].id;

      // Insert rounds
      for (const [index, round] of rounds.entries()) {
        // Create round
        const roundResult = await client.query(
          `INSERT INTO mc_game_rounds (game_id, round_number, question)
         VALUES ($1, $2, $3)
         RETURNING id`,
          [gameId, index + 1, round.question]
        );

        const roundId = roundResult.rows[0].id;

        // Insert choices for the round
        for (const [choiceIndex, choice] of round.choices.entries()) {
          await client.query(
            `INSERT INTO mc_round_choices (round_id, choice_text, is_correct, display_order)
           VALUES ($1, $2, $3, $4)`,
            [roundId, choice.text, choice.isCorrect, choice.displayOrder]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        game: {
          id: gameId,
          lessonId,
          totalRounds,
          gameType: 'multiple-choice',
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating multiple choice game:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create game',
      });
    } finally {
      client.release();
    }
  }
);

// Upload image for games
gameRouter.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Return the file URL
    res.json({
      success: true,
      imageUrl: req.file.filename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
});

export default gameRouter;

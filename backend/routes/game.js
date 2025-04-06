import express from 'express';
import { pool } from '../config/db.js';

const gameRouter = express.Router();

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

    res.json({
      success: true,
      games: dragDropResult.rows,
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

export default gameRouter;

import { pool } from './db.js';

export const createTables = async () => {
  try {
    const queries = `
      -- Enum for content types
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
          CREATE TYPE content_type AS ENUM ('powerpoint', 'image', 'video');
        END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quarters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        quarter_id INTEGER REFERENCES quarters(id) ON DELETE CASCADE,
        lesson_number INTEGER,
        title VARCHAR(255),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(quarter_id, lesson_number)
      );

      CREATE TABLE IF NOT EXISTS presentations (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        content_type content_type NOT NULL,
        file_url TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lesson_id, display_order)
      );

      CREATE TABLE IF NOT EXISTS drag_and_drop_games (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        total_rounds INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lesson_id)  -- One game per lesson
      );

      -- Create drag and drop rounds table
      CREATE TABLE IF NOT EXISTS dd_game_rounds (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES drag_and_drop_games(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,  -- The sentence with blank
        blank_position INTEGER NOT NULL, -- Position of the blank in the sentence
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, round_number)
      );

      -- Create drag and drop choices table
      CREATE TABLE IF NOT EXISTS dd_round_choices (
        id SERIAL PRIMARY KEY,
        round_id INTEGER REFERENCES dd_game_rounds(id) ON DELETE CASCADE,
        word TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create matching games table
      CREATE TABLE IF NOT EXISTS mg_games (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      total_rounds INTEGER NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(lesson_id)  -- One game per lesson
      );

      -- Create rounds table for matching game
      CREATE TABLE IF NOT EXISTS mg_game_rounds (
      id SERIAL PRIMARY KEY,
      game_id INTEGER REFERENCES mg_games(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_id, round_number)
      );

      -- Create first choices table
      CREATE TABLE IF NOT EXISTS mg_first_choices (
      id SERIAL PRIMARY KEY,
      round_id INTEGER REFERENCES mg_game_rounds(id) ON DELETE CASCADE,
      word TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT word_or_image CHECK (word IS NOT NULL OR image_url IS NOT NULL),
      UNIQUE(round_id, display_order)
      );

      -- Create second choices table (potential matches)
      CREATE TABLE IF NOT EXISTS mg_second_choices (
      id SERIAL PRIMARY KEY,
      round_id INTEGER REFERENCES mg_game_rounds(id) ON DELETE CASCADE,
      word TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT word_or_image CHECK (word IS NOT NULL OR image_url IS NOT NULL),
      UNIQUE(round_id, display_order)
      );

      -- Create matches table to store correct pairs
      CREATE TABLE IF NOT EXISTS mg_correct_matches (
      id SERIAL PRIMARY KEY,
      round_id INTEGER REFERENCES mg_game_rounds(id) ON DELETE CASCADE,
      first_choice_id INTEGER REFERENCES mg_first_choices(id) ON DELETE CASCADE,
      second_choice_id INTEGER REFERENCES mg_second_choices(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(round_id, first_choice_id),
      UNIQUE(round_id, second_choice_id)
      );

      -- Create multiple choice games table
      CREATE TABLE IF NOT EXISTS mc_games (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        total_rounds INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lesson_id)  -- One game per lesson
      );

      -- Create multiple choice rounds table
      CREATE TABLE IF NOT EXISTS mc_game_rounds (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES mc_games(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        question TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, round_number)
      );

      -- Create multiple choice options table
      CREATE TABLE IF NOT EXISTS mc_round_choices (
        id SERIAL PRIMARY KEY,
        round_id INTEGER REFERENCES mc_game_rounds(id) ON DELETE CASCADE,
        choice_text TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(round_id, display_order)
      );

      -- Create a function to generate lesson title
      CREATE OR REPLACE FUNCTION generate_lesson_number()
      RETURNS TRIGGER AS $$
      BEGIN
        SELECT COALESCE(MAX(lesson_number), 0) + 1
        INTO NEW.lesson_number
        FROM lessons
        WHERE quarter_id = NEW.quarter_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger to auto-generate lesson number
      DROP TRIGGER IF EXISTS set_lesson_number ON lessons;
      CREATE TRIGGER set_lesson_number
        BEFORE INSERT ON lessons
        FOR EACH ROW
        EXECUTE FUNCTION generate_lesson_number();

      -- Insert teacher credentials
      INSERT INTO users (username, password)
      VALUES ('teacher@dev.com', '2579')
      ON CONFLICT (username) DO NOTHING;

      -- Insert the four static quarters
      INSERT INTO quarters (name, description)
      VALUES 
        ('Quarter 1', 'First quarter of the academic year'),
        ('Quarter 2', 'Second quarter of the academic year'),
        ('Quarter 3', 'Third quarter of the academic year'),
        ('Quarter 4', 'Fourth quarter of the academic year')
      ON CONFLICT (name) DO NOTHING;
      `;

    await pool.query(queries);
    console.log('All tables created successfully in development database');
    return true;
  } catch (error) {
    console.error('Error in database initialization:', error);
    throw error;
  }
};

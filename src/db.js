const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.sqlite');

// Ensure data folder exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_te TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER NOT NULL,
      ward_number TEXT NOT NULL,
      name TEXT NOT NULL,
      name_te TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ward_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      name_te TEXT NOT NULL,
      pincode TEXT DEFAULT '500047',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS waste_streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_te TEXT NOT NULL,
      color TEXT NOT NULL,
      bin_color TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      description_te TEXT NOT NULL,
      guidelines TEXT NOT NULL,
      guidelines_te TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS waste_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stream_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      name_te TEXT NOT NULL,
      category TEXT NOT NULL,
      image_icon TEXT NOT NULL,
      explanation TEXT NOT NULL,
      explanation_te TEXT NOT NULL,
      mistake_tip TEXT,
      mistake_tip_te TEXT,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (stream_id) REFERENCES waste_streams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_number INTEGER NOT NULL,
      stream_id INTEGER,
      question_text TEXT NOT NULL,
      question_text_te TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      explanation_te TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Medium',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (stream_id) REFERENCES waste_streams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      age_group TEXT,
      gender TEXT NOT NULL,
      category TEXT NOT NULL,
      organisation TEXT,
      circle_id INTEGER NOT NULL,
      ward_id INTEGER NOT NULL,
      area_id INTEGER,
      mobile TEXT,
      email TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE RESTRICT,
      FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS game_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      max_score INTEGER NOT NULL DEFAULT 100,
      percentage REAL NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      incorrect_count INTEGER NOT NULL DEFAULT 0,
      streak_max INTEGER NOT NULL DEFAULT 0,
      stars_earned INTEGER NOT NULL DEFAULT 0,
      rank_title TEXT NOT NULL,
      level_reached INTEGER NOT NULL DEFAULT 1,
      completed INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id TEXT NOT NULL UNIQUE,
      participant_id INTEGER NOT NULL,
      attempt_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      percentage REAL NOT NULL,
      issue_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      commissioner_name TEXT NOT NULL DEFAULT 'T. Vinay Krishna Reddy, I.A.S.',
      commissioner_title TEXT NOT NULL DEFAULT 'Commissioner, Malkajgiri Municipal Corporation',
      qr_code_data TEXT NOT NULL,
      signature_path TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE RESTRICT,
      FOREIGN KEY (attempt_id) REFERENCES game_attempts(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      circle_id INTEGER,
      ward_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      failed_logins INTEGER NOT NULL DEFAULT 0,
      lockout_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE SET NULL,
      FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      admin_user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS brand_logos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      placement TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      aspect_ratio TEXT DEFAULT 'auto',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS contact_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      label_te TEXT NOT NULL,
      value TEXT NOT NULL,
      value_te TEXT,
      icon TEXT NOT NULL DEFAULT 'fa-info-circle',
      is_active INTEGER NOT NULL DEFAULT 1,
      category TEXT NOT NULL DEFAULT 'contact',
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER,
      admin_username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lang_key TEXT NOT NULL UNIQUE,
      en_text TEXT NOT NULL,
      te_text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'ui',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_wards_circle_id ON wards(circle_id);
    CREATE INDEX IF NOT EXISTS idx_areas_ward_id ON areas(ward_id);
    CREATE INDEX IF NOT EXISTS idx_items_stream_id ON waste_items(stream_id);
    CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level_number);
    CREATE INDEX IF NOT EXISTS idx_participants_circle_ward ON participants(circle_id, ward_id);
    CREATE INDEX IF NOT EXISTS idx_cert_code ON certificates(certificate_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);
}

module.exports = {
  db,
  initSchema
};

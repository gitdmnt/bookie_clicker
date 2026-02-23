-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,           -- UUID
    google_id TEXT UNIQUE NOT NULL,         -- Google OAuth sub
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture_url TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,           -- Session token (UUID)
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Remove old tables (destructive migration)
-- DROP TABLE IF EXISTS books;
-- DROP TABLE IF EXISTS reading_logs;
-- DROP TABLE IF EXISTS laps;

-- Books master (shared bibliographic data from NDL)
CREATE TABLE IF NOT EXISTS books_master (
    isbn INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    series_title TEXT,
    authors TEXT NOT NULL,           -- JSON array stored as TEXT
    publisher TEXT,
    year INTEGER,
    page_count INTEGER,
    image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_books_master_isbn ON books_master(isbn);

-- User-owned books (per-user ownership/metadata)
CREATE TABLE IF NOT EXISTS user_books (
    id TEXT PRIMARY KEY NOT NULL,    -- ULID
    user_id TEXT NOT NULL,
    isbn INTEGER NOT NULL,
    added_at TEXT NOT NULL,
    status TEXT,
    rating INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (isbn) REFERENCES books_master(isbn) ON DELETE CASCADE,
    UNIQUE (user_id, isbn)
);

CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_isbn ON user_books(isbn);

-- Reading logs: belong to user_books (ownership)
CREATE TABLE IF NOT EXISTS reading_logs (
    id TEXT PRIMARY KEY NOT NULL,    -- ULID
    user_book_id TEXT NOT NULL,      -- references user_books(id) (ULID)
    created_at TEXT NOT NULL,
    session_duration_sec INTEGER NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    rating INTEGER,
    FOREIGN KEY (user_book_id) REFERENCES user_books(id) ON DELETE CASCADE
);

-- Indexes for reading_logs
CREATE INDEX IF NOT EXISTS idx_reading_logs_user_book_id ON reading_logs(user_book_id);
CREATE INDEX IF NOT EXISTS idx_reading_logs_created_at ON reading_logs(created_at);

-- Laps table
CREATE TABLE IF NOT EXISTS laps (
    id TEXT PRIMARY KEY NOT NULL,    -- ULID
    reading_log_id TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    note TEXT,
    ref_page INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (reading_log_id) REFERENCES reading_logs(id) ON DELETE CASCADE
);

-- Index for laps
CREATE INDEX IF NOT EXISTS idx_laps_reading_log_id ON laps(reading_log_id);

-- Timer sessions table (transient, for tracking start/stop timestamps)
CREATE TABLE IF NOT EXISTS timer_sessions (
    id TEXT PRIMARY KEY NOT NULL,           -- ULID
    user_id TEXT NOT NULL,
    start_time TEXT NOT NULL,               -- ISO 8601
    stop_time TEXT,                         -- ISO 8601 (NULL = running)
    is_saved INTEGER DEFAULT 0,             -- 0 = not saved, 1 = saved to reading_logs
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_active ON timer_sessions(user_id, is_saved);

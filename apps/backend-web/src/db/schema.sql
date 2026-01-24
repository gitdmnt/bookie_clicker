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

-- Books table
CREATE TABLE IF NOT EXISTS books (
    isbn INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    series_title TEXT,
    authors TEXT NOT NULL,           -- JSON array stored as TEXT
    publisher TEXT NOT NULL,
    year INTEGER NOT NULL,
    page_count INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);

-- Reading logs table
CREATE TABLE IF NOT EXISTS reading_logs (
    id TEXT PRIMARY KEY NOT NULL,    -- ULID
    isbn INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    session_duration_sec INTEGER NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    rating INTEGER,
    user_id TEXT NOT NULL,
    FOREIGN KEY (isbn) REFERENCES books(isbn) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for reading_logs
CREATE INDEX IF NOT EXISTS idx_reading_logs_isbn ON reading_logs(isbn);
CREATE INDEX IF NOT EXISTS idx_reading_logs_created_at ON reading_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_reading_logs_user_id ON reading_logs(user_id);

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

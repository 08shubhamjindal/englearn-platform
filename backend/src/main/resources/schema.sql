-- ================================================
-- EngLearn Platform — Database Schema
-- Run this against PostgreSQL in production
-- ================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id       VARCHAR(255) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reading progress
CREATE TABLE IF NOT EXISTS reading_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id        VARCHAR(100) NOT NULL,
    chapter_index   INT NOT NULL,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, paper_id, chapter_index)
);

-- Comments / Discussion
CREATE TABLE IF NOT EXISTS comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id        VARCHAR(100) NOT NULL,
    chapter_index   INT NOT NULL,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,  -- for threading
    content         TEXT NOT NULL,
    upvotes         INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id        VARCHAR(100) NOT NULL,
    chapter_index   INT NOT NULL,
    question_id     VARCHAR(100) NOT NULL,
    answer          TEXT NOT NULL,
    is_correct      BOOLEAN NOT NULL,
    answered_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, paper_id, chapter_index, question_id)
);

-- Papers (store content as JSONB)
CREATE TABLE IF NOT EXISTS papers (
    id              VARCHAR(100) PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    meta            JSONB NOT NULL,        -- category, description, readTime, etc.
    chapters        JSONB NOT NULL,        -- full chapter/block content
    sort_order      INT NOT NULL DEFAULT 0,
    published       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_user       ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_paper      ON reading_progress(paper_id);
CREATE INDEX IF NOT EXISTS idx_comments_paper      ON comments(paper_id, chapter_index);
CREATE INDEX IF NOT EXISTS idx_comments_parent     ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user_paper     ON quiz_answers(user_id, paper_id);

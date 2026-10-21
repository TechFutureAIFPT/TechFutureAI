"""SQLite schema for local business data, legacy imports, and local services."""

from app.db.business_schema import BUSINESS_TABLES_DDL

LEGACY_COMPAT_DDL = """
-- Compatibility fast-path tables for Local AI Server Engine
CREATE TABLE IF NOT EXISTS cv_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    jd_title TEXT,
    jd_text TEXT,
    weights_json TEXT,
    hard_filters_json TEXT,
    candidates_json TEXT,
    pipeline_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hist_uid ON cv_history(user_id);

CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    progress REAL DEFAULT 0.0,
    message TEXT,
    payload_json TEXT NOT NULL,
    result_json TEXT,
    error_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_jobs_st ON analysis_jobs(status);

CREATE TABLE IF NOT EXISTS analysis_cache (
    cache_key TEXT PRIMARY KEY,
    candidate_name TEXT,
    total_score REAL,
    result_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploaded_files (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    filename TEXT NOT NULL,
    content_type TEXT,
    file_size INTEGER,
    document_type TEXT,
    extracted_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_files_uid ON uploaded_files(user_id);

CREATE TABLE IF NOT EXISTS vector_records (
    id TEXT PRIMARY KEY,
    collection_name TEXT NOT NULL,
    doc_id TEXT,
    text_content TEXT NOT NULL,
    embedding_blob BLOB NOT NULL,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vec_col ON vector_records(collection_name);

CREATE TABLE IF NOT EXISTS interview_records (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    question_type TEXT,
    questions_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_chats (
    id TEXT PRIMARY KEY,
    candidate_id TEXT,
    user_message TEXT,
    ai_reply TEXT,
    suggestions_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""

LOCAL_AUTH_DDL = """
CREATE TABLE IF NOT EXISTS local_admin_sessions (
    token_hash TEXT PRIMARY KEY,
    claims_json TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_local_admin_sessions_expiry ON local_admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS local_admin_oauth_states (
    state_hash TEXT PRIMARY KEY,
    origin TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    nonce TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_local_admin_oauth_states_expiry ON local_admin_oauth_states(expires_at);
"""

SCHEMA_DDL = BUSINESS_TABLES_DDL + "\n" + LEGACY_COMPAT_DDL + "\n" + LOCAL_AUTH_DDL

-- SupportHR Local CV Screening & Matching Database Initialization
-- Extension initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    required_skills JSONB DEFAULT '[]'::jsonb,
    raw_content TEXT,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidates Table (Local Storage)
CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    file_path VARCHAR(500),
    parsed_text TEXT,
    extracted_skills JSONB DEFAULT '[]'::jsonb,
    experience_years NUMERIC(4, 1) DEFAULT 0.0,
    education JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vector Embeddings for Candidates (768-dim from nomic-embed-text)
CREATE TABLE IF NOT EXISTS candidate_embeddings (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    chunk_type VARCHAR(50) DEFAULT 'full',
    chunk_text TEXT,
    embedding vector(768) NOT NULL,
    model_name VARCHAR(100) DEFAULT 'nomic-embed-text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW Vector Index for ultra-fast Cosine Similarity Matching (<=>)
CREATE INDEX IF NOT EXISTS idx_candidate_embeddings_hnsw
ON candidate_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_hnsw
ON job_descriptions
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Match Results Table
CREATE TABLE IF NOT EXISTS match_results (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id VARCHAR(64) NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5, 4) NOT NULL,
    rule_score NUMERIC(5, 2) DEFAULT 0.0,
    final_score NUMERIC(5, 2) NOT NULL,
    analysis_summary JSONB DEFAULT '{}'::jsonb,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_match_results_cand_job ON match_results (candidate_id, job_id);

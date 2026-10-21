"""
SQLite tables preserving the existing SupportHR business data shape and imported rows.
Provides indexed typed columns and raw JSON payload preservation.
"""

BUSINESS_TABLES_DDL = """
-- 1. users: Profile người dùng, vai trò (recruiter/candidate), thông tin liên hệ
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- Giữ khóa tương thích dữ liệu nghiệp vụ đã nhập
    uid TEXT UNIQUE NOT NULL,                  -- Mã định danh người dùng hiện có
    email TEXT,                                -- Email
    displayName TEXT,                          -- Tên hiển thị
    avatar TEXT,                               -- Ảnh đại diện
    photoURL TEXT,                             -- URL ảnh
    provider TEXT,                             -- google.com / password
    userRole TEXT DEFAULT 'recruiter',         -- recruiter / candidate
    recruiter_title TEXT,                      -- Chức vụ tuyển dụng
    recruiter_company TEXT,                    -- Công ty
    recruiter_department TEXT,                 -- Phòng ban
    recruiter_phone TEXT,                      -- Số điện thoại
    email_signature TEXT,                      -- Chữ ký email
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT                        -- Snapshot dữ liệu nguồn cũ
);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. userSettings: Cấu hình cá nhân, giao diện, thời gian lưu lịch sử, fixed JD
CREATE TABLE IF NOT EXISTS userSettings (
    id TEXT PRIMARY KEY,                       -- doc id = uid
    uid TEXT UNIQUE NOT NULL,                  -- Mã định danh người dùng hiện có
    email TEXT,
    settingsVersion INTEGER DEFAULT 1,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'vi',
    historyRetention INTEGER DEFAULT 50,
    autoSync INTEGER DEFAULT 1,
    defaultWeights TEXT,                       -- JSON object
    fixedJd TEXT,                              -- JSON object
    notificationSettings TEXT,                 -- JSON object
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_settings_uid ON userSettings(uid);

-- 3. cvHistory: Lịch sử các phiên chấm điểm CV, snapshot ứng viên và xếp hạng
CREATE TABLE IF NOT EXISTS cvHistory (
    id TEXT PRIMARY KEY,                       -- Khóa bản ghi được giữ tương thích
    uid TEXT NOT NULL,
    email TEXT,
    jdTitle TEXT,
    jdText TEXT,
    jobPosition TEXT,
    locationRequirement TEXT,
    totalCandidates INTEGER DEFAULT 0,
    grades TEXT,                               -- JSON {'A': 2, 'B': 1, ...}
    topCandidates TEXT,                        -- JSON array
    results TEXT,                              -- JSON array full candidates
    fullPayload TEXT,                          -- JSON full analysis snapshot
    timestamp INTEGER,                         -- Milliseconds timestamp
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_cv_history_uid ON cvHistory(uid);
CREATE INDEX IF NOT EXISTS idx_cv_history_timestamp ON cvHistory(timestamp);

-- 4. syncedAnalysisCache: Bộ nhớ đệm kết quả phân tích theo hash JD + CV + Trọng số
CREATE TABLE IF NOT EXISTS syncedAnalysisCache (
    cacheKey TEXT PRIMARY KEY,                 -- Deterministic SHA-256 hash
    uid TEXT NOT NULL,
    hashJd TEXT,
    hashWeights TEXT,
    hashFilters TEXT,
    candidateName TEXT,
    totalScore REAL,
    rank TEXT,
    resultJson TEXT NOT NULL,                  -- JSON candidate result
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_cache_uid ON syncedAnalysisCache(uid);

-- 5. syncedAnalysisHistory: Lịch sử đồng bộ phiên phân tích dùng cho Web & Mobile
CREATE TABLE IF NOT EXISTS syncedAnalysisHistory (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    jobPosition TEXT,
    locationRequirement TEXT,
    totalCandidates INTEGER DEFAULT 0,
    gradesCount TEXT,                          -- JSON
    analysisData TEXT,                         -- JSON
    screeningIndex TEXT,                       -- JSON
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_synced_hist_uid ON syncedAnalysisHistory(uid);
CREATE INDEX IF NOT EXISTS idx_synced_hist_time ON syncedAnalysisHistory(timestamp);

-- 6. uploadedFiles: Metadata và text bóc tách từ tài liệu upload (PDF, Word, TXT)
CREATE TABLE IF NOT EXISTS uploadedFiles (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    fileName TEXT NOT NULL,
    fileType TEXT,                             -- 'cv' hoặc 'jd'
    fileSize INTEGER,
    mimeType TEXT,
    fileExtension TEXT,
    ocrMethod TEXT,
    extractedText TEXT,
    extractedTextLength INTEGER,
    processingTimeMs INTEGER,
    analysisSessionId TEXT,
    candidateName TEXT,
    jobPosition TEXT,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastAccessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uid ON uploadedFiles(uid);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_type ON uploadedFiles(fileType);

-- 7. userJDTemplates: Mẫu JD cá nhân hóa lưu lại của nhà tuyển dụng
CREATE TABLE IF NOT EXISTS userJDTemplates (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    jobPosition TEXT,
    jdText TEXT NOT NULL,
    hardFilters TEXT,                          -- JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_jd_templates_uid ON userJDTemplates(uid);

-- 8. chatbotSessions: Lịch sử phiên đàm thoại AI Copilot tuyển dụng
CREATE TABLE IF NOT EXISTS chatbotSessions (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    jobPosition TEXT,
    totalCandidates INTEGER DEFAULT 0,
    sessionTitle TEXT,
    messages TEXT,                             -- JSON array of messages
    messageCount INTEGER DEFAULT 0,
    analysisContext TEXT,                      -- JSON
    candidateBriefs TEXT,                      -- JSON
    lastSuggestedCandidateIds TEXT,            -- JSON array
    lastFocusCandidateId TEXT,
    lastMessageAt INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_chatbot_uid ON chatbotSessions(uid);

-- 9. manualHistory: Lịch sử thao tác thủ công (collection CLdl7JGuaOGIuijiDZeG)
CREATE TABLE IF NOT EXISTS manualHistory (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    rawPayload TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_manual_hist_uid ON manualHistory(uid);

-- 10. googleDriveConnections: Kết nối tài khoản Google Drive & OAuth tokens
CREATE TABLE IF NOT EXISTS googleDriveConnections (
    id TEXT PRIMARY KEY,                       -- doc id = uid
    uid TEXT UNIQUE NOT NULL,
    email TEXT,
    displayName TEXT,
    photoUrl TEXT,
    driveUserId TEXT,
    scopes TEXT,                               -- JSON array
    accessTokenEncrypted TEXT,
    refreshTokenEncrypted TEXT,
    expiresAt INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_gdrive_uid ON googleDriveConnections(uid);

-- 11. googleDriveOAuthStates: Trạng thái CSRF tạm thời khi cấp quyền Google Drive
CREATE TABLE IF NOT EXISTS googleDriveOAuthStates (
    state TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    redirectUri TEXT,
    expiresAt INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    codeVerifier TEXT NOT NULL DEFAULT ''
);

-- 12. analysisFeedback: Phản hồi của Recruiter (Like, Shortlist, Interview, Hire, Reject)
CREATE TABLE IF NOT EXISTS analysisFeedback (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    sessionId TEXT,
    candidateId TEXT,
    jobPosition TEXT,
    action TEXT NOT NULL,                      -- like, shortlist, interview, hire, dislike, reject
    aiScore REAL,
    finalScore REAL,
    reason TEXT,
    notes TEXT,
    severity TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_feedback_uid ON analysisFeedback(uid);
CREATE INDEX IF NOT EXISTS idx_feedback_action ON analysisFeedback(action);

-- 13. approvedExemplars: Hồ sơ ứng viên mẫu chuẩn hóa dùng cho RAG Few-shot Grounding
CREATE TABLE IF NOT EXISTS approvedExemplars (
    id TEXT PRIMARY KEY,
    title TEXT,
    text TEXT NOT NULL,
    rubricVersion TEXT DEFAULT 'v2',
    vectorIndexVersion TEXT,
    status TEXT DEFAULT 'approved',
    approved INTEGER DEFAULT 1,
    role TEXT,
    seniority TEXT,
    domain TEXT,
    standardScore REAL,
    embedding BLOB,                            -- 768-dim float32 vector blob
    metadataJson TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_exemplars_role ON approvedExemplars(role);
CREATE INDEX IF NOT EXISTS idx_exemplars_status ON approvedExemplars(status);

-- 14. analysisJobs: Hàng đợi bất đồng bộ xử lý phân tích CV lớn
CREATE TABLE IF NOT EXISTS analysisJobs (
    jobId TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    status TEXT NOT NULL,                      -- queued, processing, completed, failed
    progress REAL DEFAULT 0.0,
    message TEXT,
    requestPayload TEXT,                       -- JSON
    result TEXT,                               -- JSON
    error TEXT,
    sourceTexts TEXT,                          -- JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysisJobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_uid ON analysisJobs(uid);

-- 15. aiRequestHistory: Nhật ký audit gọi AI (JD structure, hard filters, interview, chat)
CREATE TABLE IF NOT EXISTS aiRequestHistory (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    operation TEXT NOT NULL,                   -- jd_structure, jd_position, interview_questions, etc.
    requestPayload TEXT,                       -- JSON
    responsePayload TEXT,                      -- JSON
    metadata TEXT,                             -- JSON
    timestamp INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_request_op ON aiRequestHistory(operation);
CREATE INDEX IF NOT EXISTS idx_ai_request_uid ON aiRequestHistory(uid);

-- 16. mobileQuickCvAnalyses: Lịch sử chấm điểm nhanh Quick CV từ ứng dụng di động
CREATE TABLE IF NOT EXISTS mobileQuickCvAnalyses (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    feature TEXT DEFAULT 'mobileQuickCvAnalysis',
    schemaVersion INTEGER DEFAULT 1,
    source TEXT DEFAULT 'backend',
    jdTitle TEXT,
    jdText TEXT,
    targetRole TEXT,
    summary TEXT,
    itemCount INTEGER DEFAULT 0,
    items TEXT,                                -- JSON array
    usageNote TEXT,
    model TEXT,
    request TEXT,                              -- JSON
    response TEXT,                             -- JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_quick_cv_uid ON mobileQuickCvAnalyses(uid);

-- 17. fileExtractions: Lịch sử trích xuất OCR tài liệu từ backend/mobile
CREATE TABLE IF NOT EXISTS fileExtractions (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    fileName TEXT NOT NULL,
    mimeType TEXT,
    fileSize INTEGER,
    documentType TEXT,
    forceOcr INTEGER DEFAULT 0,
    extractedText TEXT,
    extractedTextLength INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_file_extractions_uid ON fileExtractions(uid);

-- 18. mobileJDStandardizations: Lịch sử chuẩn hóa JD từ ứng dụng di động
CREATE TABLE IF NOT EXISTS mobileJDStandardizations (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    feature TEXT DEFAULT 'mobileJDStandardization',
    title TEXT,
    jdText TEXT,
    targetPlatform TEXT,
    score REAL,
    template TEXT,                             -- JSON
    supplementalFields TEXT,                   -- JSON
    sourceFile TEXT,                           -- JSON
    response TEXT,                             -- JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_jd_uid ON mobileJDStandardizations(uid);

-- 19. mobileInboxViews: Bảng tổng hợp Inbox ứng viên của Recruiter tối ưu cho Mobile
CREATE TABLE IF NOT EXISTS mobileInboxViews (
    id TEXT PRIMARY KEY,                       -- {uid}__{email_key}
    uid TEXT NOT NULL,
    email TEXT,
    totalCount INTEGER DEFAULT 0,
    items TEXT,                                -- JSON array of candidate inbox cards
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_inbox_views_uid ON mobileInboxViews(uid);

-- 20. userSyncState: Quản lý trạng thái đồng bộ đa nền tảng (Web & Mobile)
CREATE TABLE IF NOT EXISTS userSyncState (
    uid TEXT PRIMARY KEY,
    latestRevision TEXT,
    lastUpdatedAt INTEGER,
    lastSource TEXT,                           -- history, feedback, template, cache
    source_payload TEXT
);

-- 21. desktopSessions: Trạng thái phiên làm việc Desktop SPA theo thời gian thực
CREATE TABLE IF NOT EXISTS desktopSessions (
    uid TEXT PRIMARY KEY,
    status TEXT,                               -- analyzing, done, idle
    jobPosition TEXT,
    totalCvs INTEGER DEFAULT 0,
    analyzedCount INTEGER DEFAULT 0,
    startedAt INTEGER,
    lastHeartbeat INTEGER,
    source_payload TEXT
);

-- 22. sessionCommands: Lệnh điều khiển từ xa từ Mobile tới Desktop (Approve all A, view...)
CREATE TABLE IF NOT EXISTS sessionCommands (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    command TEXT NOT NULL,                     -- approve_all_a, view_results, ping
    payload TEXT,                              -- JSON
    executed INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_commands_uid ON sessionCommands(uid);

-- 23. loginHistory: Lịch sử đăng nhập thiết bị
CREATE TABLE IF NOT EXISTS loginHistory (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    email TEXT,
    deviceInfo TEXT,
    ipAddress TEXT,
    loginAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_login_hist_uid ON loginHistory(uid);

-- 24. vectorLibraryRecords: Kho Vector RAG toàn diện của hệ thống
CREATE TABLE IF NOT EXISTS vectorLibraryRecords (
    id TEXT PRIMARY KEY,
    collectionName TEXT NOT NULL,
    docId TEXT,
    textContent TEXT NOT NULL,
    embeddingBlob BLOB NOT NULL,
    metadataJson TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_vector_lib_col ON vectorLibraryRecords(collectionName);
"""

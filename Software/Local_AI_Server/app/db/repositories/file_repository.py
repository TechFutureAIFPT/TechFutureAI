from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid

from app.db.database import get_db


class FileRepository:
    @staticmethod
    def save_file_extraction(
        filename: str,
        extracted_text: str,
        content_type: str = "",
        file_size: int = 0,
        document_type: str = "cv",
        user_id: Optional[str] = "local-user",
        file_id: Optional[str] = None,
    ) -> str:
        rec_id = file_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        uid = user_id or "local-recruiter-001"

        with get_db() as conn:
            # 1. Local fast-path table
            conn.execute(
                """
                INSERT OR REPLACE INTO uploaded_files (
                    id, user_id, filename, content_type, file_size,
                    document_type, extracted_text, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rec_id, uid, filename, content_type, file_size, document_type, extracted_text, now),
            )
            # Keep the legacy business-table projection in the same SQLite transaction.
            conn.execute(
                """
                INSERT OR REPLACE INTO uploadedFiles (
                    id, uid, fileName, fileType, fileSize, mimeType,
                    extractedText, extractedTextLength, uploadedAt, lastAccessedAt, source_payload
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rec_id, uid, filename, document_type, file_size, content_type, extracted_text, len(extracted_text), now, now, extracted_text[:500]),
            )
            # Preserve the existing extraction-history API shape.
            conn.execute(
                """
                INSERT OR REPLACE INTO fileExtractions (
                    id, uid, email, fileName, mimeType, fileSize, documentType,
                    extractedText, extractedTextLength, createdAt, source_payload
                )
                VALUES (?, ?, 'local@supporthr.vn', ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rec_id, uid, filename, content_type, file_size, document_type, extracted_text, len(extracted_text), now, extracted_text[:500]),
            )
        return rec_id

    @staticmethod
    def get_file(file_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.execute(
                "SELECT * FROM uploaded_files WHERE id = ?",
                (file_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)

from datetime import UTC, datetime
from typing import Any

from app.db.database import get_db


class UserRepository:
    @staticmethod
    def _profile(row: Any) -> dict[str, Any]:
        profile = dict(row)
        profile["display_name"] = profile.get("displayName") or ""
        profile["user_role"] = profile.get("userRole") or "recruiter"
        profile["created_at"] = profile.get("createdAt")
        profile["updated_at"] = profile.get("updatedAt")
        return profile

    @staticmethod
    def get_or_create_user(
        uid: str = "local-recruiter-001",
        email: str = "recruiter@local.supporthr.vn",
        display_name: str = "Local Recruiter",
        user_role: str = "recruiter",
    ) -> dict[str, Any]:
        now = datetime.now(UTC).isoformat()
        with get_db() as conn:
            cursor = conn.execute("SELECT * FROM users WHERE uid = ?", (uid,))
            row = cursor.fetchone()
            if row:
                return UserRepository._profile(row)

            conn.execute(
                """
                INSERT INTO users (id, uid, email, displayName, userRole, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (uid, uid, email, display_name, user_role, now, now),
            )
            cursor = conn.execute("SELECT * FROM users WHERE uid = ?", (uid,))
            return UserRepository._profile(cursor.fetchone())

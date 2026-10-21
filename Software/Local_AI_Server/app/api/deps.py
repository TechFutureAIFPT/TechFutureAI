from typing import Any, Dict, Optional
from fastapi import Header, HTTPException, Request

from app.db.repositories.user_repository import UserRepository
from app.services.local_auth_service import verify_session


def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """
    Get current user profile. For Local Server, defaults to local recruiter profile
    while preserving token compatibility.
    """
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not token:
        token = request.cookies.get("aimatch_local_session", "")
    if token:
        try:
            claims = verify_session(token)
            return UserRepository.get_or_create_user(
                uid=str(claims["uid"]),
                email=str(claims.get("email") or ""),
                display_name=str(claims.get("name") or ""),
                user_role="recruiter",
            )
        except ValueError:
            raise HTTPException(401, "Phiên đăng nhập local đã hết hạn hoặc không hợp lệ.") from None

    uid = "local-recruiter-001"
    email = "recruiter@local.supporthr.vn"
    display_name = "Local HR Specialist"

    return UserRepository.get_or_create_user(
        uid=uid,
        email=email,
        display_name=display_name,
        user_role="recruiter",
    )

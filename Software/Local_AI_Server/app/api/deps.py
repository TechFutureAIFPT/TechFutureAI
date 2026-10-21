from typing import Any, Dict, Optional
from fastapi import Header

from app.db.repositories.user_repository import UserRepository


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    """
    Get current user profile. For Local Server, defaults to local recruiter profile
    while preserving token compatibility.
    """
    uid = "local-recruiter-001"
    email = "recruiter@local.supporthr.vn"
    display_name = "Local HR Specialist"

    return UserRepository.get_or_create_user(
        uid=uid,
        email=email,
        display_name=display_name,
        user_role="recruiter",
    )

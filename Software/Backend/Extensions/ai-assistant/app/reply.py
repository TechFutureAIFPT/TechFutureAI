from __future__ import annotations

import time
from typing import Any

from fastapi import HTTPException, status

from app import gemini, service
from app.auth import AuthenticatedUser

MAX_HISTORY_TURNS = 10

_SYSTEM_PROMPT = (
    "Bạn là Trợ lý AI của SupportHR — trợ lý trò chuyện tổng quát về tuyển dụng, nghề nghiệp, "
    "CV/JD và thị trường việc làm, dành cho cả recruiter và người tìm việc.\n"
    "Trả lời ngắn gọn, rõ ràng, đi thẳng vào trọng tâm, bằng tiếng Việt trừ khi người dùng hỏi bằng "
    "ngôn ngữ khác.\n"
    "QUAN TRỌNG: bạn KHÔNG có kết nối tới dữ liệu thị trường việc làm thời gian thực — không có số liệu "
    "lương, số lượng job đang tuyển hay xu hướng tuyển dụng theo từng thời điểm. Nếu người dùng hỏi số "
    "liệu cụ thể, hãy nói rõ bạn chưa có dữ liệu thực tế được kết nối và trả lời ở mức khái quát dựa trên "
    "kiến thức chung, không tự bịa ra con số hay tự nhận đã truy vấn cơ sở dữ liệu/API nào."
)


def _fallback_reply_text() -> str:
    return "Xin lỗi, trợ lý chưa trả lời được ngay lúc này. Bạn thử gửi lại câu hỏi sau ít phút nhé."


def _build_prompt(history: list[dict[str, Any]], message: str) -> str:
    lines = [_SYSTEM_PROMPT, ""]
    recent = history[-MAX_HISTORY_TURNS:]
    if recent:
        lines.append("Lịch sử hội thoại gần đây:")
        for item in recent:
            speaker = "Người dùng" if item.get("author") == "user" else "Trợ lý"
            content = str(item.get("content") or "").strip()
            if content:
                lines.append(f"{speaker}: {content}")
        lines.append("")
    lines.append(f"Người dùng: {message}")
    lines.append("Trợ lý:")
    return "\n".join(lines)


def reply_to_session(user: AuthenticatedUser, session_id: str, message: str) -> dict[str, Any]:
    snapshot = service.get_owned_session_snapshot(user, session_id)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phiên trò chuyện.")

    normalized_message = str(message or "").strip()
    if not normalized_message:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Câu hỏi không được để trống.")

    session_data = snapshot.to_dict() or {}
    history = list(session_data.get("messages") or [])
    prompt = _build_prompt(history, normalized_message)

    try:
        raw_reply = gemini.generate_content(prompt, temperature=0.4)
        response_text = str(raw_reply or "").strip() or _fallback_reply_text()
    except Exception:
        response_text = _fallback_reply_text()

    now = int(time.time() * 1000)
    user_message = {"id": f"{now}-u", "author": "user", "content": normalized_message, "timestamp": now}
    assistant_message = {"id": f"{now + 1}-b", "author": "bot", "content": response_text, "timestamp": now + 1}

    patch = service.build_messages_patch(snapshot, [user_message, assistant_message])
    service.apply_session_patch(snapshot, patch)

    return {
        "sessionId": session_id,
        "userMessage": user_message,
        "assistantMessage": assistant_message,
        "responseText": response_text,
    }

/**
 * emailService — Gửi email ứng viên qua backend API.
 *
 * Backend: POST /api/account/email/send
 *   headers: Authorization: Bearer <firebase_id_token>
 *   body: { emails: [{ to, subject, body }] }
 *   → { sent, failed, results: [{ to, status, id?, error? }] }
 *
 * Nếu không có authToken hoặc backend lỗi → trả về false để FE fallback mailto:.
 */
import { Linking } from "react-native";
import { RENDER_API_URL } from "./renderClient";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSendResult {
  sent: number;
  failed: number;
  results: Array<{ to: string; status: string; id?: string; error?: string }>;
}

/**
 * Gửi email qua backend (cần auth token Firebase).
 * Returns null nếu request thất bại hoặc không có token.
 */
export async function sendEmailViaBackend(
  emails: EmailPayload[],
  authToken: string,
): Promise<EmailSendResult | null> {
  try {
    const response = await fetch(`${RENDER_API_URL}/api/account/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ emails }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[emailService] Backend error ${response.status}:`, text);
      return null;
    }

    return (await response.json()) as EmailSendResult;
  } catch (error) {
    console.warn("[emailService] Fetch error:", error);
    return null;
  }
}

/**
 * Fallback: Mở ứng dụng email mặc định (mailto:).
 * Dùng khi backend không khả dụng hoặc không có auth.
 */
export async function openMailtoFallback(email: EmailPayload): Promise<boolean> {
  try {
    const mailto = `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (!canOpen) return false;
    await Linking.openURL(mailto);
    return true;
  } catch {
    return false;
  }
}

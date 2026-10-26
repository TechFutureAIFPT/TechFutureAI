"use client";

import { useEffect, useRef, useState } from "react";
import { account } from "@/lib/api-endpoints";

export default function DriveCallbackPage() {
  const started = useRef(false);
  const [message, setMessage] = useState("Đang xác nhận kết nối Google Drive…");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const state = query.get("state");
    window.history.replaceState({}, "", window.location.pathname);
    if (query.has("error") || !code || !state) {
      setMessage("Kết nối đã bị hủy hoặc thiếu thông tin xác nhận. Bạn có thể đóng cửa sổ này.");
      return;
    }
    const redirect = `${window.location.origin}/google-drive/callback`;
    void account.driveExchange(code, state, redirect).then(() => {
      setMessage("Đã kết nối Google Drive. Bạn có thể đóng cửa sổ này.");
      window.opener?.postMessage({ type: "aimatch-drive-connected" }, window.location.origin);
      window.close();
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Không thể xác nhận kết nối Google Drive."));
  }, []);
  return <main className="mx-auto max-w-lg p-10"><h1 className="text-xl font-semibold">Google Drive · AI Match</h1><p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p></main>;
}

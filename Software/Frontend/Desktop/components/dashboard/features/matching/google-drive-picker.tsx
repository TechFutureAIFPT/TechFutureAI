"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudDownload, FileText, Folder, Loader2, Search, Unplug } from "lucide-react";
import { account } from "@/lib/api-endpoints";
import type { DriveFile, DriveImport, DriveStatus } from "@/lib/types/google-drive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const FOLDER = "application/vnd.google-apps.folder";

export function GoogleDrivePicker({ onImport, forceOcr, disabled }: {
  onImport: (file: DriveImport) => void;
  forceOcr: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folder, setFolder] = useState("root");
  const [search, setSearch] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const popup = useRef<Window | null>(null);
  const generation = useRef(0);
  const showError = (value: unknown) => setError(value instanceof Error ? value.message : "Không thể xử lý yêu cầu Google Drive.");

  const load = useCallback(async (page?: string) => {
    const request = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await account.driveFiles({ folder_id: search.trim() ? undefined : folder, search: search.trim() || undefined, page_token: page });
      if (request !== generation.current) return;
      setFiles((previous) => page ? [...previous, ...result.files] : result.files);
      setNextPage(result.nextPageToken || null);
    } catch (value) { if (request === generation.current) showError(value); }
    finally { if (request === generation.current) setBusy(false); }
  }, [folder, search]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try { setStatus(await account.driveStatus()); }
    catch (value) { showError(value); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);
  useEffect(() => {
    if (!open || !status?.connected) return;
    const timeout = window.setTimeout(() => { void load(); }, 250);
    return () => window.clearTimeout(timeout);
  }, [open, status?.connected, load]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === popup.current && event.data?.type === "aimatch-drive-connected") void refresh();
    };
    window.addEventListener("message", receive);
    return () => { window.removeEventListener("message", receive); generation.current++; };
  }, [refresh]);

  const connect = async () => {
    popup.current = window.open("about:blank", "aimatch-drive", "popup,width=560,height=740");
    if (!popup.current) { setError("Trình duyệt đã chặn cửa sổ kết nối Google."); return; }
    setError("");
    try {
      const result = await account.driveOAuthUrl(`${window.location.origin}/google-drive/callback`);
      popup.current.location.replace(result.authUrl);
    } catch (value) { popup.current.close(); showError(value); }
  };

  const importFile = async (file: DriveFile) => {
    if (file.mimeType === FOLDER) { setFolder(file.id); setSearch(""); return; }
    setBusy(true);
    setError("");
    try {
      const result = await account.driveImport(file.id, forceOcr);
      if (!result.extractedText.trim()) throw new Error("Tệp chưa có văn bản có thể phân tích.");
      onImport(result);
      setOpen(false);
    } catch (value) { showError(value); }
    finally { setBusy(false); }
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" disabled={disabled}><CloudDownload className="mr-2 size-4" />Nhập từ Google Drive</Button></DialogTrigger>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Hồ sơ từ Google Drive</DialogTitle><DialogDescription>Kết nối tài khoản, chọn hồ sơ và nhập văn bản vào phiên phân tích CV Match.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {!status?.connected ? <div className="space-y-4 py-8 text-center"><CloudDownload className="mx-auto size-10 text-sky-600" /><p className="text-sm text-muted-foreground">Quyền truy cập và kết nối Google được quản lý theo tài khoản của bạn.</p><Button disabled={busy} onClick={() => { void connect(); }}>Kết nối Google Drive</Button></div> : <>
        <div className="flex items-center justify-between gap-3"><span className="truncate text-sm text-muted-foreground">{status.email}</span><Button variant="ghost" size="sm" disabled={busy} onClick={() => { setBusy(true); void account.driveDisconnect().then(() => { setStatus({ connected: false }); setFiles([]); }).catch(showError).finally(() => setBusy(false)); }}><Unplug className="mr-2 size-4" />Ngắt kết nối</Button></div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={() => { setFolder("root"); setSearch(""); }}>Drive của tôi</Button><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Tìm hồ sơ trên Drive" placeholder="Tìm theo tên tệp…" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
        <div className="max-h-80 min-h-40 overflow-y-auto rounded-xl border" aria-busy={busy}>
          {files.map((file) => <button key={file.id} type="button" disabled={busy} onClick={() => { void importFile(file); }} className="flex w-full items-center gap-3 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted disabled:opacity-60">{file.mimeType === FOLDER ? <Folder className="size-5 shrink-0 text-amber-600" /> : <FileText className="size-5 shrink-0 text-sky-600" />}<span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-muted-foreground">{file.mimeType === FOLDER ? "Mở thư mục" : "Nhập hồ sơ"}</span></button>)}
          {!files.length && !busy && <p className="p-8 text-center text-sm text-muted-foreground">Không có tệp phù hợp trong thư mục này.</p>}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground"><span role="status">{busy ? <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Đang xử lý…</span> : `${files.length} tệp và thư mục`}</span>{nextPage && <Button variant="outline" size="sm" disabled={busy} onClick={() => { void load(nextPage); }}>Xem thêm</Button>}</div>
      </>}
    </DialogContent>
  </Dialog>;
}

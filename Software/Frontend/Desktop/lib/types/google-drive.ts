export interface DriveStatus {
  connected: boolean;
  email?: string | null;
  scopes?: string[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number | null;
  modifiedTime?: string | null;
}

export interface DriveImport {
  fileId: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  mimeType: string;
  savedUploadedFileId?: string | null;
}

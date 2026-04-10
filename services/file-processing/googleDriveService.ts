// Google Drive Service — singleton loader đảm bảo scripts gapi/gis load trước khi dùng

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  downloadUrl?: string;
  accessToken?: string;
}

// ── Script Loader ─────────────────────────────────────────────────────────────

const LOADED: { gapi: boolean; gis: boolean } = { gapi: false, gis: false };

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureScriptsLoaded(): Promise<void> {
  if (LOADED.gapi && LOADED.gis) return;
  try {
    await Promise.all([
      loadScript('https://apis.google.com/js/api.js', '__gapi_script__'),
      loadScript('https://accounts.google.com/gsi/client', '__gis_script__'),
    ]);
    // Chờ gapi thực sự ready
    await new Promise<void>((resolve) => {
      if (window.gapi) { LOADED.gapi = true; resolve(); return; }
      const interval = setInterval(() => {
        if (window.gapi) { clearInterval(interval); LOADED.gapi = true; resolve(); }
      }, 100);
      // Timeout 15s
      setTimeout(() => { clearInterval(interval); resolve(); }, 15000);
    });
    LOADED.gis = true;
  } catch (e) {
    console.error('[GoogleDrive] Script load error:', e);
    throw e;
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

class GoogleDriveService {
  private developerKey: string = '';
  private clientId: string = '1022447215307-67nghlm1hv26vbieho7ho52gqhagpfj7.apps.googleusercontent.com';
  private appId: string = '1022447215307';
  private pickerApiLoaded: boolean = false;
  private oauthToken: string | null = null;

  constructor() {
    this.developerKey =
      (import.meta as any).env?.VITE_GOOGLE_PICKER_API_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_API_KEY ||
      '';

    this.clientId =
      (import.meta as any).env?.VITE_GOOGLE_PICKER_CLIENT_ID ||
      this.clientId;
    this.appId =
      (import.meta as any).env?.VITE_GOOGLE_PICKER_APP_ID ||
      this.appId;
  }

  public async ensureReady(): Promise<void> {
    await ensureScriptsLoaded();
  }

  private async loadPicker(): Promise<void> {
    if (this.pickerApiLoaded) return;
    await this.ensureReady();

    return new Promise<void>((resolve, reject) => {
      window.gapi.load('picker', {
        callback: () => { this.pickerApiLoaded = true; resolve(); },
        onerror: () => reject(new Error('Failed to load Google Picker API')),
      });
    });
  }

  public async authenticate(): Promise<string> {
    await this.ensureReady();

    // Check stored token
    if (!this.oauthToken) {
      try {
        const storedToken = localStorage.getItem('googleDriveToken');
        if (storedToken) {
          this.oauthToken = storedToken;
          return storedToken;
        }
      } catch (e) {
        console.error('[GoogleDrive] Error reading token from localStorage', e);
      }
    }

    if (this.oauthToken) return this.oauthToken;

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services not loaded. Please check your internet connection.');
    }

    return new Promise<string>((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error !== undefined) {
            console.error('[GoogleDrive] OAuth Error:', response);
            reject(response);
            return;
          }
          this.oauthToken = response.access_token;
          try { localStorage.setItem('googleDriveToken', response.access_token); } catch {}
          resolve(response.access_token);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  public async openPicker(options: { mimeTypes?: string; multiSelect?: boolean }): Promise<DriveFile[]> {
    await this.ensureReady();

    try { await this.loadPicker(); } catch (e) {
      console.error('[GoogleDrive] loadPicker failed:', e);
      throw e;
    }

    if (!this.oauthToken) {
      try { await this.authenticate(); } catch (e) { throw e; }
    }

    if (!this.developerKey) {
      throw new Error('VITE_GOOGLE_PICKER_API_KEY chưa được cấu hình.');
    }
    if (!this.clientId) {
      throw new Error('VITE_GOOGLE_PICKER_CLIENT_ID chưa được cấu hình.');
    }
    if (!this.appId) {
      throw new Error('VITE_GOOGLE_PICKER_APP_ID chưa được cấu hình.');
    }

    const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    docsView.setIncludeFolders(true);
    docsView.setParent('root');
    if (options.mimeTypes) docsView.setMimeTypes(options.mimeTypes);

    const pickerBuilder = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .setAppId(this.appId)
      .setOAuthToken(this.oauthToken!)
      .setDeveloperKey(this.developerKey)
      .addView(docsView)
      .addView(new window.google.picker.DocsUploadView())
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const files: DriveFile[] = data.docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            size: doc.sizeBytes || 0,
            url: doc.url,
            accessToken: this.oauthToken!,
          }));
          // Resolve using the stored promise ref
          this._pickerResolve?.(files);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          this._pickerResolve?.([]);
        }
      });

    if (options.multiSelect) {
      pickerBuilder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
    }

    const picker = pickerBuilder.build();
    picker.setVisible(true);

    // Return a promise that resolves when the picker callback fires
    return new Promise((resolve) => {
      this._pickerResolve = resolve;
    });
  }

  // Temporary storage for picker callback — reset after each openPicker
  private _pickerResolve?: (files: DriveFile[]) => void;

  public async downloadFile(fileId: string, accessToken: string): Promise<Blob> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      throw new Error(`Không thể tải file từ Google Drive: ${response.statusText}`);
    }
    return await response.blob();
  }

  /** Clear stored token — useful when token expires */
  public clearToken() {
    this.oauthToken = null;
    this.pickerApiLoaded = false;
    try { localStorage.removeItem('googleDriveToken'); } catch {}
  }
}

export const googleDriveService = new GoogleDriveService();

/**
 * Service for tracking CV filtering history
 * Simple history tracking when CV filtering was performed
 */

interface CVFilterHistoryEntry {
  timestamp: number;
  date: string; // Formatted date string
  jobPosition?: string;
}

class CVFilterHistoryService {
  private readonly STORAGE_KEY = 'cvFilterHistory';
  private readonly MAX_HISTORY_ENTRIES = 30;

  /**
   * Add a new CV filter entry to history
   */
  addFilterSession(jobPosition: string): void {
    const entry: CVFilterHistoryEntry = {
      timestamp: Date.now(),
      date: new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      jobPosition: jobPosition || 'Không rõ vị trí'
    };

    const history = this.getHistory();
    history.unshift(entry); // Add to beginning

    // Keep only MAX_HISTORY_ENTRIES
    if (history.length > this.MAX_HISTORY_ENTRIES) {
      history.splice(this.MAX_HISTORY_ENTRIES);
    }

    this.saveHistory(history);
  }

  /**
   * Get CV filter history
   */
  getHistory(): CVFilterHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load CV filter history:', error);
      return [];
    }
  }

  /**
   * Save history to localStorage
   */
  private saveHistory(history: CVFilterHistoryEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save CV filter history:', error);
    }
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get simple history stats
   */
  getHistoryStats(): {
    totalSessions: number;
    lastSession: string | null;
    thisWeekCount: number;
    thisMonthCount: number;
  } {
    const history = this.getHistory();
    
    if (history.length === 0) {
      return {
        totalSessions: 0,
        lastSession: null,
        thisWeekCount: 0,
        thisMonthCount: 0
      };
    }

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const thisWeekCount = history.filter(entry => entry.timestamp > oneWeekAgo).length;
    const thisMonthCount = history.filter(entry => entry.timestamp > oneMonthAgo).length;

    // Format the last session date from timestamp if possible to avoid "Invalid Date"
    let lastSessionDate = history[0]?.date;
    if (history[0]?.timestamp && !isNaN(history[0].timestamp)) {
      try {
        lastSessionDate = new Date(history[0].timestamp).toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        console.error("Error formatting date", e);
      }
    }

    return {
      totalSessions: history.length,
      lastSession: lastSessionDate || null,
      thisWeekCount,
      thisMonthCount
    };
  }

  /**
   * Get recent history (last 15 entries)
   */
  getRecentHistory(): CVFilterHistoryEntry[] {
    return this.getHistory().slice(0, 15);
  }
}

export const cvFilterHistoryService = new CVFilterHistoryService();
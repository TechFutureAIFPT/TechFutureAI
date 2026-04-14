import { DataSyncService } from '../data-sync/dataSyncService';
import { auth } from '../firebase';

/**
 * Advanced caching service for CV analysis results
 * Improves performance by caching analysis results and avoiding re-processing
 * Now with Firebase sync support for cross-device data persistence
 */

interface AnalysisCacheEntry {
  candidateData: any;
  timestamp: number;
  jdHash: string;
  weightsHash: string;
  filtersHash: string;
  fileSize: number;
  fileLastModified: number;
}

class AnalysisCacheService {
  private cache = new Map<string, AnalysisCacheEntry>();
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100; // Maximum cached entries

  /**
   * Generate a unique cache key for a file and analysis parameters
   */
  private generateCacheKey(file: File, jdHash: string, weightsHash: string, filtersHash: string): string {
    return `${file.name}_${file.size}_${file.lastModified}_${jdHash}_${weightsHash}_${filtersHash}`;
  }

  /**
   * Generate hash for analysis parameters
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate hashes for JD, weights, and filters
   */
  generateAnalysisHashes(jdText: string, weights: any, hardFilters: any): {
    jdHash: string;
    weightsHash: string;
    filtersHash: string;
  } {
    return {
      jdHash: this.hashString(jdText),
      weightsHash: this.hashString(JSON.stringify(weights)),
      filtersHash: this.hashString(JSON.stringify(hardFilters))
    };
  }

  /**
   * Check if we have a cached result for this file and analysis parameters
   * First checks local cache, then Firebase if user is logged in
   */
  async getCachedAnalysis(file: File, jdHash: string, weightsHash: string, filtersHash: string): Promise<any | null> {
    const key = this.generateCacheKey(file, jdHash, weightsHash, filtersHash);
    
    // First check local cache
    const entry = this.cache.get(key);
    if (entry) {
      // Check if cache entry is expired
      const isExpired = Date.now() - entry.timestamp > this.CACHE_EXPIRY;
      if (isExpired) {
        this.cache.delete(key);
      } else {
        // Verify file hasn't changed
        if (entry.fileSize === file.size && entry.fileLastModified === file.lastModified) {
          return entry.candidateData;
        } else {
          this.cache.delete(key);
        }
      }
    }

    // If not found locally and user is logged in, check Firebase
    if (auth.currentUser) {
      try {
        const firebaseResult = await DataSyncService.getCacheFromFirebase(key);
        if (firebaseResult) {
          // Add to local cache for faster access
          const cacheEntry: AnalysisCacheEntry = {
            candidateData: firebaseResult,
            timestamp: Date.now(),
            jdHash,
            weightsHash,
            filtersHash,
            fileSize: file.size,
            fileLastModified: file.lastModified
          };
          this.cache.set(key, cacheEntry);
          return firebaseResult;
        }
      } catch (error) {
        console.warn('Failed to get cache from Firebase:', error);
      }
    }

    return null;
  }

  /**
   * Cache analysis result for a file
   * Stores in local cache, localStorage, and Firebase (if user is logged in)
   */
  async cacheAnalysis(
    file: File, 
    candidateData: any, 
    jdHash: string, 
    weightsHash: string, 
    filtersHash: string
  ): Promise<void> {
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }

    const key = this.generateCacheKey(file, jdHash, weightsHash, filtersHash);
    const entry: AnalysisCacheEntry = {
      candidateData,
      timestamp: Date.now(),
      jdHash,
      weightsHash,
      filtersHash,
      fileSize: file.size,
      fileLastModified: file.lastModified
    };

    this.cache.set(key, entry);
    
    // Store in localStorage for persistence
    try {
      const persistentCache = this.loadPersistentCache();
      persistentCache[key] = entry;
      
      // Keep only recent entries for localStorage
      const cutoff = Date.now() - this.CACHE_EXPIRY;
      const filtered = Object.fromEntries(
        Object.entries(persistentCache).filter(([_, entry]) => (entry as AnalysisCacheEntry).timestamp > cutoff)
      );
      
      localStorage.setItem('cvAnalysisCache', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to persist analysis cache:', error);
    }

    // Sync to Firebase if user is logged in
    if (auth.currentUser) {
      try {
        await DataSyncService.syncCacheToFirebase(
          key,
          candidateData,
          jdHash,
          weightsHash,
          filtersHash,
          {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified
          }
        );
      } catch (error) {
        console.warn('Failed to sync cache to Firebase:', error);
      }
    }
  }

  /**
   * Load persistent cache from localStorage
   */
  private loadPersistentCache(): Record<string, AnalysisCacheEntry> {
    try {
      const stored = localStorage.getItem('cvAnalysisCache');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
      return {};
    }
  }

  /**
   * Initialize cache from localStorage and Firebase (if user is logged in)
   */
  async initializeFromStorage(): Promise<void> {
    // Load from localStorage first
    const persistentCache = this.loadPersistentCache();
    const cutoff = Date.now() - this.CACHE_EXPIRY;

    for (const [key, entry] of Object.entries(persistentCache)) {
      if (entry.timestamp > cutoff) {
        this.cache.set(key, entry);
      }
    }

    // Load from Firebase if user is logged in
    if (auth.currentUser) {
      try {
        const firebaseCache = await DataSyncService.getAllUserCacheFromFirebase();
        firebaseCache.forEach((candidateData, key) => {
          if (!this.cache.has(key)) {
            // Add Firebase cache to local cache (with current timestamp for expiry)
            const entry: AnalysisCacheEntry = {
              candidateData,
              timestamp: Date.now(),
              jdHash: '',
              weightsHash: '',
              filtersHash: '',
              fileSize: 0,
              fileLastModified: 0
            };
            this.cache.set(key, entry);
          }
        });
      } catch (error) {
        console.warn('Failed to load cache from Firebase:', error);
      }
    }
  }

  /**
   * Clean old cache entries
   */
  private cleanOldEntries(): void {
    const cutoff = Date.now() - this.CACHE_EXPIRY;
    const entriesToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoff) {
        entriesToDelete.push(key);
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => this.cache.delete(key));

    // If still too many entries, delete oldest ones
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE + 10);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses to calculate
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('cvAnalysisCache');
  }

  /**
   * Batch check for cached results (async version)
   */
  async batchCheckCache(
    files: File[], 
    jdHash: string, 
    weightsHash: string, 
    filtersHash: string
  ): Promise<{
    cached: Array<{ file: File; result: any }>;
    uncached: File[];
  }> {
    const cached: Array<{ file: File; result: any }> = [];
    const uncached: File[] = [];

    // Check all files concurrently
    const results = await Promise.all(
      files.map(async (file) => {
        const result = await this.getCachedAnalysis(file, jdHash, weightsHash, filtersHash);
        return { file, result };
      })
    );

    results.forEach(({ file, result }) => {
      if (result) {
        cached.push({ file, result });
      } else {
        uncached.push(file);
      }
    });

    return { cached, uncached };
  }
}

// Export singleton instance
export const analysisCacheService = new AnalysisCacheService();

// Initialize from storage on module load (async)
analysisCacheService.initializeFromStorage().catch(error => {
  console.warn('Failed to initialize cache from storage:', error);
});
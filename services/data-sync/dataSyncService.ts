import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { AnalysisRunData } from '../../assets/types';

interface SyncedCacheEntry {
  uid: string;
  email: string;
  cacheKey: string;
  candidateData: any;
  timestamp: any;
  jdHash: string;
  weightsHash: string;
  filtersHash: string;
  fileInfo: {
    name: string;
    size: number;
    lastModified: number;
  };
  expiresAt: any;
}

interface SyncedHistoryEntry {
  uid: string;
  email: string;
  analysisData: AnalysisRunData;
  timestamp: any;
  jobPosition: string;
  locationRequirement: string;
  totalCandidates: number;
  gradesCount: { A: number; B: number; C: number };
}

const SYNCED_CACHE_COLLECTION = 'syncedAnalysisCache';
const SYNCED_HISTORY_COLLECTION = 'syncedAnalysisHistory';
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days
const MAX_CACHE_ENTRIES_PER_USER = 50;
const MAX_HISTORY_ENTRIES_PER_USER = 100;

export class DataSyncService {
  
  /**
   * Đồng bộ cache analysis lên Firebase
   */
  static async syncCacheToFirebase(
    cacheKey: string,
    candidateData: any,
    jdHash: string,
    weightsHash: string,
    filtersHash: string,
    fileInfo: { name: string; size: number; lastModified: number }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

      const cacheEntry: SyncedCacheEntry = {
        uid: user.uid,
        email: user.email!,
        cacheKey,
        candidateData,
        timestamp: serverTimestamp(),
        jdHash,
        weightsHash,
        filtersHash,
        fileInfo,
        expiresAt
      };

      // Sử dụng cacheKey làm document ID để tránh duplicate
      const docRef = doc(db, SYNCED_CACHE_COLLECTION, `${user.uid}_${cacheKey}`);
      await setDoc(docRef, cacheEntry);

      // Cleanup old entries để không vượt quá limit
      await this.cleanupOldCacheEntries(user.uid);
    } catch (error) {
      console.error('Error syncing cache to Firebase:', error);
    }
  }

  /**
   * Lấy cache từ Firebase
   */
  static async getCacheFromFirebase(cacheKey: string): Promise<any | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const docRef = doc(db, SYNCED_CACHE_COLLECTION, `${user.uid}_${cacheKey}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const entry = docSnap.data() as SyncedCacheEntry;
      
      // Check if expired
      const now = new Date();
      const expiresAt = entry.expiresAt?.toDate?.() || new Date(0);
      if (now > expiresAt) {
        // Delete expired entry
        await deleteDoc(docRef);
        return null;
      }

      return entry.candidateData;
    } catch (error) {
      console.error('Error getting cache from Firebase:', error);
      return null;
    }
  }

  /**
   * Lấy tất cả cache của user từ Firebase
   */
  static async getAllUserCacheFromFirebase(): Promise<Map<string, any>> {
    const user = auth.currentUser;
    if (!user) return new Map();

    try {
      const q = query(
        collection(db, SYNCED_CACHE_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(MAX_CACHE_ENTRIES_PER_USER)
      );

      const querySnapshot = await getDocs(q);
      const cacheMap = new Map<string, any>();
      const now = new Date();
      const expiredDocs: any[] = [];

      querySnapshot.forEach((doc) => {
        const entry = doc.data() as SyncedCacheEntry;
        const expiresAt = entry.expiresAt?.toDate?.() || new Date(0);
        
        if (now <= expiresAt) {
          cacheMap.set(entry.cacheKey, entry.candidateData);
        } else {
          expiredDocs.push(doc.ref);
        }
      });

      // Cleanup expired entries
      if (expiredDocs.length > 0) {
        const batch = writeBatch(db);
        expiredDocs.forEach(docRef => batch.delete(docRef));
        await batch.commit();
      }

      return cacheMap;
    } catch (error) {
      console.error('Error getting all user cache from Firebase:', error);
      return new Map();
    }
  }

  /**
   * Đồng bộ lịch sử analysis lên Firebase
   */
  static async syncHistoryToFirebase(analysisData: AnalysisRunData): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const candidates = analysisData.candidates;
      const gradesCount = { A: 0, B: 0, C: 0 };
      
      candidates.forEach(c => {
        const grade = c.status === 'FAILED' ? 'C' : (c.analysis?.['Hạng'] || 'C');
        gradesCount[grade as keyof typeof gradesCount]++;
      });

      const historyEntry: SyncedHistoryEntry = {
        uid: user.uid,
        email: user.email!,
        analysisData,
        timestamp: serverTimestamp(),
        jobPosition: analysisData.job.position,
        locationRequirement: analysisData.job.locationRequirement,
        totalCandidates: candidates.length,
        gradesCount
      };

      await addDoc(collection(db, SYNCED_HISTORY_COLLECTION), historyEntry);

      // Cleanup old entries
      await this.cleanupOldHistoryEntries(user.uid);
    } catch (error) {
      console.error('Error syncing history to Firebase:', error);
    }
  }

  /**
   * Lấy lịch sử từ Firebase
   */
  static async getHistoryFromFirebase(limitCount: number = 20): Promise<AnalysisRunData[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, SYNCED_HISTORY_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const history: AnalysisRunData[] = [];

      querySnapshot.forEach((doc) => {
        const entry = doc.data() as SyncedHistoryEntry;
        history.push(entry.analysisData);
      });

      return history;
    } catch (error) {
      console.error('Error getting history from Firebase:', error);
      return [];
    }
  }

  /**
   * Migrate dữ liệu từ localStorage lên Firebase khi user đăng nhập
   */
  static async migrateLocalDataToFirebase(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    console.log('Starting data migration to Firebase...');

    try {
      // Migrate cache từ localStorage
      await this.migrateCacheFromLocalStorage();
      
      // Migrate history từ localStorage
      await this.migrateHistoryFromLocalStorage();
      
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error during data migration:', error);
    }
  }

  /**
   * Migrate cache từ localStorage
   */
  private static async migrateCacheFromLocalStorage(): Promise<void> {
    try {
      const localCache = localStorage.getItem('cvAnalysisCache');
      if (!localCache) return;

      const cacheData = JSON.parse(localCache);
      const migrationPromises: Promise<void>[] = [];

      for (const [key, entry] of Object.entries(cacheData)) {
        const cacheEntry = entry as any;
        
        migrationPromises.push(
          this.syncCacheToFirebase(
            key,
            cacheEntry.candidateData,
            cacheEntry.jdHash,
            cacheEntry.weightsHash,
            cacheEntry.filtersHash,
            {
              name: key.split('_')[0] || 'unknown',
              size: cacheEntry.fileSize || 0,
              lastModified: cacheEntry.fileLastModified || 0
            }
          )
        );
      }

      await Promise.all(migrationPromises);
      
      // Sau khi migrate thành công, xóa cache cũ
      localStorage.removeItem('cvAnalysisCache');
      console.log('Cache migration completed');
    } catch (error) {
      console.error('Error migrating cache from localStorage:', error);
    }
  }

  /**
   * Migrate history từ localStorage
   */
  private static async migrateHistoryFromLocalStorage(): Promise<void> {
    try {
      // Migrate từ nhiều sources
      const sources = [
        'cvAnalysis.latest',
        'cvFilterHistory',
        'analysisHistory'
      ];

      for (const source of sources) {
        const localData = localStorage.getItem(source);
        if (!localData) continue;

        if (source === 'cvAnalysis.latest') {
          // Migrate latest analysis
          const analysisData: AnalysisRunData = JSON.parse(localData);
          await this.syncHistoryToFirebase(analysisData);
        } else {
          // Migrate history arrays
          const historyArray = JSON.parse(localData);
          if (Array.isArray(historyArray)) {
            for (const entry of historyArray) {
              if (entry.candidates && entry.job) {
                await this.syncHistoryToFirebase(entry as AnalysisRunData);
              }
            }
          }
        }
      }

      // Xóa data cũ sau khi migrate
      sources.forEach(source => localStorage.removeItem(source));
      console.log('History migration completed');
    } catch (error) {
      console.error('Error migrating history from localStorage:', error);
    }
  }

  /**
   * Load dữ liệu từ Firebase về localStorage khi user đăng nhập
   */
  static async loadDataFromFirebase(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    console.log('Loading data from Firebase...');

    try {
      // Load cache
      const cacheMap = await this.getAllUserCacheFromFirebase();
      if (cacheMap.size > 0) {
        const cacheObject: Record<string, any> = {};
        cacheMap.forEach((value, key) => {
          cacheObject[key] = value;
        });
        localStorage.setItem('cvAnalysisCache', JSON.stringify(cacheObject));
      }

      // Load history
      const history = await this.getHistoryFromFirebase(50);
      if (history.length > 0) {
        // Lưu latest analysis
        localStorage.setItem('cvAnalysis.latest', JSON.stringify(history[0]));
        
        // Lưu history array
        localStorage.setItem('analysisHistory', JSON.stringify(history));
      }

      console.log('Data loaded from Firebase successfully');
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
    }
  }

  /**
   * Cleanup old cache entries
   */
  private static async cleanupOldCacheEntries(uid: string): Promise<void> {
    try {
      const q = query(
        collection(db, SYNCED_CACHE_COLLECTION),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;

      if (docs.length > MAX_CACHE_ENTRIES_PER_USER) {
        const docsToDelete = docs.slice(MAX_CACHE_ENTRIES_PER_USER);
        const batch = writeBatch(db);
        
        docsToDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up old cache entries:', error);
    }
  }

  /**
   * Cleanup old history entries
   */
  private static async cleanupOldHistoryEntries(uid: string): Promise<void> {
    try {
      const q = query(
        collection(db, SYNCED_HISTORY_COLLECTION),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;

      if (docs.length > MAX_HISTORY_ENTRIES_PER_USER) {
        const docsToDelete = docs.slice(MAX_HISTORY_ENTRIES_PER_USER);
        const batch = writeBatch(db);
        
        docsToDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up old history entries:', error);
    }
  }

  /**
   * Xóa tất cả dữ liệu synced của user
   */
  static async clearUserSyncedData(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Clear cache
      const cacheQuery = query(
        collection(db, SYNCED_CACHE_COLLECTION),
        where('uid', '==', user.uid)
      );
      const cacheSnapshot = await getDocs(cacheQuery);
      
      // Clear history
      const historyQuery = query(
        collection(db, SYNCED_HISTORY_COLLECTION),
        where('uid', '==', user.uid)
      );
      const historySnapshot = await getDocs(historyQuery);

      const batch = writeBatch(db);
      
      cacheSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      historySnapshot.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      console.log('User synced data cleared successfully');
    } catch (error) {
      console.error('Error clearing user synced data:', error);
    }
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats(): Promise<{
    cacheEntries: number;
    historyEntries: number;
    lastSyncTime: Date | null;
  }> {
    const user = auth.currentUser;
    if (!user) return { cacheEntries: 0, historyEntries: 0, lastSyncTime: null };

    try {
      // Count cache entries
      const cacheQuery = query(
        collection(db, SYNCED_CACHE_COLLECTION),
        where('uid', '==', user.uid)
      );
      const cacheSnapshot = await getDocs(cacheQuery);

      // Count history entries and get latest timestamp
      const historyQuery = query(
        collection(db, SYNCED_HISTORY_COLLECTION),
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const historySnapshot = await getDocs(historyQuery);

      let lastSyncTime: Date | null = null;
      if (!historySnapshot.empty) {
        const latestDoc = historySnapshot.docs[0];
        const timestamp = latestDoc.data().timestamp;
        lastSyncTime = timestamp?.toDate?.() || null;
      }

      return {
        cacheEntries: cacheSnapshot.size,
        historyEntries: historySnapshot.size,
        lastSyncTime
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return { cacheEntries: 0, historyEntries: 0, lastSyncTime: null };
    }
  }
}
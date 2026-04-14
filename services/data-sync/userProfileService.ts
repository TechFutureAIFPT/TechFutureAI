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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  avatar?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserCVHistory {
  id?: string;
  uid: string;
  email: string;
  jdText: string;
  jdTitle: string;
  cvCount: number;
  timestamp: any;
  results?: any[];
}

const USERS_COLLECTION = 'users';
const CV_HISTORY_COLLECTION = 'cvHistory';

export class UserProfileService {
  // Lưu hoặc cập nhật thông tin user profile
  static async saveUserProfile(uid: string, email: string, displayName?: string, avatar?: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Cập nhật thông tin user
        await updateDoc(userRef, {
          displayName: displayName || userDoc.data().displayName,
          avatar: avatar || userDoc.data().avatar,
          updatedAt: serverTimestamp()
        });
      } else {
        // Tạo user profile mới
        await setDoc(userRef, {
          uid,
          email,
          displayName: displayName || '',
          avatar: avatar || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  // Lấy thông tin user profile
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Cập nhật avatar của user
  static async updateUserAvatar(uid: string, avatar: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        avatar,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  // Lưu lịch sử CV filtering
  static async saveCVHistory(uid: string, email: string, historyData: Omit<UserCVHistory, 'uid' | 'email' | 'timestamp' | 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, CV_HISTORY_COLLECTION), {
        uid,
        email,
        ...historyData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving CV history:', error);
      throw error;
    }
  }

  // Lấy lịch sử CV filtering của user
  static async getUserCVHistory(uid: string, limitCount: number = 50): Promise<UserCVHistory[]> {
    try {
      const q = query(
        collection(db, CV_HISTORY_COLLECTION),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const history: UserCVHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        } as UserCVHistory);
      });
      
      return history;
    } catch (error) {
      console.error('Error getting user CV history:', error);
      return [];
    }
  }

  // Xóa lịch sử CV cũ (giữ lại n records gần nhất)
  static async cleanupOldHistory(uid: string, keepCount: number = 100): Promise<void> {
    try {
      const q = query(
        collection(db, CV_HISTORY_COLLECTION),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(1000) // Lấy nhiều hơn để có thể xóa
      );
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      
      if (docs.length > keepCount) {
        const docsToDelete = docs.slice(keepCount);
        const batch = [];
        
        for (const docToDelete of docsToDelete) {
          batch.push(deleteDoc(docToDelete.ref));
        }
        
        await Promise.all(batch);
      }
    } catch (error) {
      console.error('Error cleaning up old history:', error);
    }
  }

  // Migrate dữ liệu từ localStorage sang Firebase
  static async migrateLocalDataToFirebase(uid: string, email: string): Promise<void> {
    try {
      // Migrate avatar — thử cả hai key: key mới dùng email, key cũ fallback
      const localAvatarByEmail = email ? localStorage.getItem(`avatar_${email}`) : null;
      const localAvatarLegacy  = localStorage.getItem('userAvatar');
      const localAvatar = localAvatarByEmail || localAvatarLegacy;
      if (localAvatar) {
        await this.updateUserAvatar(uid, localAvatar);
        if (localAvatarLegacy) localStorage.removeItem('userAvatar');
        // Không xóa avatar_${email} khỏi localStorage — vẫn dùng làm cache offline
      }

      // Migrate lịch sử CV filtering
      const localHistory = localStorage.getItem('cvFilterHistory');
      if (localHistory) {
        const parsedHistory: any[] = JSON.parse(localHistory);
        
        for (const entry of parsedHistory) {
          await this.saveCVHistory(uid, email, {
            jdText: entry.jdText,
            jdTitle: entry.jdTitle || 'Vị trí tuyển dụng',
            cvCount: entry.cvCount,
            results: entry.results
          });
        }
        
        localStorage.removeItem('cvFilterHistory'); // Xóa sau khi migrate
      }
    } catch (error) {
      console.error('Error migrating local data to Firebase:', error);
    }
  }
}
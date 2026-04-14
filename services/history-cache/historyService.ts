import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, where, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfileService } from '../data-sync/userProfileService';
import type { Candidate, HistoryEntry } from '../../assets/types';

interface SaveHistoryParams {
  jdText: string;
  jobPosition: string;
  locationRequirement: string;
  candidates: Candidate[];
  userEmail: string;
  weights?: any;
  hardFilters?: any;
}

const COLLECTION = 'cvHistory';
// New manual save collection ID provided by user
const MANUAL_COLLECTION_ID = 'CLdl7JGuaOGIuijiDZeG';

export async function saveHistorySession({ jdText, jobPosition, locationRequirement, candidates, userEmail, weights, hardFilters }: SaveHistoryParams) {
  try {
    const total = candidates.length;
    const gradesCount = { A: 0, B: 0, C: 0 };
    candidates.forEach(c => {
      const g = c.status === 'FAILED' ? 'C' : (c.analysis?.['Hạng'] || 'C');
      if (g === 'A') gradesCount.A++; else if (g === 'B') gradesCount.B++; else gradesCount.C++;
    });
    const sorted = [...candidates].filter(c=>c.status==='SUCCESS').sort((a,b)=> (b.analysis?.['Tổng điểm']||0) - (a.analysis?.['Tổng điểm']||0));
    const top = sorted.slice(0,3).map(c => ({
      id: c.id,
      name: c.candidateName,
      score: c.analysis?.['Tổng điểm'] || 0,
      jdFit: parseInt(c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10),
      grade: c.analysis?.['Hạng'] || 'C'
    }));

    // Lưu vào Firebase collection chính và cũng đồng bộ với UserProfileService
    const docRef = await addDoc(collection(db, COLLECTION), {
      jobPosition,
      locationRequirement,
      jdTextSnippet: jdText.slice(0,300),
      totalCandidates: total,
      grades: gradesCount,
      topCandidates: top,
      userEmail,
      fullPayload: { jdText, jobPosition, weights, hardFilters, candidates },
      createdAt: serverTimestamp(),
      timestamp: Date.now()
    });

    // Đồng bộ với UserProfileService nếu user đã đăng nhập
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === userEmail) {
      try {
        await UserProfileService.saveCVHistory(currentUser.uid, userEmail, {
          jdText,
          jdTitle: jobPosition,
          cvCount: total,
          results: candidates
        });
      } catch (error) {
        console.warn('Failed to sync with UserProfileService:', error);
      }
    }

    return docRef.id;
  } catch (e) {
    console.error('Failed to save history session', e);
    throw e;
  }
}

export async function fetchRecentHistory(limitCount = 20, userEmail?: string): Promise<HistoryEntry[]> {
  try {
    // Nếu user đã đăng nhập Firebase, ưu tiên lấy từ UserProfileService
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === userEmail) {
      try {
        const userHistory = await UserProfileService.getUserCVHistory(currentUser.uid, limitCount);
        // Chuyển đổi format từ UserCVHistory sang HistoryEntry
        const convertedHistory: HistoryEntry[] = userHistory.map(h => ({
          id: h.id || '',
          timestamp: h.timestamp?.toMillis?.() || Date.now(),
          jobPosition: h.jdTitle,
          locationRequirement: '',
          jdTextSnippet: h.jdText.slice(0, 300),
          totalCandidates: h.cvCount,
          grades: { A: 0, B: 0, C: 0 }, // Có thể tính từ results nếu cần
          topCandidates: [],
          userEmail: h.email,
          fullPayload: { 
            jdText: h.jdText, 
            jobPosition: h.jdTitle, 
            weights: {},
            hardFilters: {},
            candidates: h.results || []
          }
        }));
        
        if (convertedHistory.length > 0) {
          return convertedHistory;
        }
      } catch (error) {
        console.warn('Failed to fetch from UserProfileService, falling back to legacy method:', error);
      }
    }

    // Fallback to legacy method
    const base = collection(db, COLLECTION);
    const q = userEmail
      ? query(base, where('userEmail', '==', userEmail), orderBy('timestamp','desc'), limit(limitCount))
      : query(base, orderBy('timestamp','desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as HistoryEntry[];
  } catch (e) {
    console.error('Failed to fetch recent history', e);
    return [];
  }
}

// Save a consolidated manual history snapshot into provided collection ID (single doc per user optional)
export async function saveManualHistorySnapshot(params: SaveHistoryParams) {
  const { jdText, jobPosition, locationRequirement, candidates, userEmail, weights, hardFilters } = params;
  try {
    const gradesCount = { A: 0, B: 0, C: 0 };
    const enriched = candidates.map(c => {
      const grade = c.status === 'FAILED' ? 'C' : (c.analysis?.['Hạng'] || 'C');
      if (grade === 'A') gradesCount.A++; else if (grade === 'B') gradesCount.B++; else gradesCount.C++;
      const jdFit = c.status === 'FAILED' ? 0 : parseInt(c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0', 10);
      return {
        id: c.id,
        name: c.candidateName,
        fileName: c.fileName,
        grade,
        totalScore: c.status === 'FAILED' ? 0 : (c.analysis?.['Tổng điểm'] || 0),
        jdFit,
      };
    });
    const snapshotDoc = {
      email: userEmail,
      'JD mẫu': jdText,
      'Vị trí Lọc JD': jobPosition,
      'Yêu cầu địa điểm': locationRequirement,
      'Thời gian lưu': new Date().toISOString(),
      'Danh sách CV': enriched,
      'Thống kê': gradesCount,
      weights, hardFilters,
      updatedAt: Date.now()
    };
    // Use a composite document key per user to allow multiple users; fallback to single fixed doc if no email
    const docId = userEmail ? `manual-${userEmail.replace(/[^a-zA-Z0-9_-]/g,'_')}` : 'manual-global';
    await setDoc(doc(db, MANUAL_COLLECTION_ID, docId), snapshotDoc, { merge: true });
    return docId;
  } catch (e) {
    console.error('Failed to save manual history snapshot', e);
    throw e;
  }
}

// Fetch manual snapshots for a user (or all if no email) and adapt to HistoryEntry shape (read-only)
export async function fetchManualHistory(userEmail?: string): Promise<HistoryEntry[]> {
  try {
    const base = collection(db, MANUAL_COLLECTION_ID);
    let qRef;
    if (userEmail) {
      qRef = query(base, where('email','==',userEmail));
    } else {
      qRef = base; // get all
    }
    const snap = await getDocs(qRef as any);
    return snap.docs.map(d => {
      const data: any = d.data();
      const cvList = Array.isArray(data['Danh sách CV']) ? data['Danh sách CV'] : [];
      const grades = data['Thống kê'] || { A:0,B:0,C:0 };
      return {
        id: d.id,
        timestamp: data.updatedAt || Date.now(),
        jobPosition: data['Vị trí Lọc JD'] || '',
        locationRequirement: data['Yêu cầu địa điểm'] || '',
        jdTextSnippet: (data['JD mẫu'] || '').slice(0,300),
        totalCandidates: cvList.length,
        grades,
        topCandidates: cvList.slice(0,3).map((c:any) => ({ id: c.id, name: c.name, score: c.totalScore, jdFit: c.jdFit })),
        userEmail: data.email || '',
        // Manual snapshots currently don't include fullPayload for restore
      } as HistoryEntry;
    });
  } catch (e) {
    console.error('Failed to fetch manual history', e);
    return [];
  }
}

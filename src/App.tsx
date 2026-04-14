import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { detectIndustryFromJD } from '../services/ai-ml/industryDetector';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import WebVitalsReporter from '../components/ui/charts-stats/WebVitalsReporter';
import BundleAnalyzer from '../components/ui/charts-stats/BundleAnalyzer';
import { ThemeProvider } from '../components/ui/theme/ThemeProvider';

import { UserProfileService } from '../services/data-sync/userProfileService';
import { onAuthChange } from '../services/auth/authService';
import type { AuthUser } from '../services/auth/authTypes';
import type { AppStep, Candidate, HardFilters, WeightCriteria, AnalysisRunData } from '../assets/types';
import { initialWeights } from '../assets/constants';
import Sidebar from '../components/layout/Sidebar';
import ProgressBar from '../components/ui/common/ProgressBar';
import JDTemplatesModal, { JDTemplate } from '../components/ui/history-cache/JDTemplatesModal';
import HistoryModal from '../components/ui/history-cache/HistoryModal';
import PageTransition from '../components/shared/PageTransition';
import MobileBottomNav from '../components/shared/responsive/mobile/MobileBottomNav';

// Lazy load pages for code-splitting
const ScreenerPage = lazy(() => import('../components/pages/main/ScreenerPage'));
const ProcessPage = lazy(() => import('../components/pages/main/ProcessPage'));
const HomePage = lazy(() => import('../components/pages/main/HomePage'));
const AchievementsContactPage = lazy(() => import('../components/pages/info/AchievementsContactPage'));
const DeploymentReadyPage = lazy(() => import('../components/pages/deployment/DeploymentReadyPage'));
const LoginPage = lazy(() => import('../components/pages/auth/LoginPage'));
const DetailedAnalyticsPage = lazy(() => import('../components/pages/analytics/DetailedAnalyticsPage'));
const PrivacyPolicyPage = lazy(() => import('../components/pages/info/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('../components/pages/info/TermsPage'));
const SelectedCandidatesPage = lazy(() => import('../components/pages/analytics/SelectedCandidatesPage'));
import CandidateSuggestions from '../components/pages/analytics/CandidateSuggestions';
// HistoryPage removed from UI (still saving to Firestore silently)
import { saveHistorySession } from '../services/history-cache/historyService';
import { cvFilterHistoryService } from '../services/history-cache/analysisHistory';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </ThemeProvider>
  );
};

const MainApp = () => {
  // Initialize state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [resetKey, setResetKey] = useState(Date.now());
  const [isInitializing, setIsInitializing] = useState(true);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleFullReset = () => {
    setResetKey(Date.now());
  };

  const handleLoginRequest = () => {
    setShowLoginModal(true);
  };

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          photoURL: user.photoURL,
          provider: user.providerData[0]?.providerId.includes('google') ? 'google' : 'email',
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
        };
        setCurrentUser(authUser);
        setIsLoggedIn(true);
        localStorage.setItem('authEmail', user.email || '');

        try {
          // Save/update user profile in Firestore
          await UserProfileService.saveUserProfile(
            user.uid,
            user.email!,
            user.displayName || undefined
          );

          // Migrate local data to Firebase if needed
          await UserProfileService.migrateLocalDataToFirebase(user.uid, user.email!);
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('authEmail');
      }

      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Fallback to localStorage for compatibility with existing code
  useEffect(() => {
    if (!isInitializing && !currentUser) {
      const syncLoginState = () => {
        try {
          const authEmail = localStorage.getItem('authEmail') || '';
          const wasLoggedIn = !!(authEmail && authEmail.length > 0);
          if (wasLoggedIn && !isLoggedIn) {
            setIsLoggedIn(wasLoggedIn);
          }
        } catch { }
      };

      syncLoginState();
      window.addEventListener('storage', syncLoginState);
      const interval = setInterval(syncLoginState, 5000);

      return () => {
        window.removeEventListener('storage', syncLoginState);
        clearInterval(interval);
      };
    }
  }, [isInitializing, currentUser, isLoggedIn]);

  return (
    <>
      <PageTransition />
      <MainLayout
        onResetRequest={handleFullReset}
        isLoggedIn={isLoggedIn}
        onLoginRequest={handleLoginRequest}
        currentUser={currentUser}
      />
      {showLoginModal && (
        <div className="fixed inset-0 z-50">
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors z-10"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <LoginPage onLogin={handleLogin} />
        </div>
      )}
    </>
  );
};


interface MainLayoutProps {
  onResetRequest: () => void;
  className?: string;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  currentUser: AuthUser | null;
}

const MainLayout = ({ onResetRequest, className, isLoggedIn, onLoginRequest, currentUser }: MainLayoutProps) => {
  const [userEmail, setUserEmail] = useState<string>(() => {
    // attempt to get from auth current user if available
    return (typeof window !== 'undefined' && (window as any).localStorage?.getItem('authEmail')) || '';
  });
  const [completedSteps, setCompletedSteps] = useState<AppStep[]>([]);
  const [jdTemplatesModalOpen, setJdTemplatesModalOpen] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Load avatar and user name for mobile navbar
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        if (currentUser.displayName) {
          setUserName(currentUser.displayName);
        } else if (currentUser.email) {
          setUserName(currentUser.email.split('@')[0]);
        }

        if (currentUser.photoURL) {
          setUserAvatar(currentUser.photoURL);
        } else {
          try {
            const profile = await UserProfileService.getUserProfile(currentUser.uid);
            if (profile?.avatar) {
              setUserAvatar(profile.avatar);
            } else if (currentUser.email) {
              setUserAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
            }
          } catch {
            if (currentUser.email) setUserAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
          }
        }
      } else if (userEmail) {
        setUserName(userEmail.split('@')[0]);
        setUserAvatar(localStorage.getItem(`avatar_${userEmail}`));
      }
    };
    loadUserData();
  }, [currentUser, userEmail]);
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('authEmail');
      localStorage.removeItem('googleDriveToken');
      // Navigate to home before potentially reloading or just let auth state handle it
      navigate('/');
      // Instead of reload, we can let onAuthStateChanged handle the UI update
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback
      localStorage.removeItem('authEmail');
      localStorage.removeItem('googleDriveToken');
      window.location.href = '/';
    }
  }, [navigate]);
  const [jdText, setJdText] = useState<string>('');
  const [jobPosition, setJobPosition] = useState<string>('');
  const [weights, setWeights] = useState<WeightCriteria>(initialWeights);
  const [hardFilters, setHardFilters] = useState<HardFilters>({
    location: '',
    minExp: '',
    seniority: '',
    education: '',
    industry: '',
    language: '',
    languageLevel: '',
    certificates: '',
    salaryMin: '',
    salaryMax: '',
    workFormat: '',
    contractType: '',
    locationMandatory: true,
    minExpMandatory: true,
    seniorityMandatory: true,
    educationMandatory: false,
    contactMandatory: false,
    industryMandatory: true,
    languageMandatory: false,
    certificatesMandatory: false,
    salaryMandatory: false,
    workFormatMandatory: false,
    contractTypeMandatory: false,
  });
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');


  // Đồng bộ lại email nếu ban đầu rỗng hoặc thay đổi ở tab khác
  useEffect(() => {
    const syncEmail = () => {
      try {
        const stored = localStorage.getItem('authEmail') || '';
        setUserEmail(prev => (prev && prev.length > 0) ? prev : stored);
      } catch { }
    };
    syncEmail();
    window.addEventListener('storage', syncEmail);
    const interval = setInterval(syncEmail, 5000); // phòng trường hợp storage event không bắn
    return () => {
      window.removeEventListener('storage', syncEmail);
      clearInterval(interval);
    };
  }, []);




  const handleRestore = useCallback((payload: any) => {
    if (!payload) return;
    try {
      setJdText(payload.jdText || '');
      setJobPosition(payload.jobPosition || '');
      if (payload.weights) setWeights(payload.weights);
      if (payload.hardFilters) setHardFilters(payload.hardFilters);
      if (payload.candidates) setAnalysisResults(payload.candidates);
      setCompletedSteps(['jd', 'weights', 'upload', 'analysis']);
      navigate('/analysis');
    } catch (e) {
      console.warn('Restore failed', e);
    }
  }, [navigate]);


  const prevIsLoading = usePrevious(isLoading);

  // Auto-detect industry from JD whenever jdText changes significantly (throttle by length change)
  useEffect(() => {
    if (!jdText || jdText.length < 80) return; // avoid too-early detection
    setHardFilters(prev => {
      // If user already typed a custom industry different from last detected one, don't overwrite
      if (prev.industry && prev.industryManual) return prev; // industryManual is now in interface
      const detected = detectIndustryFromJD(jdText);
      if (detected && detected !== prev.industry) {
        return { ...prev, industry: detected };
      }
      return prev;
    });
  }, [jdText]);

  // Mark manual edits to industry (listener could be added where HardFilterPanel handles changes)
  // Quick patch: wrap original setHardFilters to flag manual change when id==='industry'
  const originalSetHardFilters = setHardFilters;
  const setHardFiltersWithFlag: typeof setHardFilters = (update) => {
    if (typeof update === 'function') {
      originalSetHardFilters(prev => {
        const next = (update as any)(prev);
        if (next.industry !== prev.industry && next._lastIndustryAuto !== true) {
          (next as any).industryManual = true;
        }
        return next;
      });
    } else {
      if (update.industry !== (hardFilters as any).industry) (update as any).industryManual = true;
      originalSetHardFilters(update);
    }
  };

  useEffect(() => {
    if (prevIsLoading && !isLoading && analysisResults.length > 0) {
      const successfulCandidates = analysisResults.filter(c => c.status === 'SUCCESS');
      if (successfulCandidates.length > 0) {
        // Add unique IDs to candidates before saving
        const candidatesWithIds = successfulCandidates.map(c => ({
          ...c,
          id: c.id || `${c.fileName}-${c.candidateName}-${Math.random()}`
        }));

        const analysisRun: AnalysisRunData = {
          timestamp: Date.now(),
          job: {
            position: jobPosition,
            locationRequirement: hardFilters.location || 'Không có',
          },
          candidates: candidatesWithIds,
        };
        localStorage.setItem('cvAnalysis.latest', JSON.stringify(analysisRun));

        // Save to CV filter history (always enabled)
        try {
          cvFilterHistoryService.addFilterSession(
            jobPosition || 'Không rõ vị trí'
          );
        } catch (error) {
          console.warn('Failed to save filter history:', error);
        }

        // Firestore persistence (best-effort)
        saveHistorySession({
          jdText,
          jobPosition,
          locationRequirement: hardFilters.location || 'Không có',
          candidates: candidatesWithIds,
          userEmail: userEmail || 'anonymous',
          weights,
          hardFilters,
        }).catch(err => console.warn('Save history failed', err));
      }
    }
  }, [isLoading, prevIsLoading, analysisResults, jobPosition, hardFilters.location, jdText, userEmail, weights, hardFilters]);

  const activeStep = useMemo((): AppStep => {
    switch (location.pathname) {
      case '/process': return 'process';
      case '/jd': return 'jd';
      case '/weights': return 'weights';
      case '/upload': return 'upload';
      case '/analysis': return 'analysis';
      case '/dashboard': return 'dashboard';
      case '/detailed-analytics': return 'dashboard'; // Show dashboard as active for detailed analytics page
      case '/chatbot': return 'chatbot';
      case '/selected': return 'selected';
      case '/':
      default:
        return 'home';
    }
  }, [location.pathname]);

  const handleNewSession = useCallback(() => {
    setJdText('');
    setJobPosition('');
    setWeights(initialWeights);
    setHardFilters({
      location: '',
      minExp: '',
      seniority: '',
      education: '',
      industry: '',
      language: '',
      languageLevel: '',
      certificates: '',
      salaryMin: '',
      salaryMax: '',
      workFormat: '',
      contractType: '',
      locationMandatory: true,
      minExpMandatory: true,
      seniorityMandatory: true,
      educationMandatory: false,
      contactMandatory: false,
      industryMandatory: true,
      languageMandatory: false,
      certificatesMandatory: false,
      salaryMandatory: false,
      workFormatMandatory: false,
      contractTypeMandatory: false,
    });
    setCvFiles([]);
    setAnalysisResults([]);
    setCompletedSteps([]);
    navigate('/jd');
  }, [navigate]);

  const setActiveStep = useCallback((step: AppStep) => {
    const pathMap: Partial<Record<AppStep, string>> = {
      home: '/',
      jd: '/jd',
      weights: '/weights',
      upload: '/upload',
      analysis: '/analysis',
      dashboard: '/detailed-analytics',
      chatbot: '/chatbot',
      selected: '/selected',
      process: '/process'
    };
    if (pathMap[step]) navigate(pathMap[step]!);
  }, [navigate]);

  const markStepAsCompleted = useCallback((step: AppStep) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
  }, []);

  const isHomeView = activeStep === 'home';

  useEffect(() => {
    const path = location.pathname;
    const requiresJD = ['/weights', '/upload', '/analysis'];
    if (requiresJD.includes(path) && !completedSteps.includes('jd')) {
      navigate('/jd', { replace: true });
      return;
    }
    if (path === '/upload' && !completedSteps.includes('weights')) {
      navigate('/jd', { replace: true });
      return;
    }
    if (path === '/analysis' && (!completedSteps.includes('weights') || !completedSteps.includes('upload'))) {
      navigate('/jd', { replace: true });
    }
  }, [location.pathname, completedSteps, navigate]);



  const screenerPageProps = {
    jdText, setJdText,
    jobPosition, setJobPosition,
    weights, setWeights,
    hardFilters, setHardFilters,
    cvFiles, setCvFiles,
    analysisResults, setAnalysisResults,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
    activeStep, setActiveStep,
    completedSteps, markStepAsCompleted,
  };

  return (
    <div className={`min-h-screen text-slate-900 flex flex-col overflow-x-hidden ${className || ''}`}>
      {!isHomeView && (
        <div className="hidden md:block">
          <Sidebar
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            completedSteps={completedSteps}
            onReset={onResetRequest}
            onLogout={handleLogout}
            userEmail={userEmail}
            userAvatar={userAvatar}
            userName={userName}
            onLoginRequest={onLoginRequest}
            isOpen={true}
            onShowSettings={() => setJdTemplatesModalOpen(true)}
            onShowHistory={() => setHistoryModalOpen(true)}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      {/* Mobile Fixed Header — full width, NOT offset by sidebar */}
      {!isHomeView && (
        <header
          className="md:hidden fixed top-0 left-0 right-0 h-14 z-[45] flex items-center justify-between px-4 min-w-0"
          style={{ background: '#0B1120', borderBottom: '1px solid #1e293b' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img src="/images/logos/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain shrink-0" />
            <span className="font-black text-sm truncate" style={{ color: '#e2e8f0' }}>SupportHR</span>
          </div>
          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <img
                src={userAvatar || '/images/logos/logo.jpg'}
                alt=""
                className="h-9 w-9 rounded-full object-cover border border-slate-600/80"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginRequest}
              className="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1.5 text-[11px] font-bold text-slate-200"
            >
              Đăng nhập
            </button>
          )}
        </header>
      )}

      <main
        className={`main-content ${!isHomeView ? 'pb-20 md:pb-0' : 'pb-0'} ${!isHomeView ? 'mt-14 md:mt-0' : ''} flex-1 flex flex-col min-h-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
          !isHomeView
            ? 'md:ml-[248px] md:w-[calc(100vw-248px)] min-w-0'
            : 'ml-0 w-full'
        }`}
      >
        {activeStep !== 'home' && activeStep !== 'jd' && activeStep !== 'weights' && activeStep !== 'upload' && activeStep !== 'analysis' && activeStep !== 'dashboard' && (
          <div className="pt-4">
            <ProgressBar activeStep={activeStep} completedSteps={completedSteps} />
          </div>
        )}
        <div className={`flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden ${(activeStep === 'home' || activeStep === 'jd' || activeStep === 'weights' || activeStep === 'upload' || activeStep === 'analysis' || activeStep === 'dashboard' || activeStep === 'chatbot' || activeStep === 'selected') ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto py-2'} ${(activeStep === 'home' || activeStep === 'jd' || activeStep === 'weights' || activeStep === 'upload' || activeStep === 'analysis' || activeStep === 'dashboard' || activeStep === 'chatbot' || activeStep === 'selected') ? '' : 'py-2'}`}>
          <Suspense fallback={<div className="flex flex-col justify-center items-center h-64 gap-3"><div className="relative w-10 h-10"><div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-400 border-r-cyan-400/40 animate-spin" style={{ animationDuration: '0.8s' }} /><div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-b-indigo-400 border-l-indigo-400/40 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} /></div></div>}>
            <Routes>
              <Route path="/" element={<HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/jd" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/weights" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/upload" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/analysis" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />

              <Route path="/detailed-analytics" element={isLoggedIn ? <DetailedAnalyticsPage candidates={analysisResults} jobPosition={jobPosition} onReset={onResetRequest} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/chatbot" element={isLoggedIn ? <CandidateSuggestions candidates={analysisResults} jobPosition={jobPosition} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/selected" element={isLoggedIn ? <SelectedCandidatesPage candidates={analysisResults} jobPosition={jobPosition} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/contact-ready" element={<DeploymentReadyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation (phone-like) */}
      {activeStep === 'jd' ||
        activeStep === 'weights' ||
        activeStep === 'upload' ||
        activeStep === 'analysis' ? (
        <MobileBottomNav
          activeStep={activeStep}
          completedSteps={completedSteps}
          onNavigate={setActiveStep}
        />
      ) : null}

      {/* JD Templates Modal */}
      <JDTemplatesModal
        isOpen={jdTemplatesModalOpen}
        onClose={() => setJdTemplatesModalOpen(false)}
        onSelectTemplate={(template: JDTemplate) => {
          setJdText(template.jdText);
          setJobPosition(template.jobPosition);
          setHardFilters({
            ...hardFilters,
            ...template.hardFilters
          });
          markStepAsCompleted('jd');
          markStepAsCompleted('weights');
          setActiveStep('upload');
        }}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      {/* Vercel Analytics & Speed Insights for performance monitoring */}
      <Analytics />
      <SpeedInsights />
      <WebVitalsReporter />
      {/* <BundleAnalyzer /> */}
    </div>
  );
};

export default App;

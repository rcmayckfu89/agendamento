import React from 'react';
import { Routes, Route, Navigate, useLocation, HashRouter } from 'react-router-dom';
import { Sidebar, MobileHeader } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { Patients } from './pages/Patients';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { Medications } from './pages/Medications';
import { AdminAccessControl } from './pages/AdminAccessControl';
import { BlockedAccess } from './pages/BlockedAccess';
import { MonthlyPaymentNotice } from './components/features/MonthlyPaymentNotice';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemLockProvider, useSystemLock } from './context/SystemLockContext';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { ToastProvider } from './context/ToastContext';
import { SplashScreen } from './components/ui/SplashScreen';
import { isAdminEmail } from './constants/admin';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user, loading } = useAuth();
  const { isBlocked, loading: lockLoading } = useSystemLock();
  const { isSidebarCollapsed, isMobile } = useLayout();
  const location = useLocation();
  const forceBlockedPreview =
    new URLSearchParams(window.location.search).get('previewBlocked') === '1'
    || new URLSearchParams(location.search).get('previewBlocked') === '1';

  if (loading || lockLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (forceBlockedPreview || (isBlocked && !isAdminEmail(user?.email))) {
    return <BlockedAccess />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Header with hamburger */}
      <MobileHeader />

      {/* Sidebar (handles mobile/desktop internally) */}
      <Sidebar />

      {/* Main content area */}
      <main
        className={`flex-1 overflow-auto relative z-0 transition-all duration-300
          ${isMobile
            ? 'pt-14 p-4' // Mobile: padding-top for header, smaller padding
            : `p-8 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}` // Desktop: sidebar margin
          }`}
      >
        <div className={`${isMobile ? '' : 'max-w-7xl'} mx-auto h-full animate-fade-in`}>
          <MonthlyPaymentNotice />
          {children}
        </div>
      </main>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/agenda" element={
        <ProtectedRoute>
          <Agenda />
        </ProtectedRoute>
      } />

      <Route path="/patients" element={
        <ProtectedRoute>
          <Patients />
        </ProtectedRoute>
      } />

      <Route path="/medications" element={
        <ProtectedRoute>
          <Medications />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/admin/access" element={
        <ProtectedRoute>
          <AdminAccessControl />
        </ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

// Splash Controller Component handle logic for both Initial Load and Logout
const SplashController = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  const [fadeSplash, setFadeSplash] = React.useState(false);
  const [lastSessionStr, setLastSessionStr] = React.useState<string | null>('initial');
  // We use string comparison for session simplicity or just ref check

  const triggerSplashSequence = () => {
    setShowSplash(true);
    setFadeSplash(false);

    // Sequence
    setTimeout(() => {
      setFadeSplash(true);
    }, 2000); // Start fade after 2s

    setTimeout(() => {
      setShowSplash(false);
    }, 2800); // Remove after fade complete
  };

  // Initial Load
  React.useEffect(() => {
    triggerSplashSequence();
  }, []);

  // Watch for Logout
  React.useEffect(() => {
    // Check if we effectively logged out (had session, now don't)
    // We skip the very first mount check by using 'initial' state or just logical checks
    if (lastSessionStr !== 'initial') {
      const hadSession = lastSessionStr !== null;
      const hasSession = !!session;

      if (hadSession && !hasSession) {
        console.log('Logout detected - Triggering Splash');
        triggerSplashSequence();
      }
    }

    // Update tracker
    setLastSessionStr(session ? 'active' : null);
  }, [session]);

  return (
    <>
      {showSplash && <SplashScreen isFadingOut={fadeSplash} />}
      {children}
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <SystemLockProvider>
            <AppProvider>
              <LayoutProvider>
                <SplashController>
                  <AppContent />
                </SplashController>
              </LayoutProvider>
            </AppProvider>
          </SystemLockProvider>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;

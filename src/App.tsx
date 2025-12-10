
import React from 'react';
import { Routes, Route, Navigate, useLocation, HashRouter } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { Patients } from './pages/Patients';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { Medications } from './pages/Medications';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutProvider, useLayout } from './context/LayoutContext';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const { isSidebarCollapsed } = useLayout();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 overflow-auto p-8 relative z-0 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
      >
        <div className="max-w-7xl mx-auto h-full animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
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

      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <LayoutProvider>
            <AppContent />
          </LayoutProvider>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;

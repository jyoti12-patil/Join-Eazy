import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

// Student Features
import { StudentDashboard } from './features/student/StudentDashboard';
import { GroupManager } from './features/student/GroupManager';
import { AssignmentList } from './features/student/AssignmentList';
import { GroupProgressTracker } from './features/student/GroupProgressTracker';

// Professor Features
import { ProfessorDashboard } from './features/professor/ProfessorDashboard';
import { AssignmentManager } from './features/professor/AssignmentManager';
import { SubmissionTracker } from './features/professor/SubmissionTracker';
import { GroupOverview } from './features/professor/GroupOverview';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective home if wrong role
    return <Navigate to={user.role === 'ADMIN' ? '/professor' : '/student'} replace />;
  }

  return children;
};

export const App = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('joineazy_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleDesktopCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('joineazy_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {user && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={toggleDesktopCollapse}
          mobileOpen={mobileSidebarOpen}
          closeMobile={closeMobileSidebar}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {user && (
          <Navbar toggleMobileSidebar={toggleMobileSidebar} />
        )}

        <main className="flex-1">
          <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={user ? <Navigate to={user.role === 'ADMIN' ? '/professor' : '/student'} replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to={user.role === 'ADMIN' ? '/professor' : '/student'} replace /> : <RegisterPage />}
          />

          {/* Student Protected Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/groups"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <GroupManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <AssignmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/progress"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <GroupProgressTracker />
              </ProtectedRoute>
            }
          />

          {/* Professor / Admin Protected Routes */}
          <Route
            path="/professor"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProfessorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/assignments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AssignmentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/submissions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SubmissionTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/groups"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <GroupOverview />
              </ProtectedRoute>
            }
          />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.role === 'ADMIN' ? '/professor' : '/student'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">404</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">The page you requested does not exist.</p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
                >
                  Go Back
                </button>
              </div>
            }
          />
        </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import DirectorDashboard from './components/DirectorDashboard';
import EngineerDashboard from './components/EngineerDashboard';
import EngineersView from './components/EngineersView';
import EngineersManagement from './components/EngineersManagement';
import ServicesManagement from './components/ServicesManagement';
import InviteResetPassword from './components/InviteResetPassword';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/invite/:token" element={<InviteResetPassword />} />
      <Route path="/" element={isAuthenticated ? <Navigate to={user?.role === 'engineer' ? '/my-tasks' : user?.role === 'director' ? '/dashboard' : '/dashboard'} replace /> : <LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'engineer' ? (
              <Navigate to="/my-tasks" replace />
            ) : user?.role === 'director' ? (
              <DirectorDashboard />
            ) : (
              <Dashboard />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            {user?.role === 'engineer' ? <EngineerDashboard /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/engineers"
        element={
          <ProtectedRoute>
            {user?.role === 'engineer' ? <EngineersView /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/engineers-management"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' || user?.role === 'director' ? <EngineersManagement /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/services-management"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' || user?.role === 'director' ? <ServicesManagement /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;



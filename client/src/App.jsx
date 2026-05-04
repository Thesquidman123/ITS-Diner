import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import AuthPage from './components/AuthPage';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './pages/HomePage';
import OwnerPage from './pages/OwnerPage';
import VanPage from './pages/VanPage';
import CreditPage from './pages/CreditPage';
import AccountPage from './pages/AccountPage';
import RoutePage from './pages/RoutePage';
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';
import { useAuth } from './state/AuthContext';

function roleHomePath(user) {
  if (!user) return '/customer';
  if (user.role === 'owner') return '/owner';
  if (user.role === 'driver' || user.role === 'staff') return '/van';
  return '/customer';
}

function RoleGate({ user, allowedRoles, fallbackPath = '/customer', children }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }
  return children;
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitles = {
    '/': 'Order from the van',
    '/customer': 'Order',
    '/van': 'Van operations',
    '/owner': 'Business dashboard',
    '/credit': 'My tab',
    '/dashboard': 'Operations dashboard',
    '/route': 'Route live mode',
    '/account': 'Account',
    '/auth': 'Sign in'
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (location.pathname === '/' || location.pathname === '/privacy') {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    );
  }

  return (
    <AppShell
      title={pageTitles[location.pathname] || 'ITS Diner'}
      user={user}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    >
      <Routes>
        <Route path="/customer" element={<HomePage user={user} onRequireAuth={() => navigate('/auth')} />} />
        <Route path="/auth" element={user ? <Navigate to={roleHomePath(user)} replace /> : <AuthPage />} />
        <Route path="/dashboard" element={<Navigate to={roleHomePath(user)} replace />} />
        <Route
          path="/van"
          element={(
            <RoleGate user={user} allowedRoles={['driver', 'staff']} fallbackPath={roleHomePath(user)}>
              <VanPage user={user} />
            </RoleGate>
          )}
        />
        <Route
          path="/owner"
          element={(
            <RoleGate user={user} allowedRoles={['owner']} fallbackPath={roleHomePath(user)}>
              <OwnerPage user={user} />
            </RoleGate>
          )}
        />
        <Route path="/credit" element={<CreditPage user={user} />} />
        <Route path="/account" element={<AccountPage user={user} />} />
        <Route path="/route" element={<RoutePage user={user} />} />
      </Routes>
    </AppShell>
  );
}

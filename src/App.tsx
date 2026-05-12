import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Briefcase, Users, Calendar, LogOut } from 'lucide-react';
import { CRMProvider, useCRM } from './context';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Pipeline from './pages/Pipeline';
import Contacts from './pages/Contacts';
import Agenda from './pages/Agenda';
import OpportuniteDetail from './pages/OpportuniteDetail';
import ContactDetail from './pages/ContactDetail';
import Login from './pages/Login';
import Toast from './components/Toast';
import DataMigration from './components/DataMigration';
import Spinner from './components/Spinner';

function CRMShell() {
  const { user, signOut } = useAuth();
  const { loading, error } = useCRM();

  if (loading) return <Spinner fullPage message="Chargement des données…" />;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>ALTAE</h1>
          <span className="sidebar-logo-bar" />
          <p>CRM Consulting</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Briefcase size={18} />
            <span>Pipeline</span>
          </NavLink>
          <NavLink to="/contacts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Users size={18} />
            <span>Contacts</span>
          </NavLink>
          <NavLink to="/agenda" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Calendar size={18} />
            <span>Agenda</span>
          </NavLink>
        </nav>
        <div className="sidebar-user" title={user?.email ?? ''}>{user?.email}</div>
        <div className="sidebar-logout">
          <button
            className="nav-item"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={signOut}
            title="Se déconnecter"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {error && <div className="error-banner" style={{ margin: '16px 28px 0' }}>{error}</div>}
        <Routes>
          <Route path="/" element={<Pipeline />} />
          <Route path="/opportunites/:id" element={<OpportuniteDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/agenda" element={<Agenda />} />
        </Routes>
      </main>
      <Toast />
      <DataMigration />
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--navy)' }}>
        <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }} />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <CRMProvider>
      <CRMShell />
    </CRMProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

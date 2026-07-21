import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import OrganizationsPage from './pages/OrganizationsPage';
import './App.css';

function AppShell() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contactos" element={<ContactsPage />} />
          <Route path="/monitor" element={<LiveMonitorPage />} />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute requireRole="admin">
                <OrganizationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

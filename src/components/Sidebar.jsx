import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrgFilter } from '../context/OrgFilterContext';
import { listOrganizations } from '../api/organizations';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/contactos', label: 'Campañas y contactos' },
  { to: '/monitor', label: 'Live Monitor' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { organizationId, setOrganizationId } = useOrgFilter();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      listOrganizations().then((data) => setOrganizations(data.organizations));
    }
  }, [user]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Voxia</div>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          {link.label}
        </NavLink>
      ))}
      {user?.role === 'admin' && (
        <NavLink to="/clientes" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          Clientes
        </NavLink>
      )}

      {user?.role === 'admin' && (
        <div className="sidebar-org-filter">
          <label htmlFor="org-filter">Viendo</label>
          <select id="org-filter" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
            <option value="">Todos los clientes</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.fullName || user?.email}</div>
          <div className="sidebar-user-org">{user?.organizationName || 'Admin'}</div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>Salir</button>
      </div>
    </aside>
  );
}

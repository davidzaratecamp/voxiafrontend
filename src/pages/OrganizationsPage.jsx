import { useEffect, useState } from 'react';
import {
  listOrganizations,
  createOrganization,
  listOrganizationUsers,
  createOrganizationUser,
  resetOrganizationUserPassword,
} from '../api/organizations';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

function CreateOrganizationForm({ enabledProviders, onCreated }) {
  const [name, setName] = useState('');
  const [telephonyProvider, setTelephonyProvider] = useState(enabledProviders[0] || 'twilio_realtime');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreated({ name, telephonyProvider });
      setName('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Nuevo cliente</h2>
      {error && <div className="banner error">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="org-name">Nombre del cliente</label>
          <input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="org-provider">Proveedor de telefonía</label>
          <select id="org-provider" value={telephonyProvider} onChange={(e) => setTelephonyProvider(e.target.value)}>
            {enabledProviders.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="stat-sub" style={{ margin: 0 }}>
        Este proveedor queda fijo para todas las campañas del cliente — no lo elige él.
      </p>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

function OrganizationUsers({ organization, onCredentials }) {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const data = await listOrganizationUsers(organization.id);
    setUsers(data);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.id]);

  async function handleCreateUser(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createOrganizationUser(organization.id, { email, fullName });
      onCredentials({ email: created.email, tempPassword: created.tempPassword });
      setEmail('');
      setFullName('');
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(userId) {
    const result = await resetOrganizationUserPassword(organization.id, userId);
    onCredentials({ email: result.email, tempPassword: result.tempPassword });
  }

  const webhookUrl = `${API_BASE}/webhooks/openai/incoming?organizationId=${organization.id}`;

  return (
    <div className="panel">
      <h2>{organization.name} — usuarios y acceso</h2>

      {organization.telephony_provider === 'openai_native_sip' && (
        <div className="banner success" style={{ wordBreak: 'break-all' }}>
          URL del webhook para el troncal SIP de este cliente (configúrala en OpenAI):
          <br />
          <code>{webhookUrl}</code>
          <br />
          Header requerido: <code>X-Voxia-Sip-Secret</code> (valor = <code>OPENAI_SIP_WEBHOOK_SECRET</code> del backend)
        </div>
      )}

      {error && <div className="banner error">{error}</div>}

      {users.length === 0 ? (
        <p className="empty-state">Este cliente todavía no tiene usuarios.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.full_name || '—'}</td>
                <td>{u.role}</td>
                <td>
                  <button className="btn secondary" onClick={() => handleReset(u.id)}>
                    Reset password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="form-grid" onSubmit={handleCreateUser} style={{ marginTop: 16 }}>
        <div className="form-field">
          <label htmlFor="user-email">Email del nuevo usuario</label>
          <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="user-fullname">Nombre</label>
          <input id="user-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="form-field full btn-row">
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [enabledProviders, setEnabledProviders] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [credentials, setCredentials] = useState(null);

  async function refresh(selectId) {
    const data = await listOrganizations();
    setOrganizations(data.organizations);
    setEnabledProviders(data.enabledProviders);
    if (selectId) setSelectedOrgId(String(selectId));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreateOrganization(payload) {
    const org = await createOrganization(payload);
    await refresh(org.id);
  }

  const selectedOrg = organizations.find((o) => String(o.id) === String(selectedOrgId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Da de alta un cliente nuevo, asígnale su proveedor de telefonía y entrégale sus credenciales de acceso.</p>
        </div>
      </div>

      {credentials && (
        <div className="banner success">
          Credenciales generadas para <strong>{credentials.email}</strong> — cópialas ahora, no se van a volver a mostrar:
          <br />
          Contraseña: <code>{credentials.tempPassword}</code>
        </div>
      )}

      <CreateOrganizationForm enabledProviders={enabledProviders} onCreated={handleCreateOrganization} />

      <div className="panel">
        <h2>Clientes existentes</h2>
        {organizations.length === 0 ? (
          <p className="empty-state">Todavía no has dado de alta ningún cliente.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Proveedor</th>
                <th>Campañas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.telephony_provider}</td>
                  <td>{o.total_campaigns}</td>
                  <td>
                    <button className="btn secondary" onClick={() => setSelectedOrgId(String(o.id))}>
                      Gestionar usuarios
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrg && <OrganizationUsers organization={selectedOrg} onCredentials={setCredentials} />}
    </div>
  );
}

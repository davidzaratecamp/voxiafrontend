import { useEffect, useState } from 'react';
import { listCampaigns, createCampaign, updateCampaign, deleteCampaign, launchCampaign } from '../api/campaigns';
import { listContacts, bulkUploadContacts, callContactNow } from '../api/contacts';
import { listOrganizations } from '../api/organizations';
import { useAuth } from '../context/AuthContext';
import { useOrgFilter } from '../context/OrgFilterContext';
import { usePolling } from '../hooks/usePolling';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import StatusBadge from '../components/StatusBadge';

const CAMPAIGN_TYPES = ['cobranza', 'ventas', 'encuesta', 'recordatorio', 'otro'];
const CONTACT_STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'calling', label: 'Llamando' },
  { value: 'in_progress', label: 'En conversación' },
  { value: 'completed', label: 'Completada' },
  { value: 'voicemail', label: 'Buzón de voz' },
  { value: 'failed', label: 'Falló' },
  { value: 'no_answer', label: 'No contestó' },
];
// alloy/ash/echo/shimmer/verse/ballad/coral/sage son las voces clasicas;
// marin/cedar son las nuevas de gpt-realtime-2, mas naturales/expresivas.
const VOICES = ['cedar', 'marin', 'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
// Cada acento fija tambien el idioma base (moneda, "siempre habla en X") --
// ver ACCENT_STYLE_BY_CODE en promptBuilder.js. Agregar un acento nuevo
// requiere agregarlo aqui Y alla.
const ACCENTS = [
  { value: 'es_CO', label: 'Español (Colombia)', language: 'es' },
  { value: 'es_PR', label: 'Español (Puerto Rico)', language: 'es' },
  { value: 'en_US', label: 'English (US)', language: 'en' },
];

function languageForAccent(accent) {
  return ACCENTS.find((a) => a.value === accent)?.language || 'es';
}

const CONTACTS_JSON_PLACEHOLDER = `[
  { "phone_number": "+573001112233", "full_name": "Anderson Zarate", "balance_due": 50000 }
]`;

// El proveedor de telefonia ya no se elige aqui: es fijo por organizacion
// (se asigna una sola vez al dar de alta al cliente en /clientes) y toda
// campana lo hereda automaticamente.
function CreateCampaignForm({ isAdmin, defaultOrganizationId, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    type: 'cobranza',
    voice: 'cedar',
    accent: 'es_CO',
    speed: 1,
    systemPromptTemplate:
      'Eres un agente de cobranza de Voxia. Hablas con {{full_name}} al numero {{phone_number}}. ' +
      'Le recuerdas amablemente que tiene un saldo pendiente de {{balance_due}} y le preguntas cuando puede pagar.',
  });
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId || '');
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  // Voz/acento/velocidad/guion solo aplican a campanas de OpenAI -- un
  // cliente de ElevenLabs (proveedor de prueba) tiene su agente ya
  // configurado en el dashboard de ElevenLabs (agent_id), Voxia no le manda
  // nada de eso. Se detecta el proveedor del cliente destino (el elegido
  // por el admin, o el propio si es un usuario "client") para ocultar esos
  // campos y evitar la confusion de "elegi ElevenLabs pero me siguen
  // saliendo voces de OpenAI".
  const targetProvider = isAdmin
    ? organizations.find((o) => String(o.id) === String(organizationId))?.telephony_provider
    : user?.telephonyProvider;
  const isElevenLabs = targetProvider === 'elevenlabs_twilio';

  useEffect(() => {
    if (isAdmin) {
      listOrganizations().then((data) => setOrganizations(data.organizations));
    }
  }, [isAdmin]);

  useEffect(() => {
    setOrganizationId(defaultOrganizationId || '');
  }, [defaultOrganizationId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (isAdmin && !organizationId) {
      setError('Selecciona para qué cliente es esta campaña.');
      return;
    }

    setSubmitting(true);
    try {
      const base = { ...form, language: languageForAccent(form.accent) };
      const payload = isAdmin ? { ...base, organizationId } : base;
      const campaign = await createCampaign(payload);
      onCreated(campaign);
      setForm((f) => ({ ...f, name: '' }));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Nueva campaña</h2>
      {error && <div className="banner error">{error}</div>}
      <div className="form-grid">
        {isAdmin && (
          <div className="form-field">
            <label htmlFor="org">Cliente</label>
            <select id="org" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
              <option value="">Selecciona un cliente</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.telephony_provider})</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-field">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Cobranzas Julio"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="type">Tipo</label>
          <select id="type" value={form.type} onChange={(e) => update('type', e.target.value)}>
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {isElevenLabs ? (
          <div className="form-field full">
            <div className="banner" style={{ margin: 0 }}>
              Este cliente usa ElevenLabs (proveedor de prueba): la voz, personalidad y guion del agente se
              configuran en el dashboard de ElevenLabs (agent_id), no aquí. Solo necesitas el nombre de la
              campaña — los demás campos de esta pantalla se ignoran para este proveedor.
            </div>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label htmlFor="voice">Voz del agente</label>
              <select id="voice" value={form.voice} onChange={(e) => update('voice', e.target.value)}>
                {VOICES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="accent">Idioma y acento</label>
              <select id="accent" value={form.accent} onChange={(e) => update('accent', e.target.value)}>
                {ACCENTS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="speed">Velocidad de habla ({Number(form.speed).toFixed(2)}x)</label>
              <input
                id="speed"
                type="range"
                min="0.25"
                max="1.5"
                step="0.05"
                value={form.speed}
                onChange={(e) => update('speed', Number(e.target.value))}
              />
            </div>
            <div className="form-field full">
              <label htmlFor="prompt">Instrucciones del agente (usa {'{{full_name}}'}, {'{{phone_number}}'}, {'{{balance_due}}'})</label>
              <textarea
                id="prompt"
                value={form.systemPromptTemplate}
                onChange={(e) => update('systemPromptTemplate', e.target.value)}
                required
              />
            </div>
          </>
        )}
      </div>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear campaña'}
        </button>
      </div>
    </form>
  );
}

function EditCampaignPanel({ campaign, onUpdated, onDeleted }) {
  const [voice, setVoice] = useState(campaign.voice);
  const [accent, setAccent] = useState(campaign.accent || 'es_CO');
  const [speed, setSpeed] = useState(Number(campaign.speed) || 1);
  const [systemPromptTemplate, setSystemPromptTemplate] = useState(campaign.system_prompt_template);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useAutoDismiss();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Si cambias de campaña seleccionada, refleja los valores de la nueva.
  useEffect(() => {
    setVoice(campaign.voice);
    setAccent(campaign.accent || 'es_CO');
    setSpeed(Number(campaign.speed) || 1);
    setSystemPromptTemplate(campaign.system_prompt_template);
    setSaved(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id, campaign.voice, campaign.accent, campaign.speed, campaign.system_prompt_template]);

  async function handleSave() {
    setError(null);
    setSaved(null);
    setSubmitting(true);
    try {
      await updateCampaign(campaign.id, { voice, accent, language: languageForAccent(accent), speed, systemPromptTemplate });
      setSaved('Guardado. La próxima llamada ya usa estos cambios.');
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Eliminar la campaña "${campaign.name}"? Esto borra también todos sus contactos y el historial de llamadas. No se puede deshacer.`
    );
    if (!confirmed) return;

    setError(null);
    setDeleting(true);
    try {
      await deleteCampaign(campaign.id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setDeleting(false);
    }
  }

  const isElevenLabs = campaign.telephony_provider === 'elevenlabs_twilio';

  return (
    <div className="panel">
      <h2>Editar "{campaign.name}"</h2>
      <p className="stat-sub" style={{ margin: '0 0 12px' }}>
        Cambia la voz, el idioma o el guion de una campaña ya creada, sin tener que crear una nueva.
      </p>
      {error && <div className="banner error">{error}</div>}
      {saved && <div className="banner success">{saved}</div>}
      <div className="form-grid">
        {isElevenLabs ? (
          <div className="form-field full">
            <div className="banner" style={{ margin: 0 }}>
              Esta campaña usa ElevenLabs (proveedor de prueba): la voz, personalidad y guion del agente se
              configuran en el dashboard de ElevenLabs (agent_id), no aquí. No hay nada que editar en esta
              pantalla para este proveedor.
            </div>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label htmlFor="edit-voice">Voz del agente</label>
              <select id="edit-voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
                {VOICES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="edit-accent">Idioma y acento</label>
              <select id="edit-accent" value={accent} onChange={(e) => setAccent(e.target.value)}>
                {ACCENTS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="edit-speed">Velocidad de habla ({speed.toFixed(2)}x)</label>
              <input
                id="edit-speed"
                type="range"
                min="0.25"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </div>
            <div className="form-field full">
              <label htmlFor="edit-prompt">Instrucciones del agente</label>
              <textarea
                id="edit-prompt"
                value={systemPromptTemplate}
                onChange={(e) => setSystemPromptTemplate(e.target.value)}
              />
            </div>
          </>
        )}
      </div>
      <div className="btn-row">
        {!isElevenLabs && (
          <button className="btn" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
        <button className="btn secondary" onClick={handleDelete} disabled={deleting} style={{ color: 'var(--status-critical)' }}>
          {deleting ? 'Eliminando...' : 'Eliminar campaña'}
        </button>
      </div>
    </div>
  );
}

function ContactsUploader({ campaignId }) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useAutoDismiss();
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload() {
    setError(null);
    setResult(null);
    let contacts;
    try {
      contacts = JSON.parse(raw);
      if (!Array.isArray(contacts)) throw new Error('El JSON debe ser un arreglo de contactos.');
    } catch (err) {
      setError(`JSON inválido: ${err.message}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await bulkUploadContacts(campaignId, contacts);
      setResult(`${res.inserted} contactos cargados correctamente.`);
      setRaw('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <h2>Cargar contactos (JSON)</h2>
      {error && <div className="banner error">{error}</div>}
      {result && <div className="banner success">{result}</div>}
      <div className="form-field full">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={CONTACTS_JSON_PLACEHOLDER}
          spellCheck={false}
        />
      </div>
      <div className="btn-row">
        <button className="btn" onClick={handleUpload} disabled={!campaignId || submitting || !raw.trim()}>
          {submitting ? 'Cargando...' : 'Cargar contactos'}
        </button>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { organizationId: orgFilter } = useOrgFilter();

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useAutoDismiss();
  const [callingContactId, setCallingContactId] = useState(null);
  const [callMessage, setCallMessage] = useAutoDismiss();

  async function refreshCampaigns(selectId) {
    const data = await listCampaigns(isAdmin ? orgFilter : undefined);
    setCampaigns(data);
    if (selectId) setSelectedCampaignId(String(selectId));
    else if (!data.find((c) => String(c.id) === String(selectedCampaignId))) {
      setSelectedCampaignId(data.length ? String(data[0].id) : '');
    }
  }

  useEffect(() => {
    refreshCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgFilter]);

  // Los contactos se refrescan solos cada pocos segundos -- asi el estado
  // (Pendiente -> Llamando -> Completada) se actualiza mientras la llamada
  // ocurre, sin tener que recargar la pagina.
  const { data: contactsData } = usePolling(
    () => (selectedCampaignId ? listContacts(selectedCampaignId, statusFilter || undefined) : Promise.resolve([])),
    3000,
    [selectedCampaignId, statusFilter]
  );
  const contacts = contactsData || [];

  async function handleLaunch() {
    setLaunching(true);
    setLaunchMessage(null);
    try {
      const res = await launchCampaign(selectedCampaignId, 25);
      setLaunchMessage(`Se procesaron ${res.results.length} contactos pendientes.`);
    } catch (err) {
      setLaunchMessage(err.response?.data?.error || err.message);
    } finally {
      setLaunching(false);
    }
  }

  async function handleCallContact(contactId) {
    setCallingContactId(contactId);
    setCallMessage(null);
    try {
      await callContactNow(contactId);
      setCallMessage('Llamando... revisa tu teléfono.');
    } catch (err) {
      setCallMessage(err.response?.data?.error || err.message);
    } finally {
      setCallingContactId(null);
    }
  }

  const selectedCampaign = campaigns.find((c) => String(c.id) === String(selectedCampaignId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Campañas y contactos</h1>
          <p>Crea campañas y carga las listas de contactos que el agente de voz va a llamar.</p>
        </div>
      </div>

      <CreateCampaignForm
        isAdmin={isAdmin}
        defaultOrganizationId={orgFilter}
        onCreated={(c) => refreshCampaigns(c.id)}
      />

      <div className="panel">
        <h2>Contactos por campaña</h2>
        <div className="select-inline">
          <label htmlFor="campaign-select">Campaña</label>
          <select
            id="campaign-select"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
          >
            <option value="">Selecciona una campaña</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.telephony_provider})
              </option>
            ))}
          </select>
          {selectedCampaign && (
            <button className="btn secondary" onClick={handleLaunch} disabled={launching}>
              {launching ? 'Lanzando...' : 'Lanzar llamadas pendientes'}
            </button>
          )}
          {selectedCampaignId && (
            <>
              <label htmlFor="status-filter">Estado</label>
              <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {CONTACT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
        {launchMessage && <div className="banner success">{launchMessage}</div>}
        {callMessage && <div className="banner success">{callMessage}</div>}

        {!selectedCampaignId ? (
          <p className="empty-state">Selecciona una campaña para ver sus contactos.</p>
        ) : contacts.length === 0 ? (
          <p className="empty-state">
            {statusFilter ? 'Ningún contacto en ese estado.' : 'Esta campaña todavía no tiene contactos cargados.'}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Saldo pendiente</th>
                  <th>Estado</th>
                  <th>Intentos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name || '—'}</td>
                    <td>{c.phone_number}</td>
                    <td>{c.balance_due ? `$${Number(c.balance_due).toLocaleString('es-CO')}` : '—'}</td>
                    <td><StatusBadge status={c.call_status} /></td>
                    <td>{c.attempts}</td>
                    <td>
                      <button
                        className="btn secondary"
                        onClick={() => handleCallContact(c.id)}
                        disabled={callingContactId === c.id}
                      >
                        {callingContactId === c.id ? 'Llamando...' : 'Llamar de nuevo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCampaign && (
        <EditCampaignPanel
          campaign={selectedCampaign}
          onUpdated={() => refreshCampaigns(selectedCampaignId)}
          onDeleted={() => refreshCampaigns()}
        />
      )}

      {selectedCampaignId && <ContactsUploader campaignId={selectedCampaignId} />}
    </div>
  );
}

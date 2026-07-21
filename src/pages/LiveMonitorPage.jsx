import { usePolling } from '../hooks/usePolling';
import { getLiveCalls } from '../api/calls';
import { useOrgFilter } from '../context/OrgFilterContext';
import StatusBadge from '../components/StatusBadge';

function elapsedSince(startedAt) {
  if (!startedAt) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function LiveMonitorPage() {
  const { organizationId } = useOrgFilter();
  const { data: liveCalls, loading } = usePolling(() => getLiveCalls(organizationId), 3000, [organizationId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Live Monitor</h1>
          <p>Llamadas en curso, actualizado cada 3 segundos.</p>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <p className="empty-state">Cargando...</p>
        ) : !liveCalls || liveCalls.length === 0 ? (
          <p className="empty-state">No hay llamadas en curso en este momento.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Campaña</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Tiempo en curso</th>
              </tr>
            </thead>
            <tbody>
              {liveCalls.map((call) => (
                <tr key={call.id}>
                  <td>{call.full_name || '—'}</td>
                  <td>{call.phone_number}</td>
                  <td>{call.campaign_name}</td>
                  <td>{call.telephony_provider}</td>
                  <td><StatusBadge status={call.status} /></td>
                  <td>{elapsedSince(call.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

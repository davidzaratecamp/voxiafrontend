import { usePolling } from '../hooks/usePolling';
import { getMetrics, getRecentCalls } from '../api/calls';
import { useOrgFilter } from '../context/OrgFilterContext';
import StatTile from '../components/StatTile';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const { organizationId } = useOrgFilter();
  const { data: metrics } = usePolling(() => getMetrics(organizationId), 5000, [organizationId]);
  const { data: recentCalls } = usePolling(() => getRecentCalls(10, organizationId), 5000, [organizationId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Vista general de la operación de Voxia en tiempo real.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatTile label="Llamadas activas" value={metrics?.activeCalls ?? '—'} />
        <StatTile label="Minutos consumidos" value={metrics?.minutesConsumed ?? '—'} />
        <StatTile
          label="Tasa de éxito"
          value={metrics ? `${metrics.successRate}%` : '—'}
          sub="Promesas de pago / ventas confirmadas"
        />
        <StatTile label="Llamadas totales" value={metrics?.totalCalls ?? '—'} />
        <StatTile
          label="Costo estimado"
          value={metrics ? `$${metrics.estimatedCostUsd.toFixed(2)}` : '—'}
          sub="USD, tokens API Realtime"
        />
      </div>

      <div className="panel">
        <h2>Últimas llamadas</h2>
        {!recentCalls || recentCalls.length === 0 ? (
          <p className="empty-state">Todavía no se han registrado llamadas.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Campaña</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call) => (
                <tr key={call.id}>
                  <td>{call.full_name || call.phone_number}</td>
                  <td>{call.campaign_name}</td>
                  <td>{call.telephony_provider}</td>
                  <td><StatusBadge status={call.status} /></td>
                  <td>{call.duration_seconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

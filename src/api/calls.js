import apiClient from './client';

export async function getMetrics(organizationId) {
  const { data } = await apiClient.get('/calls/metrics', {
    params: organizationId ? { organizationId } : undefined,
  });
  return data;
}

export async function getLiveCalls(organizationId) {
  const { data } = await apiClient.get('/calls/live', {
    params: organizationId ? { organizationId } : undefined,
  });
  return data;
}

export async function getRecentCalls(limit = 20, organizationId) {
  const { data } = await apiClient.get('/calls', {
    params: organizationId ? { limit, organizationId } : { limit },
  });
  return data;
}

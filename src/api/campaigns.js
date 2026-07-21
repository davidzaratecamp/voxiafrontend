import apiClient from './client';

export async function listCampaigns(organizationId) {
  const { data } = await apiClient.get('/campaigns', {
    params: organizationId ? { organizationId } : undefined,
  });
  return data;
}

export async function createCampaign(payload) {
  const { data } = await apiClient.post('/campaigns', payload);
  return data;
}

export async function updateCampaign(id, payload) {
  const { data } = await apiClient.patch(`/campaigns/${id}`, payload);
  return data;
}

export async function deleteCampaign(id) {
  await apiClient.delete(`/campaigns/${id}`);
}

export async function updateCampaignStatus(id, status) {
  const { data } = await apiClient.patch(`/campaigns/${id}/status`, { status });
  return data;
}

export async function launchCampaign(id, limit) {
  const { data } = await apiClient.post(`/campaigns/${id}/launch`, { limit });
  return data;
}

import apiClient from './client';

export async function listOrganizations() {
  const { data } = await apiClient.get('/organizations');
  return data;
}

export async function createOrganization(payload) {
  const { data } = await apiClient.post('/organizations', payload);
  return data;
}

export async function listOrganizationUsers(organizationId) {
  const { data } = await apiClient.get(`/organizations/${organizationId}/users`);
  return data;
}

export async function createOrganizationUser(organizationId, payload) {
  const { data } = await apiClient.post(`/organizations/${organizationId}/users`, payload);
  return data;
}

export async function resetOrganizationUserPassword(organizationId, userId) {
  const { data } = await apiClient.post(`/organizations/${organizationId}/users/${userId}/reset-password`);
  return data;
}

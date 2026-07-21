import apiClient from './client';

export async function listContacts(campaignId, status) {
  const { data } = await apiClient.get(`/campaigns/${campaignId}/contacts`, {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function bulkUploadContacts(campaignId, contacts) {
  const { data } = await apiClient.post(`/campaigns/${campaignId}/contacts/bulk`, { contacts });
  return data;
}

export async function callContactNow(contactId) {
  const { data } = await apiClient.post(`/contacts/${contactId}/call`);
  return data;
}

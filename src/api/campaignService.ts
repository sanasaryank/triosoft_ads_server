import { get, post, put, patch } from './client';
import type { Campaign, CampaignPayload } from '../types/models';

export async function getCampaigns(): Promise<Campaign[]> {
  return get<Campaign[]>('/campaign');
}

export async function getCampaignById(id: string): Promise<Campaign> {
  return get<Campaign>(`/campaign/${id}`);
}

export async function createCampaign(payload: CampaignPayload): Promise<Campaign> {
  return post<Campaign>('/campaign', payload);
}

export async function updateCampaign(id: string, payload: CampaignPayload): Promise<Campaign> {
  return put<Campaign>(`/campaign/${id}`, payload);
}

export async function blockCampaign(id: string, isBlocked: boolean): Promise<void> {
  await patch(`/campaign/${id}/block`, { isBlocked });
}

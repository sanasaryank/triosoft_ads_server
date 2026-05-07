import { get, put } from './client';
import type { Placement, PlacementCampaignsResponse, PlacementCampaignsPutPayload } from '../types/models';

export async function getPlacements(): Promise<Placement[]> {
  return get<Placement[]>('/placements');
}

export async function getPlacementCampaigns(id: string): Promise<PlacementCampaignsResponse> {
  return get<PlacementCampaignsResponse>(`/placements/campaigns/${id}`);
}

export async function updatePlacementCampaigns(
  id: string,
  payload: PlacementCampaignsPutPayload,
): Promise<PlacementCampaignsPutPayload> {
  return put<PlacementCampaignsPutPayload>(`/placements/campaigns/${id}`, payload);
}

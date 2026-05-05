import { get } from './client';
import type { ItemGroup } from '../types/models';

export async function getGroups(placementId: string): Promise<ItemGroup[]> {
  return get<ItemGroup[]>(`/groups?rid=${placementId}`);
}

export async function getSelections(placementId: string): Promise<ItemGroup[]> {
  return get<ItemGroup[]>(`/selections?rid=${placementId}`);
}

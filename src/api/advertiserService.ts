import { get, post, put, patch } from './client';
import type { Advertiser, AdvertiserPayload } from '../types/models';

export async function getAdvertisers(): Promise<Advertiser[]> {
  return get<Advertiser[]>('/advertiser');
}

export async function getAdvertiserById(id: string): Promise<Advertiser> {
  return get<Advertiser>(`/advertiser/${id}`);
}

export async function createAdvertiser(payload: AdvertiserPayload): Promise<Advertiser> {
  return post<Advertiser>('/advertiser', payload);
}

export async function updateAdvertiser(id: string, payload: AdvertiserPayload): Promise<Advertiser> {
  return put<Advertiser>(`/advertiser/${id}`, payload);
}

export async function blockAdvertiser(id: string, isBlocked: boolean): Promise<void> {
  await patch(`/advertiser/${id}/block`, { isBlocked });
}

import { get, post, put, patch } from './client';
import type { Creative, CreativeDetail, CreativePayload } from '../types/models';

export async function getCreatives(): Promise<Creative[]> {
  return get<Creative[]>('/creative');
}

export async function getCreativeById(id: string): Promise<CreativeDetail> {
  return get<CreativeDetail>(`/creative/${id}`);
}

export async function createCreative(payload: CreativePayload): Promise<Creative> {
  return post<Creative>('/creative', payload);
}

export async function updateCreative(id: string, payload: CreativePayload): Promise<Creative> {
  return put<Creative>(`/creative/${id}`, payload);
}

export async function blockCreative(id: string, isBlocked: boolean): Promise<void> {
  await patch(`/creative/${id}/block`, { isBlocked });
}

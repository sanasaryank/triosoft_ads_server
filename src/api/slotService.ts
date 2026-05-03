import { get, post, put, patch } from './client';
import type { Slot, SlotPayload } from '../types/models';

export async function getSlots(): Promise<Slot[]> {
  return get<Slot[]>('/slot');
}

export async function getSlotById(id: string): Promise<Slot> {
  return get<Slot>(`/slot/${id}`);
}

export async function createSlot(payload: SlotPayload): Promise<Slot> {
  return post<Slot>('/slot', payload);
}

export async function updateSlot(id: string, payload: SlotPayload): Promise<Slot> {
  return put<Slot>(`/slot/${id}`, payload);
}

export async function blockSlot(id: string, isBlocked: boolean): Promise<void> {
  await patch(`/slot/${id}/block`, { isBlocked });
}

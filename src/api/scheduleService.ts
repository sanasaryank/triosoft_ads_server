import { get, post, put, patch } from './client';
import type { Schedule, SchedulePayload } from '../types/models';

export async function getSchedules(): Promise<Schedule[]> {
  return get<Schedule[]>('/schedule');
}

export async function getScheduleById(id: string): Promise<Schedule> {
  return get<Schedule>(`/schedule/${id}`);
}

export async function createSchedule(payload: SchedulePayload): Promise<Schedule> {
  return post<Schedule>('/schedule', payload);
}

export async function updateSchedule(id: string, payload: SchedulePayload): Promise<Schedule> {
  return put<Schedule>(`/schedule/${id}`, payload);
}

export async function blockSchedule(id: string, isBlocked: boolean): Promise<void> {
  await patch(`/schedule/${id}/block`, { isBlocked });
}

import { get, post, put, patch } from './client';
import type { Platform, PlatformPayload } from '../types/models';

export const getPlatforms = (): Promise<Platform[]> => get('/platform');
export const getPlatformById = (id: string): Promise<Platform> => get(`/platform/${id}`);
export const createPlatform = (data: PlatformPayload): Promise<Platform> => post('/platform', data);
export const updatePlatform = (id: string, data: PlatformPayload): Promise<Platform> => put(`/platform/${id}`, data);
export const blockPlatform = (id: string, isBlocked: boolean): Promise<void> =>
  patch(`/platform/${id}/block`, { isBlocked });

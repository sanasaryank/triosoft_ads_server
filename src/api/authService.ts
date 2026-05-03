import { get, post } from './client';
import type { CurrentUser, LoginPayload } from '../types/auth';

export async function login(payload: LoginPayload): Promise<void> {
  const credentials = btoa(`${payload.username}:${payload.password}`);
  await post('/login', undefined, {
    headers: { Authorization: `Basic ${credentials}` },
  });
}

export async function logout(): Promise<void> {
  await post('/logout');
}

export async function getMe(): Promise<CurrentUser> {
  return get<CurrentUser>('/me');
}

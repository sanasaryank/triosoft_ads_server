import { get } from './client';
import type { Placement } from '../types/models';

export async function getPlacements(): Promise<Placement[]> {
  return get<Placement[]>('/placements');
}

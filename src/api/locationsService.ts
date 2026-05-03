import { get } from './client';
import type { LocationsResponse } from '../types/models';

export async function getLocations(): Promise<LocationsResponse> {
  return get<LocationsResponse>('/locations');
}

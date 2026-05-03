import { get } from './client';
import type { DictionaryItem } from '../types/models';

export async function getRestaurantTypes(): Promise<DictionaryItem[]> {
  return get<DictionaryItem[]>('/dictionary/restaurant-types');
}

export async function getMenuTypes(): Promise<DictionaryItem[]> {
  return get<DictionaryItem[]>('/dictionary/menu-types');
}

export async function getPriceSegments(): Promise<DictionaryItem[]> {
  return get<DictionaryItem[]>('/dictionary/price-segments');
}

export async function getIntegrationTypes(): Promise<DictionaryItem[]> {
  return get<DictionaryItem[]>('/dictionary/integration-types');
}

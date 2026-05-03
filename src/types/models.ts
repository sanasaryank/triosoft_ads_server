import type { Translation } from './common';

// ── Placement ────────────────────────────────────────────────────────────────
export interface Placement {
  id: string;
  name: Translation;
  cityName: string;
  districtName: string;
  isBlocked: boolean;
}

// ── Schedule ─────────────────────────────────────────────────────────────────
export interface WeekDay {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  enabled: boolean;
  start: number;
  end: number;
}

export interface Schedule {
  id: string;
  name: Translation;
  color: string;
  weekSchedule: WeekDay[];
  isBlocked: boolean;
  hash?: string;
}

export interface SchedulePayload {
  name: Translation;
  color: string;
  weekSchedule: WeekDay[];
  hash?: string;
}

// ── Slot ─────────────────────────────────────────────────────────────────────
export type SlotType = 'MainBig' | 'MainSmall' | 'Group' | 'Selection';

export interface Slot {
  id: string;
  name: Translation;
  type: SlotType;
  rotationPeriod: number;
  refreshTTL: number;
  noAdjacentSameAdvertiser: boolean;
  description: string;
  isBlocked: boolean;
  hash?: string;
}

export interface SlotPayload {
  name: Translation;
  type: SlotType;
  rotationPeriod: number;
  refreshTTL: number;
  noAdjacentSameAdvertiser: boolean;
  description: string;
  hash?: string;
}

// ── Advertiser ────────────────────────────────────────────────────────────────
export interface Advertiser {
  id: string;
  name: Translation;
  TIN: string;
  description: string;
  isBlocked: boolean;
  hash?: string;
}

export interface AdvertiserPayload {
  name: Translation;
  TIN: string;
  description: string;
  hash?: string;
}

// ── Campaign ─────────────────────────────────────────────────────────────────
export interface FrequencyWindow {
  count: number;
  window_sec: number;
}

export interface FrequencyCapCategory {
  impressions: FrequencyWindow;
  clicks: FrequencyWindow;
}

export interface FrequencyCap {
  per_user: FrequencyCapCategory;
  per_session: FrequencyCapCategory;
}

export interface CampaignTarget {
  id: string;
  slots: {
    id: string;
    schedules: string[];
    placements: string[];
  }[];
}

export interface Campaign {
  id: string;
  advertiserId: string;
  name: Translation;
  description: string;
  startDate: number;
  endDate: number;
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: string;
  spendStrategy: string;
  frequencyCapStrategy: string;
  frequencyCap: FrequencyCap;
  priority: number;
  weight: number;
  overdeliveryRatio: number;
  locationsMode: string;
  locations: string[];
  restaurantTypesMode: string;
  restaurantTypes: string[];
  menuTypesMode: string;
  menuTypes: string[];
  slots: string[];
  targets: CampaignTarget[];
  isBlocked: boolean;
  hash?: string;
}

export interface CampaignPayload {
  advertiserId: string;
  name: Translation;
  description: string;
  startDate: number;
  endDate: number;
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: string;
  spendStrategy: string;
  frequencyCapStrategy: string;
  frequencyCap: FrequencyCap;
  priority: number;
  weight: number;
  overdeliveryRatio: number;
  locationsMode: string;
  locations: string[];
  restaurantTypesMode: string;
  restaurantTypes: string[];
  menuTypesMode: string;
  menuTypes: string[];
  slots: string[];
  targets: CampaignTarget[];
  hash?: string;
}

// ── Creative ─────────────────────────────────────────────────────────────────
export interface Creative {
  id: string;
  campaignId: string;
  name: Translation;
  dataUrl: string;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  isBlocked: boolean;
  hash?: string;
}

export interface CreativePayload {
  campaignId: string;
  name: Translation;
  dataUrl: string;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  hash?: string;
}

// ── Locations ─────────────────────────────────────────────────────────────────
export interface LocationsResponse {
  countries: Record<string, { name: string }>;
  cities: Record<string, { name: string; countryId: string }>;
  districts: Record<string, { name: string; cityId: string }>;
}

// ── Dictionary item ───────────────────────────────────────────────────────────
export interface DictionaryItem {
  id: string;
  name: Translation;
  description: string;
  isBlocked: boolean;
}

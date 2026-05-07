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

// ── Platform ─────────────────────────────────────────────────────────────────
export interface Platform {
  id: string;
  name: Translation;
  description: string;
  isBlocked: boolean;
  hash?: string;
}

export interface PlatformPayload {
  name: Translation;
  description: string;
  isBlocked: boolean;
  hash?: string;
}

// ── Slot ─────────────────────────────────────────────────────────────────────
export type SlotType = 'MainBig' | 'MainSmall' | 'Group' | 'Selection' | 'Item';

export interface Slot {
  id: string;
  name: Translation;
  type: SlotType;
  platformId: string;
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
  platformId: string;
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

export interface TargetSlotEntry {
  schedules: string[];
  items: string[];
}

// placement-id → { slot-id → slot entry }
export type TargetEntry = Record<string, TargetSlotEntry>;

export type CampaignTargets = Record<string, TargetEntry>;

// ── Groups / Selections (items picker) ───────────────────────────────────────

export interface DishRef {
  id: string;
  name: Translation;
}

export interface DishItem {
  id: string;
  name: Translation;
  menu: DishRef;
  group: DishRef;
  image: string;
  isOver18: boolean;
  price: number;
  isMenuBlocked: boolean;
  isGroupBlocked: boolean;
  isDishBlocked: boolean;
}

export interface ItemGroup {
  id: string;
  name: Translation;
  dishes: DishItem[];
}

// ── Placement Campaigns ────────────────────────────────────────────────────────

export interface PlacementCampaignSlotEntry {
  schedules: string[];
  items: string[];
}

export interface PlacementCampaignEntry {
  slots: Record<string, PlacementCampaignSlotEntry>;
  startDate: number; // unix timestamp (seconds)
  endDate: number;   // unix timestamp (seconds)
  isBlocked: boolean;
  hash: string;
}

export interface PlacementCampaignAdvertiserEntry {
  isBlocked: boolean;
  campaigns: Record<string, PlacementCampaignEntry>;
}

// GET /placements/campaigns/{placement_id}
export type PlacementCampaignsResponse = Record<string, PlacementCampaignAdvertiserEntry>;

// PUT /placements/campaigns/{placement_id} – per-campaign entry
export interface PlacementCampaignPutEntry {
  slots: Record<string, PlacementCampaignSlotEntry>;
  hash: string;
}

// PUT /placements/campaigns/{placement_id} – full request / response payload
export type PlacementCampaignsPutPayload = Record<string, PlacementCampaignPutEntry>;

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
  targets: CampaignTargets;
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
  targets: CampaignTargets;
  hash?: string;
}

// ── Creative ─────────────────────────────────────────────────────────────────
export type CreativeLanguage = 'ARM' | 'ENG' | 'RUS';

export interface CreativeFilesResponse {
  defaultLanguage: CreativeLanguage;
  ARM: { indexFile: string; media: string[] };
  ENG: { indexFile: string; media: string[] };
  RUS: { indexFile: string; media: string[] };
}

export interface Creative {
  id: string;
  campaignId: string;
  name: Translation;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  isBlocked: boolean;
}

// Full creative returned by GET /creative/{id} — includes files map and hash
export interface CreativeDetail extends Creative {
  files: CreativeFilesResponse;
  hash: string;
}

export interface CreativeFileEntry {
  name: string;
  contents?: string; // raw base64, new files only
}

export interface CreativeLangFilesPayload {
  indexFile: string;
  media: CreativeFileEntry[];
}

export interface CreativePayload {
  campaignId: string;
  name: Translation;
  files: {
    defaultLanguage: CreativeLanguage;
    ARM: CreativeLangFilesPayload;
    ENG: CreativeLangFilesPayload;
    RUS: CreativeLangFilesPayload;
  };
  isBlocked?: boolean;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  hash?: string;
}

// ── Locations ─────────────────────────────────────────────────────────────────
export interface LocationItem {
  id: string;
  name: string;
  isBlocked: boolean;
}

export interface CityItem extends LocationItem {
  countryId: string;
}

export interface DistrictItem extends LocationItem {
  cityId: string;
}

export interface LocationsResponse {
  countries: LocationItem[];
  cities: CityItem[];
  districts: DistrictItem[];
}

// ── Dictionary item ───────────────────────────────────────────────────────────
export interface DictionaryItem {
  id: string;
  name: Translation;
  description: string;
  isBlocked: boolean;
}

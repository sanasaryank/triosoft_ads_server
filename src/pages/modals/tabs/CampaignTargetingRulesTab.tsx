import React, { useState } from 'react';
import { Checkbox } from '../../../components/ui/FormFields';
import { useLang } from '../../../providers/LanguageProvider';
import type { LocationsResponse, CityItem, DictionaryItem } from '../../../types/models';
import type { Translation } from '../../../types/common';

interface CampaignTargetingRulesTabProps {
  locationsMode: string;
  setLocationsMode: (v: string) => void;
  selectedLocations: string[];
  setSelectedLocations: (v: string[]) => void;
  locationsData: LocationsResponse | null;
  restaurantTypesMode: string;
  setRestaurantTypesMode: (v: string) => void;
  selectedRestaurantTypes: string[];
  setSelectedRestaurantTypes: (v: string[]) => void;
  restaurantTypeOptions: DictionaryItem[];
  menuTypesMode: string;
  setMenuTypesMode: (v: string) => void;
  selectedMenuTypes: string[];
  setSelectedMenuTypes: (v: string[]) => void;
  menuTypeOptions: DictionaryItem[];
}

export function CampaignTargetingRulesTab({
  locationsMode, setLocationsMode, selectedLocations, setSelectedLocations, locationsData,
  restaurantTypesMode, setRestaurantTypesMode, selectedRestaurantTypes, setSelectedRestaurantTypes, restaurantTypeOptions,
  menuTypesMode, setMenuTypesMode, selectedMenuTypes, setSelectedMenuTypes, menuTypeOptions,
}: CampaignTargetingRulesTabProps) {
  const { t, getLocalized } = useLang();

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="flex flex-col gap-5">
      <ModeSection label={t('campaigns.locations')} mode={locationsMode} onModeChange={setLocationsMode}
        allowedLabel={t('common.allowed')} deniedLabel={t('common.denied')}>
        {locationsData
          ? <LocationPicker data={locationsData} selected={selectedLocations} onChange={setSelectedLocations}
              selectLabel={t('campaigns.selectLocations')} />
          : <p className="text-xs text-gray-400">{t('common.loading')}</p>}
      </ModeSection>

      <ModeSection label={t('campaigns.restaurantTypes')} mode={restaurantTypesMode} onModeChange={setRestaurantTypesMode}
        allowedLabel={t('common.allowed')} deniedLabel={t('common.denied')}>
        <CheckList items={restaurantTypeOptions} selected={selectedRestaurantTypes}
          getLabel={getLocalized}
          onToggle={(id) => toggleItem(selectedRestaurantTypes, setSelectedRestaurantTypes, id)} />
      </ModeSection>

      <ModeSection label={t('campaigns.menuTypes')} mode={menuTypesMode} onModeChange={setMenuTypesMode}
        allowedLabel={t('common.allowed')} deniedLabel={t('common.denied')}>
        <CheckList items={menuTypeOptions} selected={selectedMenuTypes}
          getLabel={getLocalized}
          onToggle={(id) => toggleItem(selectedMenuTypes, setSelectedMenuTypes, id)} />
      </ModeSection>
    </div>
  );
}

// ── ModeSection ───────────────────────────────────────────────────────────────

interface ModeSectionProps {
  label: string;
  mode: string;
  onModeChange: (v: string) => void;
  allowedLabel: string;
  deniedLabel: string;
  children: React.ReactNode;
}

function ModeSection({ label, mode, onModeChange, allowedLabel, deniedLabel, children }: ModeSectionProps) {
  return (
    <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div className="flex gap-3 text-xs">
          {(['allowed', 'denied'] as const).map((val) => (
            <label key={val} className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name={`mode-${label}`} value={val} checked={mode === val}
                onChange={() => onModeChange(val)} className="text-primary-600" />
              <span className={mode === val ? 'font-semibold text-gray-800' : 'text-gray-500'}>
                {val === 'allowed' ? allowedLabel : deniedLabel}
              </span>
            </label>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── LocationPicker ────────────────────────────────────────────────────────────

interface LocationPickerProps {
  data: LocationsResponse;
  selected: string[];
  onChange: (v: string[]) => void;
  selectLabel: string;
}

function LocationPicker({ data, selected, onChange, selectLabel }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

  const multiCountry = data.countries.length > 1;
  const q = search.toLowerCase();

  const toggleExpandCountry = (countryId: string) =>
    setExpandedCountries((p) => ({ ...p, [countryId]: !p[countryId] }));

  const cityMatchesSearch = (city: CityItem) => {
    if (!q) return true;
    if (city.name.toLowerCase().includes(q)) return true;
    return data.districts.some((d) => d.cityId === city.id && d.name.toLowerCase().includes(q));
  };

  const cityDistricts = (cityId: string) =>
    data.districts.filter((d) => d.cityId === cityId);

  const filteredDistricts = (cityId: string) => {
    const dists = cityDistricts(cityId);
    if (!q) return dists;
    const cityName = data.cities.find((c) => c.id === cityId)?.name.toLowerCase() ?? '';
    if (cityName.includes(q)) return dists;
    return dists.filter((d) => d.name.toLowerCase().includes(q));
  };

  const toggleExpand = (cityId: string) =>
    setExpanded((p) => ({ ...p, [cityId]: !p[cityId] }));

  const toggleAll = (cityId: string) => {
    const ids = cityDistricts(cityId).map((d) => d.id);
    const allSelected = ids.every((id) => selected.includes(id));
    onChange(allSelected
      ? selected.filter((id) => !ids.includes(id))
      : [...selected, ...ids.filter((id) => !selected.includes(id))]);
  };

  const toggleOne = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const removeChip = (id: string) => onChange(selected.filter((x) => x !== id));

  const CityBlock = ({ city }: { city: CityItem }) => {
    const dists = filteredDistricts(city.id);
    const selectedCount = cityDistricts(city.id).filter((d) => selected.includes(d.id)).length;
    const allChecked = dists.length > 0 && dists.every((d) => selected.includes(d.id));
    const indeterminate = selectedCount > 0 && !allChecked;
    const isOpen = expanded[city.id] ?? q !== '';
    return (
      <div>
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none"
          onClick={() => toggleExpand(city.id)}>
          <Checkbox
            checked={allChecked}
            indeterminate={indeterminate}
            onChange={(e) => { e.stopPropagation(); toggleAll(city.id); }}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="flex-1 font-medium text-gray-700">{city.name}</span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-primary-700 font-medium text-[10px]">
              {selectedCount}/{cityDistricts(city.id).length}
            </span>
          )}
          <svg className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {isOpen && (
          <div className="bg-white">
            {dists.map((dist) => (
              <label key={dist.id} className="flex items-center gap-2 px-4 py-1 hover:bg-gray-50 cursor-pointer">
                <Checkbox checked={selected.includes(dist.id)} onChange={() => toggleOne(dist.id)} />
                <span className="text-gray-600">{dist.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-primary-400 focus:outline-none">
        <span className={selected.length === 0 ? 'text-gray-400' : 'font-medium text-gray-800'}>
          {selected.length === 0 ? selectLabel : `${selectLabel} (${selected.length})`}
        </span>
        <svg className={`h-3 w-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none" />

          <div className="max-h-52 overflow-y-auto rounded border border-gray-200 text-xs divide-y divide-gray-100">
            {multiCountry
              ? data.countries.map((country) => {
                  const cities = data.cities.filter((c) => c.countryId === country.id && cityMatchesSearch(c));
                  if (cities.length === 0) return null;
                  const countrySelected = data.districts
                    .filter((d) => data.cities.find((c) => c.id === d.cityId && c.countryId === country.id))
                    .filter((d) => selected.includes(d.id)).length;
                  const isCountryOpen = expandedCountries[country.id] ?? q !== '';
                  return (
                    <div key={country.id}>
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 bg-primary-50 hover:bg-primary-100 cursor-pointer select-none"
                        onClick={() => toggleExpandCountry(country.id)}>
                        <span className="flex-1 text-primary-700 font-semibold text-[11px] uppercase tracking-wide">
                          {country.name}
                        </span>
                        {countrySelected > 0 && (
                          <span className="rounded-full bg-primary-200 px-1.5 py-0.5 text-primary-800 font-medium text-[10px]">
                            {countrySelected}
                          </span>
                        )}
                        <svg className={`h-3 w-3 text-primary-400 transition-transform ${isCountryOpen ? 'rotate-90' : ''}`}
                          viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {isCountryOpen && cities.map((city) => <CityBlock key={city.id} city={city} />)}
                    </div>
                  );
                })
              : data.cities.filter(cityMatchesSearch).map((city) => <CityBlock key={city.id} city={city} />)
            }
            {data.cities.filter(cityMatchesSearch).length === 0 && (
              <p className="px-3 py-2 text-gray-400">No results</p>
            )}
          </div>
        </>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {selected.map((id) => {
            const dist = data.districts.find((d) => d.id === id);
            if (!dist) return null;
            const city = data.cities.find((c) => c.id === dist.cityId);
            return (
              <span key={id}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-2 py-0.5 text-[11px] text-primary-800">
                {city ? `${city.name} · ` : ''}{dist.name}
                <button type="button" onClick={() => removeChip(id)}
                  className="ml-0.5 text-primary-400 hover:text-primary-700 leading-none">&times;</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── CheckList ─────────────────────────────────────────────────────────────────

interface CheckListProps {
  items: DictionaryItem[];
  selected: string[];
  onToggle: (id: string) => void;
  getLabel: (name: Translation) => string;
}

function CheckList({ items, selected, onToggle, getLabel }: CheckListProps) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return <p className="text-xs text-gray-400">—</p>;
  return (
    <div className="max-h-36 overflow-y-auto flex flex-wrap gap-x-4 gap-y-1">
      {safeItems.map((item) => (
        <label key={item.id} className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary-600">
          <Checkbox checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
          {getLabel(item.name)}
        </label>
      ))}
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/FormFields';
import { ItemsPickerModal } from '../../../components/ui/ItemsPickerModal';
import { useLang } from '../../../providers/LanguageProvider';
import type { Placement, Slot, Platform, Schedule, CampaignTargets, TargetSlotEntry } from '../../../types/models';

export interface CampaignTargetingTabProps {
  targets: CampaignTargets;
  setTargets: (v: CampaignTargets) => void;
  placements: Placement[];
  slots: Slot[];
  platforms: Platform[];
  schedules: Schedule[];
  isEdit?: boolean;
}

// ── Add Placement Modal ───────────────────────────────────────────────────────

interface AddPlacementModalProps {
  open: boolean;
  onClose: () => void;
  placements: Placement[];
  usedIds: string[];
  onSave: (ids: string[]) => void;
}

function AddPlacementModal({ open, onClose, placements, usedIds, onSave }: AddPlacementModalProps) {
  const { t, getLocalized } = useLang();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [local, setLocal] = useState<string[]>([]);

  useEffect(() => { if (open) { setSearch(''); setStatusFilter('all'); setLocal([]); } }, [open]);

  const q = search.toLowerCase();
  const available = placements.filter((p) => {
    if (usedIds.includes(p.id)) return false;
    if (statusFilter === 'active' && p.isBlocked) return false;
    if (statusFilter === 'blocked' && !p.isBlocked) return false;
    if (q !== '' &&
      !getLocalized(p.name).toLowerCase().includes(q) &&
      !p.cityName.toLowerCase().includes(q) &&
      !p.districtName.toLowerCase().includes(q)) return false;
    return true;
  });

  const toggle = (id: string) =>
    setLocal((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('campaigns.addPlacement')}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={local.length === 0} onClick={() => { onSave(local); onClose(); }}>
            {t('common.save')}{local.length > 0 ? ` (${local.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('campaigns.searchPlacements')}
          autoFocus
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {/* Status filter */}
        <div className="flex gap-1">
          {(['all', 'active', 'blocked'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-0.5 text-xs transition-colors ${
                statusFilter === s
                  ? 'border-primary-400 bg-primary-50 font-medium text-primary-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t(`common.${s}` as any)}
            </button>
          ))}
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded border border-gray-200">
          {available.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-400">{t('common.empty')}</p>
          ) : (
            available.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-primary-50"
              >
                <Checkbox
                  checked={local.includes(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{getLocalized(p.name)}</span>
                    {p.isBlocked && (
                      <span className="flex-shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                        {t('common.blocked')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{p.cityName} · {p.districtName}</div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Slot Picker Modal (single-select, excludes already-added) ─────────────────

interface SlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  slotsByPlatform: Map<string, Slot[]>;
  platforms: Platform[];
  usedSlotIds: string[];
  onSave: (slotIds: string[]) => void;
}

function SlotPickerModal({ open, onClose, slotsByPlatform, platforms, usedSlotIds, onSave }: SlotPickerModalProps) {
  const { t, getLocalized } = useLang();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [local, setLocal] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLocal([]);
    const init: Record<string, boolean> = {};
    for (const [platformId, pSlots] of slotsByPlatform) {
      if (pSlots.some((s) => !usedSlotIds.includes(s.id))) init[platformId] = true;
    }
    setExpanded(init);
  }, [open]);

  const togglePlatform = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggle = (id: string) =>
    setLocal((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('campaigns.addSlot')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={local.length === 0} onClick={() => { onSave(local); onClose(); }}>
            {t('common.save')}{local.length > 0 ? ` (${local.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
        {platforms.map((platform) => {
          const pSlots = slotsByPlatform.get(platform.id) ?? [];
          if (pSlots.length === 0) return null;
          const isOpen = !!expanded[platform.id];
          return (
            <div key={platform.id}>
              <button
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <span>{getLocalized(platform.name)}</span>
                <svg
                  className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && pSlots.map((slot) => {
                const alreadyAdded = usedSlotIds.includes(slot.id);
                const isChecked = local.includes(slot.id);
                return (
                  <label
                    key={slot.id}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                      alreadyAdded ? 'cursor-default opacity-40' : 'cursor-pointer hover:bg-primary-50'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={() => !alreadyAdded && toggle(slot.id)}
                      disabled={alreadyAdded}
                    />
                    <span className="flex-1 text-left text-gray-700">{getLocalized(slot.name)}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{slot.type}</span>
                    {alreadyAdded && (
                      <svg className="h-3.5 w-3.5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ── Schedule Picker Modal ─────────────────────────────────────────────────────

interface SchedulePickerModalProps {
  open: boolean;
  onClose: () => void;
  schedules: Schedule[];
  selected: string[];
  onSave: (selected: string[]) => void;
}

function SchedulePickerModal({ open, onClose, schedules, selected, onSave }: SchedulePickerModalProps) {
  const { t, getLocalized } = useLang();
  const [local, setLocal] = useState<string[]>(selected);

  useEffect(() => { if (open) setLocal(selected); }, [open]);

  const toggle = (id: string) =>
    setLocal((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('campaigns.schedules')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => { onSave(local); onClose(); }}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
        {schedules.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">{t('common.empty')}</p>
        ) : (
          schedules.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-gray-50">
              <Checkbox checked={local.includes(s.id)} onChange={() => toggle(s.id)} />
              <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-gray-700">{getLocalized(s.name)}</span>
            </label>
          ))
        )}
      </div>
    </Modal>
  );
}

// ── Shared icon buttons ───────────────────────────────────────────────────────

function CalendarBadge({ count, onClick }: { count: number; onClick: () => void }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      title={t('campaigns.schedules')}
      className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:border-primary-400 hover:text-primary-600"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
      <span className={count > 0 ? 'font-semibold text-primary-600' : ''}>{count}</span>
    </button>
  );
}

function ItemsBadge({ count, onClick, slotType }: { count: number; onClick: () => void; slotType: string }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      title={slotType === 'Group' ? t('campaigns.groups') : t('campaigns.selections')}
      onClick={onClick}
      className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:border-primary-400 hover:text-primary-600"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <span className={count > 0 ? 'font-semibold text-primary-600' : ''}>{count}</span>
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export function CampaignTargetingTab({
  targets,
  setTargets,
  placements,
  slots,
  platforms,
  schedules,
  isEdit,
}: CampaignTargetingTabProps) {
  const { t, getLocalized } = useLang();

  const [addOpen, setAddOpen] = useState(false);
  const [slotPickerFor, setSlotPickerFor] = useState<string | null>(null);    // placementId
  const [schedPickerFor, setSchedPickerFor] = useState<{ placementId: string; slotId: string } | null>(null);
  const [itemsPickerFor, setItemsPickerFor] = useState<{ placementId: string; slotId: string } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const collapsedInitRef = React.useRef(false);

  // In edit mode, collapse all placements once targets are loaded
  useEffect(() => {
    if (!isEdit || collapsedInitRef.current) return;
    const ids = Object.keys(targets);
    if (ids.length === 0) return;
    collapsedInitRef.current = true;
    setCollapsed(Object.fromEntries(ids.map((id) => [id, true])));
  }, [targets, isEdit]);

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const placementById = useMemo(() => new Map(placements.map((p) => [p.id, p])), [placements]);
  const slotById      = useMemo(() => new Map(slots.map((s) => [s.id, s])),      [slots]);
  const platformById  = useMemo(() => new Map(platforms.map((p) => [p.id, p])),  [platforms]);

  const slotsByPlatform = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      if (!map.has(slot.platformId)) map.set(slot.platformId, []);
      map.get(slot.platformId)!.push(slot);
    }
    return map;
  }, [slots]);

  const placementIds = Object.keys(targets);

  // ── mutations ─────────────────────────────────────────────────────────────

  const addPlacements = (ids: string[]) => {
    const next = { ...targets };
    for (const id of ids) next[id] = next[id] ?? {};
    setTargets(next);
    setAddOpen(false);
  };

  const removePlacement = (placementId: string) => {
    const next = { ...targets };
    delete next[placementId];
    setTargets(next);
    setCollapsed((prev) => { const c = { ...prev }; delete c[placementId]; return c; });
  };

  const addSlots = (placementId: string, slotIds: string[]) => {
    const existing = targets[placementId] ?? {};
    const next: typeof existing = { ...existing };
    for (const slotId of slotIds) next[slotId] = next[slotId] ?? { schedules: [], items: [] };
    setTargets({ ...targets, [placementId]: next });
    setSlotPickerFor(null);
  };

  const removeSlot = (placementId: string, slotId: string) => {
    const placementSlots = { ...targets[placementId] };
    delete placementSlots[slotId];
    setTargets({ ...targets, [placementId]: placementSlots });
  };

  const updateSlotEntry = (placementId: string, slotId: string, patch: Partial<TargetSlotEntry>) => {
    setTargets({
      ...targets,
      [placementId]: {
        ...targets[placementId],
        [slotId]: { ...targets[placementId][slotId], ...patch },
      },
    });
  };

  return (
    <div className="flex min-h-[220px] flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {placementIds.length > 0
            ? `${placementIds.length} ${t('campaigns.placements')}`
            : t('campaigns.noTargets')}
        </span>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          + {t('campaigns.addPlacement')}
        </Button>
      </div>

      {/* Placement blocks */}
      {placementIds.map((placementId) => {
        const placement = placementById.get(placementId);
        const slotEntries = targets[placementId];
        const slotIds = Object.keys(slotEntries);

        return (
          <div key={placementId} className="rounded-lg border border-gray-200 text-sm">
            {/* Placement header */}
            <div className={`flex items-center justify-between bg-gray-50 px-3 py-2 ${collapsed[placementId] ? 'rounded-lg' : 'rounded-t-lg'}`}>
              <button
                type="button"
                onClick={() => toggleCollapsed(placementId)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <svg
                  className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${collapsed[placementId] ? '' : 'rotate-90'}`}
                  viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="min-w-0">
                  <span className="font-medium text-gray-800">
                    {placement ? getLocalized(placement.name) : placementId}
                  </span>
                  {placement && (
                    <span className="ml-2 text-xs text-gray-400">
                      {placement.cityName} · {placement.districtName}
                    </span>
                  )}
                </div>
                {collapsed[placementId] && slotIds.length > 0 && (
                  <span className="ml-1 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">
                    {slotIds.length}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                {!collapsed[placementId] && (
                  <button
                    type="button"
                    onClick={() => setSlotPickerFor(placementId)}
                    className="flex items-center gap-1 rounded border border-dashed border-primary-300 px-2 py-1 text-xs text-primary-500 transition-colors hover:border-primary-500 hover:bg-primary-50"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {t('campaigns.addSlot')}
                  </button>
                )}
                <RemoveBtn onClick={() => removePlacement(placementId)} />
              </div>
            </div>

            {/* Slot rows */}
            {!collapsed[placementId] && slotIds.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {slotIds.map((slotId) => {
                  const slot = slotById.get(slotId);
                  const platform = slot ? platformById.get(slot.platformId) : undefined;
                  const entry = slotEntries[slotId];
                  const isItemsSlot = slot && (slot.type === 'Group' || slot.type === 'Selection');

                  return (
                    <div key={slotId} className="flex items-center gap-3 px-3 py-2 pl-6">
                      {/* Slot label */}
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <svg className="h-3 w-3 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="truncate text-gray-700">
                          {platform ? getLocalized(platform.name) : '?'}
                          <span className="mx-1 text-gray-300">/</span>
                          {slot ? getLocalized(slot.name) : slotId}
                        </span>
                        {slot && (
                          <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {slot.type}
                          </span>
                        )}
                      </div>

                      {/* Schedules */}
                      <CalendarBadge
                        count={entry.schedules.length}
                        onClick={() => setSchedPickerFor({ placementId, slotId })}
                      />

                      {/* Items (Group/Selection only) */}
                      {isItemsSlot ? (
                        <ItemsBadge
                          count={entry.items.length}
                          slotType={slot!.type}
                          onClick={() => setItemsPickerFor({ placementId, slotId })}
                        />
                      ) : <span className="w-[46px]" />}

                      {/* Remove slot */}
                      <RemoveBtn onClick={() => removeSlot(placementId, slotId)} />
                    </div>
                  );
                })}
              </div>
            ) : !collapsed[placementId] ? (
              <p className="px-3 py-2 pl-6 text-xs text-gray-400 italic">
                {t('campaigns.noSlots')}
              </p>
            ) : null}
          </div>
        );
      })}

      {/* ── Modals ── */}

      <AddPlacementModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        placements={placements}
        usedIds={placementIds}
        onSave={addPlacements}
      />

      {slotPickerFor && (
        <SlotPickerModal
          open
          onClose={() => setSlotPickerFor(null)}
          slotsByPlatform={slotsByPlatform}
          platforms={platforms}
          usedSlotIds={Object.keys(targets[slotPickerFor] ?? {})}
          onSave={(slotIds) => addSlots(slotPickerFor, slotIds)}
        />
      )}

      {schedPickerFor && (
        <SchedulePickerModal
          open
          onClose={() => setSchedPickerFor(null)}
          schedules={schedules}
          selected={targets[schedPickerFor.placementId]?.[schedPickerFor.slotId]?.schedules ?? []}
          onSave={(sel) => {
            updateSlotEntry(schedPickerFor.placementId, schedPickerFor.slotId, { schedules: sel });
          }}
        />
      )}

      {itemsPickerFor && (() => {
        const { placementId, slotId } = itemsPickerFor;
        const slotType = slotById.get(slotId)?.type as 'Group' | 'Selection';
        return (
          <ItemsPickerModal
            open
            onClose={() => setItemsPickerFor(null)}
            slotType={slotType}
            placementId={placementId}
            selected={targets[placementId]?.[slotId]?.items ?? []}
            onSave={(items) => updateSlotEntry(placementId, slotId, { items })}
          />
        );
      })()}
    </div>
  );
}


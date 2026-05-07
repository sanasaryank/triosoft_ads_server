import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/FormFields';
import { StatusBadge } from '../../components/ui/Badge';
import { SchedulePickerModal } from '../../components/ui/SchedulePickerModal';
import { SlotPickerModal } from '../../components/ui/SlotPickerModal';
import { ItemsPickerModal } from '../../components/ui/ItemsPickerModal';
import { LoadingSpinner } from '../../components/ui/States';
import { useLang } from '../../providers/LanguageProvider';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import { getPlacementCampaigns, updatePlacementCampaigns } from '../../api/placementsService';
import { getSchedules } from '../../api/scheduleService';
import { getSlots } from '../../api/slotService';
import { getPlatforms } from '../../api/platformService';
import { getAdvertisers } from '../../api/advertiserService';
import { getCampaigns } from '../../api/campaignService';
import type {
  Campaign,
  PlacementCampaignsResponse,
  PlacementCampaignsPutPayload,
  PlacementCampaignSlotEntry,
} from '../../types/models';

export interface PlacementCampaignsModalProps {
  open: boolean;
  onClose: () => void;
  placementId: string;
  placementName: string;
}

// ── Add Campaign Modal ────────────────────────────────────────────────────────

interface AddCampaignModalProps {
  open: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  usedIds: string[];
  onSave: (ids: string[]) => void;
}

function AddCampaignModal({ open, onClose, campaigns, usedIds, onSave }: AddCampaignModalProps) {
  const { t, getLocalized } = useLang();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [local, setLocal] = useState<string[]>([]);

  useEffect(() => {
    if (open) { setSearch(''); setStatusFilter('all'); setLocal([]); }
  }, [open]);

  const q = search.toLowerCase();
  const available = campaigns.filter((c) => {
    if (usedIds.includes(c.id)) return false;
    if (statusFilter === 'active' && c.isBlocked) return false;
    if (statusFilter === 'blocked' && !c.isBlocked) return false;
    if (q !== '' && !getLocalized(c.name).toLowerCase().includes(q)) return false;
    return true;
  });

  const toggle = (id: string) =>
    setLocal((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('campaigns.addCampaign')}
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
          placeholder={t('campaigns.searchCampaigns')}
          autoFocus
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
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
            available.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-primary-50"
              >
                <Checkbox checked={local.includes(c.id)} onChange={() => toggle(c.id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{getLocalized(c.name)}</span>
                    {c.isBlocked && (
                      <span className="flex-shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                        {t('common.blocked')}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Calendar badge (schedules count) ─────────────────────────────────────────

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

// ── Items badge (group/selection count) ───────────────────────────────────────

function ItemsBadge({ count, onClick, slotType }: { count: number; onClick: () => void; slotType: string }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      title={slotType === 'Group' ? t('campaigns.groups') : slotType === 'Selection' ? t('campaigns.selections') : t('campaigns.items')}
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

// ── Remove button ─────────────────────────────────────────────────────────────

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

// ── Main modal ────────────────────────────────────────────────────────────────

export function PlacementCampaignsModal({
  open,
  onClose,
  placementId,
  placementName,
}: PlacementCampaignsModalProps) {
  const { t, getLocalized } = useLang();

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchCampaignsFn = useCallback(
    () => getPlacementCampaigns(placementId),
    [placementId],
  );
  const { data: campaignsData, loading: loadingCampaigns } = useApi(fetchCampaignsFn);

  const fetchSchedulesFn   = useCallback(() => getSchedules(),   []);
  const fetchSlotsFn        = useCallback(() => getSlots(),       []);
  const fetchPlatformsFn    = useCallback(() => getPlatforms(),   []);
  const fetchAdvertisersFn  = useCallback(() => getAdvertisers(), []);
  const fetchAllCampaignsFn = useCallback(() => getCampaigns(),   []);

  const { data: schedulesData   } = useApi(fetchSchedulesFn);
  const { data: slotsData       } = useApi(fetchSlotsFn);
  const { data: platformsData   } = useApi(fetchPlatformsFn);
  const { data: advertisersData } = useApi(fetchAdvertisersFn);
  const { data: allCampaignsData} = useApi(fetchAllCampaignsFn);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editState, setEditState] = useState<PlacementCampaignsPutPayload>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!campaignsData) return;
    const state: PlacementCampaignsPutPayload = {};
    const collapseInit: Record<string, boolean> = {};
    for (const advEntry of Object.values(campaignsData as PlacementCampaignsResponse)) {
      for (const [campId, campEntry] of Object.entries(advEntry.campaigns)) {
        state[campId] = {
          slots: Object.fromEntries(
            Object.entries(campEntry.slots).map(([slotId, slotEntry]) => [
              slotId,
              { schedules: [...slotEntry.schedules], items: [...slotEntry.items] },
            ]),
          ),
          hash: campEntry.hash,
        };
        collapseInit[campId] = true;
      }
    }
    setEditState(state);
    setCollapsed(collapseInit);
  }, [campaignsData]);

  // ── Derived maps ──────────────────────────────────────────────────────────
  const slotById        = useMemo(() => new Map(slotsData?.map((s) => [s.id, s]) ?? []),          [slotsData]);
  const advertiserById  = useMemo(() => new Map(advertisersData?.map((a) => [a.id, a]) ?? []),     [advertisersData]);
  const campaignById    = useMemo(() => new Map(allCampaignsData?.map((c) => [c.id, c]) ?? []),    [allCampaignsData]);
  const schedules       = useMemo(() => schedulesData ?? [],                                        [schedulesData]);
  const platforms       = useMemo(() => platformsData ?? [],                                        [platformsData]);

  const slotsByPlatform = useMemo(() => {
    const map = new Map<string, NonNullable<typeof slotsData>[number][]>();
    for (const slot of slotsData ?? []) {
      if (!map.has(slot.platformId)) map.set(slot.platformId, []);
      map.get(slot.platformId)!.push(slot);
    }
    return map;
  }, [slotsData]);

  // ── Grouped display list (campaigns from data + newly added) ─────────────────
  const displayGroups = useMemo(() => {
    const groups = new Map<string, string[]>(); // advertiserId → campaignIds
    if (campaignsData) {
      for (const [advId, advEntry] of Object.entries(campaignsData as PlacementCampaignsResponse)) {
        if (!groups.has(advId)) groups.set(advId, []);
        for (const campId of Object.keys(advEntry.campaigns)) {
          groups.get(advId)!.push(campId);
        }
      }
    }
    // Newly added (in editState but not in campaignsData)
    for (const campId of Object.keys(editState)) {
      const isInData =
        campaignsData &&
        Object.values(campaignsData as PlacementCampaignsResponse).some(
          (adv) => adv.campaigns[campId] !== undefined,
        );
      if (!isInData) {
        const advId = campaignById.get(campId)?.advertiserId ?? '__new__';
        if (!groups.has(advId)) groups.set(advId, []);
        groups.get(advId)!.push(campId);
      }
    }
    return [...groups.entries()].map(([advertiserId, campaignIds]) => ({ advertiserId, campaignIds }));
  }, [campaignsData, editState, campaignById]);

  // ── Pickers state ─────────────────────────────────────────────────────────
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);
  const [slotPickerFor, setSlotPickerFor]     = useState<string | null>(null); // campaignId
  const [schedPickerFor, setSchedPickerFor]   = useState<{ campaignId: string; slotId: string } | null>(null);
  const [itemsPickerFor, setItemsPickerFor]   = useState<{ campaignId: string; slotId: string } | null>(null);
  const [confirmRemoveCampaign, setConfirmRemoveCampaign] = useState<string | null>(null);
  const [confirmRemoveSlot, setConfirmRemoveSlot] = useState<{ campaignId: string; slotId: string } | null>(null);

  // ── Save mutation ─────────────────────────────────────────────────────────
  const saveFn = useCallback(
    (payload: PlacementCampaignsPutPayload) => updatePlacementCampaigns(placementId, payload),
    [placementId],
  );
  const { execute: save, loading: saving } = useMutation(saveFn, { onSuccess: () => onClose() });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const addCampaigns = (ids: string[]) => {
    setEditState((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id]) next[id] = { slots: {}, hash: '' };
      }
      return next;
    });
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = false;
      return next;
    });
  };

  const addSlots = (campaignId: string, slotIds: string[]) => {
    setEditState((prev) => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        slots: {
          ...prev[campaignId]?.slots,
          ...Object.fromEntries(slotIds.map((slotId) => [slotId, { schedules: [], items: [] }])),
        },
      },
    }));
    setSlotPickerFor(null);
  };

  const updateSlot = (
    campaignId: string,
    slotId: string,
    patch: Partial<PlacementCampaignSlotEntry>,
  ) => {
    setEditState((prev) => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        slots: {
          ...prev[campaignId]?.slots,
          [slotId]: { ...prev[campaignId]?.slots[slotId], ...patch },
        },
      },
    }));
  };

  const removeCampaign = (campaignId: string) => {
    setEditState((prev) => {
      const next = { ...prev };
      delete next[campaignId];
      return next;
    });
    setCollapsed((prev) => { const c = { ...prev }; delete c[campaignId]; return c; });
  };

  const removeSlotFromCampaign = (campaignId: string, slotId: string) => {
    setEditState((prev) => {
      const slots = { ...prev[campaignId]?.slots };
      delete slots[slotId];
      return { ...prev, [campaignId]: { ...prev[campaignId], slots } };
    });
  };

  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString();

  const hasData = Object.keys(editState).length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`${t('common.showCampaigns')}: ${placementName}`}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
            <Button onClick={() => save(editState)} loading={saving} disabled={saving || !hasData}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        {loadingCampaigns ? (
          <LoadingSpinner message={t('common.loading')} />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {hasData
                  ? `${Object.keys(editState).length} ${t('campaigns.campaigns')}`
                  : t('campaigns.noCampaigns')}
              </span>
              <Button type="button" size="sm" onClick={() => setAddCampaignOpen(true)}>
                + {t('campaigns.addCampaign')}
              </Button>
            </div>

            {/* Advertiser / campaign blocks */}
            {displayGroups.map(({ advertiserId, campaignIds }) => {
              const advEntry = (campaignsData as PlacementCampaignsResponse | undefined)?.[advertiserId];
              const advertiser = advertiserById.get(advertiserId);

              return (
                <div key={advertiserId} className="rounded-lg border border-gray-200 text-sm">
                  {/* Advertiser header */}
                  <div className="flex items-center gap-2 rounded-t-lg bg-gray-100 px-3 py-2">
                    <span className="font-semibold text-gray-800">
                      {advertiser ? getLocalized(advertiser.name) : advertiserId}
                    </span>
                    {advEntry?.isBlocked && (
                      <StatusBadge
                        isBlocked
                        activeLabel={t('common.active')}
                        blockedLabel={t('common.blocked')}
                      />
                    )}
                  </div>

                  {/* Campaigns */}
                  <div className="divide-y divide-gray-100">
                    {campaignIds.map((campaignId) => {
                      const campEntry = advEntry?.campaigns[campaignId];
                      const campaign  = campaignById.get(campaignId);
                      const isCollapsed = !!collapsed[campaignId];
                      const editCamp  = editState[campaignId];
                      const slotIds   = Object.keys(editCamp?.slots ?? {});

                      return (
                        <div key={campaignId}>
                          {/* Campaign header */}
                          <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => toggleCollapsed(campaignId)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <svg
                                className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                viewBox="0 0 6 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-gray-800">
                                  {campaign ? getLocalized(campaign.name) : campaignId}
                                </span>
                                {campEntry && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    {formatDate(campEntry.startDate)} – {formatDate(campEntry.endDate)}
                                  </span>
                                )}
                              </div>
                              {isCollapsed && slotIds.length > 0 && (
                                <span className="ml-1 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">
                                  {slotIds.length}
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2">
                              {!isCollapsed && (
                                <button
                                  type="button"
                                  onClick={() => setSlotPickerFor(campaignId)}
                                  className="flex items-center gap-1 rounded border border-dashed border-primary-300 px-2 py-1 text-xs text-primary-500 transition-colors hover:border-primary-500 hover:bg-primary-50"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  {t('campaigns.addSlot')}
                                </button>
                              )}
                              {campEntry?.isBlocked && (
                                <StatusBadge
                                  isBlocked
                                  activeLabel={t('common.active')}
                                  blockedLabel={t('common.blocked')}
                                />
                              )}
                              <RemoveBtn onClick={() => setConfirmRemoveCampaign(campaignId)} />
                            </div>
                          </div>

                          {/* Slot rows */}
                          {!isCollapsed && slotIds.length > 0 && (
                            <div className="divide-y divide-gray-50">
                              {slotIds.map((slotId) => {
                                const slot = slotById.get(slotId);
                                const slotEdit = editCamp?.slots[slotId] ?? { schedules: [], items: [] };
                                const isItemsSlot = slot && (slot.type === 'Group' || slot.type === 'Selection' || slot.type === 'Item');

                                return (
                                  <div key={slotId} className="flex items-center gap-3 px-3 py-2 pl-8">
                                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                      <svg
                                        className="h-3 w-3 flex-shrink-0 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                      </svg>
                                      <span className="truncate text-gray-700">
                                        {slot ? getLocalized(slot.name) : slotId}
                                      </span>
                                      {slot && (
                                        <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                                          {slot.type}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <CalendarBadge
                                        count={slotEdit.schedules.length}
                                        onClick={() => setSchedPickerFor({ campaignId, slotId })}
                                      />
                                      {isItemsSlot && (
                                        <ItemsBadge
                                          count={slotEdit.items.length}
                                          onClick={() => setItemsPickerFor({ campaignId, slotId })}
                                          slotType={slot.type}
                                        />
                                      )}
                                      <RemoveBtn onClick={() => setConfirmRemoveSlot({ campaignId, slotId })} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {!isCollapsed && slotIds.length === 0 && (
                            <p className="py-2 pl-8 text-xs italic text-gray-400">{t('campaigns.noSlots')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Add Campaign picker */}
      <AddCampaignModal
        open={addCampaignOpen}
        onClose={() => setAddCampaignOpen(false)}
        campaigns={allCampaignsData ?? []}
        usedIds={Object.keys(editState)}
        onSave={addCampaigns}
      />

      {/* Add Slot picker */}
      {slotPickerFor && (
        <SlotPickerModal
          open
          onClose={() => setSlotPickerFor(null)}
          slotsByPlatform={slotsByPlatform}
          platforms={platforms}
          usedSlotIds={Object.keys(editState[slotPickerFor]?.slots ?? {})}
          onSave={(slotIds) => addSlots(slotPickerFor, slotIds)}
        />
      )}

      {/* Schedule picker */}
      {schedPickerFor && (
        <SchedulePickerModal
          open
          onClose={() => setSchedPickerFor(null)}
          schedules={schedules}
          selected={editState[schedPickerFor.campaignId]?.slots[schedPickerFor.slotId]?.schedules ?? []}
          onSave={(sel) => {
            updateSlot(schedPickerFor.campaignId, schedPickerFor.slotId, { schedules: sel });
            setSchedPickerFor(null);
          }}
        />
      )}

      {/* Items picker */}
      {itemsPickerFor && (() => {
        const slot = slotById.get(itemsPickerFor.slotId);
        if (!slot || (slot.type !== 'Group' && slot.type !== 'Selection' && slot.type !== 'Item')) return null;
        return (
          <ItemsPickerModal
            open
            onClose={() => setItemsPickerFor(null)}
            slotType={slot.type}
            placementId={placementId}
            selected={editState[itemsPickerFor.campaignId]?.slots[itemsPickerFor.slotId]?.items ?? []}
            onSave={(items) => {
              updateSlot(itemsPickerFor.campaignId, itemsPickerFor.slotId, { items });
              setItemsPickerFor(null);
            }}
          />
        );
      })()}

      <ConfirmDialog
        open={confirmRemoveCampaign !== null}
        title={t('common.removeCampaignTitle')}
        message={t('common.confirmRemove')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => { removeCampaign(confirmRemoveCampaign!); setConfirmRemoveCampaign(null); }}
        onCancel={() => setConfirmRemoveCampaign(null)}
      />

      <ConfirmDialog
        open={confirmRemoveSlot !== null}
        title={t('common.removeSlotTitle')}
        message={t('common.confirmRemove')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          removeSlotFromCampaign(confirmRemoveSlot!.campaignId, confirmRemoveSlot!.slotId);
          setConfirmRemoveSlot(null);
        }}
        onCancel={() => setConfirmRemoveSlot(null)}
      />
    </>
  );
}

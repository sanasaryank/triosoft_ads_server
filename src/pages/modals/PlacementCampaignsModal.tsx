import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { SchedulePickerModal } from '../../components/ui/SchedulePickerModal';
import { ItemsPickerModal } from '../../components/ui/ItemsPickerModal';
import { LoadingSpinner, EmptyState } from '../../components/ui/States';
import { useLang } from '../../providers/LanguageProvider';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import { getPlacementCampaigns, updatePlacementCampaigns } from '../../api/placementsService';
import { getSchedules } from '../../api/scheduleService';
import { getSlots } from '../../api/slotService';
import { getAdvertisers } from '../../api/advertiserService';
import { getCampaigns } from '../../api/campaignService';
import type {
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

  const fetchSchedulesFn = useCallback(() => getSchedules(), []);
  const { data: schedulesData } = useApi(fetchSchedulesFn);

  const fetchSlotsFn = useCallback(() => getSlots(), []);
  const { data: slotsData } = useApi(fetchSlotsFn);

  const fetchAdvertisersFn = useCallback(() => getAdvertisers(), []);
  const { data: advertisersData } = useApi(fetchAdvertisersFn);

  const fetchAllCampaignsFn = useCallback(() => getCampaigns(), []);
  const { data: allCampaignsData } = useApi(fetchAllCampaignsFn);

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
  const slotById      = useMemo(() => new Map(slotsData?.map((s) => [s.id, s]) ?? []),        [slotsData]);
  const advertiserById = useMemo(() => new Map(advertisersData?.map((a) => [a.id, a]) ?? []), [advertisersData]);
  const campaignById   = useMemo(() => new Map(allCampaignsData?.map((c) => [c.id, c]) ?? []),[allCampaignsData]);
  const schedules      = useMemo(() => schedulesData ?? [],                                     [schedulesData]);

  // ── Pickers state ─────────────────────────────────────────────────────────
  const [schedPickerFor, setSchedPickerFor] = useState<{ campaignId: string; slotId: string } | null>(null);
  const [itemsPickerFor, setItemsPickerFor] = useState<{ campaignId: string; slotId: string } | null>(null);
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

  const advertiserIds = campaignsData ? Object.keys(campaignsData) : [];
  const hasData = advertiserIds.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
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
            <Button
              onClick={() => save(editState)}
              loading={saving}
              disabled={saving || !hasData}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        {loadingCampaigns ? (
          <LoadingSpinner message={t('common.loading')} />
        ) : !hasData ? (
          <EmptyState message={t('common.empty')} />
        ) : (
          <div className="flex flex-col gap-3">
            {advertiserIds.map((advertiserId) => {
              const advEntry = (campaignsData as PlacementCampaignsResponse)[advertiserId];
              const advertiser = advertiserById.get(advertiserId);
              const campaignIds = Object.keys(advEntry.campaigns);

              return (
                <div key={advertiserId} className="rounded-lg border border-gray-200 text-sm">
                  {/* Advertiser header */}
                  <div className="flex items-center gap-2 rounded-t-lg bg-gray-100 px-3 py-2">
                    <span className="font-semibold text-gray-800">
                      {advertiser ? getLocalized(advertiser.name) : advertiserId}
                    </span>
                    {advEntry.isBlocked && (
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
                      const campEntry = advEntry.campaigns[campaignId];
                      const campaign = campaignById.get(campaignId);
                      const isCollapsed = !!collapsed[campaignId];
                      const slotIds = Object.keys(campEntry.slots);
                      const editCamp = editState[campaignId];

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
                                <span className="ml-2 text-xs text-gray-400">
                                  {formatDate(campEntry.startDate)} – {formatDate(campEntry.endDate)}
                                </span>
                              </div>
                              {isCollapsed && slotIds.length > 0 && (
                                <span className="ml-1 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">
                                  {slotIds.length}
                                </span>
                              )}
                            </button>
                            {campEntry.isBlocked && (
                              <StatusBadge
                                isBlocked
                                activeLabel={t('common.active')}
                                blockedLabel={t('common.blocked')}
                              />
                            )}
                            <RemoveBtn onClick={() => setConfirmRemoveCampaign(campaignId)} />
                          </div>

                          {/* Slot rows */}
                          {!isCollapsed && slotIds.length > 0 && (
                            <div className="divide-y divide-gray-50">
                              {slotIds.map((slotId) => {
                                const slot = slotById.get(slotId);
                                const slotEdit = editCamp?.slots[slotId] ?? { schedules: [], items: [] };
                                const isItemsSlot = slot && (slot.type === 'Group' || slot.type === 'Selection');

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
                            <p className="py-2 pl-8 text-xs text-gray-400">{t('campaigns.noSlots')}</p>
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
        if (!slot || (slot.type !== 'Group' && slot.type !== 'Selection')) return null;
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
        onConfirm={() => { removeSlotFromCampaign(confirmRemoveSlot!.campaignId, confirmRemoveSlot!.slotId); setConfirmRemoveSlot(null); }}
        onCancel={() => setConfirmRemoveSlot(null)}
      />
    </>
  );
}

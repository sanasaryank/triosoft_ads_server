import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Checkbox } from './FormFields';
import { useLang } from '../../providers/LanguageProvider';
import { getGroups, getSelections } from '../../api/itemsService';
import type { ItemGroup, DishItem, DishRef, SlotType } from '../../types/models';

export interface ItemsPickerModalProps {
  open: boolean;
  onClose: () => void;
  slotType: Extract<SlotType, 'Group' | 'Selection' | 'Item'>;
  placementId: string;
  selected: string[];
  onSave: (ids: string[]) => void;
}

// ── Dish card ─────────────────────────────────────────────────────────────────

function DishCard({ dish, showGroup, selectable, isSelected, onSelect }: {
  dish: DishItem;
  showGroup?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const { t, getLocalized } = useLang();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`flex items-start gap-3 py-2 pr-3 ${
        selectable
          ? `cursor-pointer pl-3 hover:bg-primary-50 transition-colors${isSelected ? ' bg-primary-50' : ''}`
          : 'pl-7'
      }`}
      onClick={selectable ? onSelect : undefined}
    >
      {selectable && (
        <Checkbox
          checked={!!isSelected}
          onChange={() => onSelect?.()}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      )}
      {/* Thumbnail */}
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-gray-100 bg-gray-50">
        {dish.image && !imgError ? (
          <img
            src={dish.image}
            alt={getLocalized(dish.name)}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-800">{getLocalized(dish.name)}</span>
          {dish.isOver18 && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">18+</span>
          )}
          {(dish.isMenuBlocked || dish.isGroupBlocked || dish.isDishBlocked) && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">{t('common.blocked')}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
          <span>{getLocalized(dish.menu.name)}</span>
          {showGroup && (
            <>
              <span className="text-gray-200">·</span>
              <span>{getLocalized(dish.group.name)}</span>
            </>
          )}
        </div>
      </div>

      {/* Price */}
      <span className="flex-shrink-0 text-sm font-medium text-gray-700">
        {dish.price.toFixed(2)}
      </span>
    </div>
  );
}

// ── Group/Selection row ───────────────────────────────────────────────────────

interface ItemGroupRowProps {
  group: ItemGroup;
  isSelected: boolean;
  onToggle: () => void;
  slotType: 'Group' | 'Selection' | 'Item';
  forceExpand?: boolean;
  highlightQuery?: string;
  singleSelect?: boolean;
  selectedIds?: string[];
  onSelectDish?: (dishId: string) => void;
}

function ItemGroupRow({ group, isSelected, onToggle, slotType, forceExpand, singleSelect, selectedIds, onSelectDish }: ItemGroupRowProps) {
  const { getLocalized } = useLang();
  const [expanded, setExpanded] = useState(false);
  const isOpen = forceExpand || expanded || !!singleSelect;
  const name = getLocalized(group.name);

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
        <Checkbox
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <svg
            className={`h-3 w-3 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5"
          >
            <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="truncate text-sm font-medium text-gray-800">{name}</span>
          <span className="ml-auto flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
            {group.dishes.length}
          </span>
        </button>
      </div>

      {/* Dish list */}
      {isOpen && (
        <div className="divide-y divide-gray-50 bg-gray-50/50">
          {group.dishes.length === 0 ? (
            <p className="py-2 pl-7 text-xs text-gray-400 italic">—</p>
          ) : (
            group.dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                showGroup
                selectable={singleSelect}
                isSelected={selectedIds?.includes(dish.id)}
                onSelect={() => onSelectDish?.(dish.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Menu filter panel ─────────────────────────────────────────────────────────

function MenuFilterPanel({
  menus,
  active,
  onToggle,
  hideMenuBlocked,
  hideGroupBlocked,
  hideDishBlocked,
  onToggleHideMenuBlocked,
  onToggleHideGroupBlocked,
  onToggleHideDishBlocked,
}: {
  menus: DishRef[];
  active: string[];
  onToggle: (id: string) => void;
  hideMenuBlocked: boolean;
  hideGroupBlocked: boolean;
  hideDishBlocked: boolean;
  onToggleHideMenuBlocked: () => void;
  onToggleHideGroupBlocked: () => void;
  onToggleHideDishBlocked: () => void;
}) {
  const { t, getLocalized } = useLang();
  return (
    <div className="rounded-t border border-b-0 border-gray-200 bg-gray-50 px-3 py-2 space-y-2">
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('campaigns.menu')}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {menus.map((menu) => (
            <label key={menu.id} className="flex cursor-pointer items-center gap-1.5">
              <Checkbox
                checked={active.includes(menu.id)}
                onChange={() => onToggle(menu.id)}
              />
              <span className="text-xs text-gray-700">{getLocalized(menu.name)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-200 pt-2">
        <label className="flex cursor-pointer items-center gap-1.5">
          <Checkbox checked={hideMenuBlocked} onChange={onToggleHideMenuBlocked} />
          <span className="text-xs text-gray-600">{t('campaigns.hideMenuBlocked')}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <Checkbox checked={hideGroupBlocked} onChange={onToggleHideGroupBlocked} />
          <span className="text-xs text-gray-600">{t('campaigns.hideGroupBlocked')}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <Checkbox checked={hideDishBlocked} onChange={onToggleHideDishBlocked} />
          <span className="text-xs text-gray-600">{t('campaigns.hideDishBlocked')}</span>
        </label>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function ItemsPickerModal({
  open,
  onClose,
  slotType,
  placementId,
  selected,
  onSave,
}: ItemsPickerModalProps) {
  const { t, getLocalized } = useLang();
  const [groups, setGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<string[]>(selected);
  const [menuFilter, setMenuFilter] = useState<string[]>([]);
  const [dishSearch, setDishSearch] = useState('');
  const [hideMenuBlocked, setHideMenuBlocked] = useState(false);
  const [hideGroupBlocked, setHideGroupBlocked] = useState(false);
  const [hideDishBlocked, setHideDishBlocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLocal(selected);
    setMenuFilter([]);
    setDishSearch('');
    setHideMenuBlocked(false);
    setHideGroupBlocked(false);
    setHideDishBlocked(false);
    setLoading(true);
    const fetcher = slotType === 'Selection' ? getSelections : getGroups;
    fetcher(placementId)
      .then((data) => {
        setGroups(data);
        const seen = new Set<string>();
        for (const g of data) for (const d of g.dishes) seen.add(d.menu.id);
        setMenuFilter(Array.from(seen));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [open, slotType, placementId]);

  const toggle = (id: string) => {
    if (slotType === 'Item') {
      setLocal((prev) => (prev.includes(id) ? [] : [id]));
    } else {
      setLocal((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  const toggleMenu = (id: string) =>
    setMenuFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Distinct menus across all dishes
  const allMenus = useMemo(() => {
    const seen = new Map<string, DishRef>();
    for (const g of groups) {
      for (const d of g.dishes) {
        if (!seen.has(d.menu.id)) seen.set(d.menu.id, d.menu);
      }
    }
    return Array.from(seen.values());
  }, [groups]);

  // Apply all filters
  const visibleGroups = useMemo(() => {
    if (menuFilter.length === 0) return [];
    const q = dishSearch.trim().toLowerCase();
    return groups
      .filter((g) => !(hideGroupBlocked && g.dishes.some(() => false)))
      .map((g) => ({
        ...g,
        dishes: g.dishes.filter((d) => {
          if (!menuFilter.includes(d.menu.id)) return false;
          if (hideMenuBlocked && d.isMenuBlocked) return false;
          if (hideGroupBlocked && d.isGroupBlocked) return false;
          if (hideDishBlocked && d.isDishBlocked) return false;
          if (q && !getLocalized(d.name).toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
      .filter((g) => g.dishes.length > 0);
  }, [groups, menuFilter, hideMenuBlocked, hideGroupBlocked, hideDishBlocked, dishSearch]);

  const title = slotType === 'Group'
    ? t('campaigns.groups')
    : slotType === 'Selection'
      ? t('campaigns.selections')
      : t('campaigns.items');

  const showFilter = !loading && allMenus.length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => { onSave(local); onClose(); }}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex flex-col" style={{ minHeight: 120 }}>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('common.empty')}</p>
        ) : (
          <>
            {showFilter && (
              <MenuFilterPanel
                menus={allMenus}
                active={menuFilter}
                onToggle={toggleMenu}
                hideMenuBlocked={hideMenuBlocked}
                hideGroupBlocked={hideGroupBlocked}
                hideDishBlocked={hideDishBlocked}
                onToggleHideMenuBlocked={() => setHideMenuBlocked((v) => !v)}
                onToggleHideGroupBlocked={() => setHideGroupBlocked((v) => !v)}
                onToggleHideDishBlocked={() => setHideDishBlocked((v) => !v)}
              />
            )}
            <div className="border-x border-gray-200 px-3 py-2">
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder={t('campaigns.searchDishes')}
                className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className={`max-h-[380px] overflow-y-auto border border-gray-200 ${showFilter ? '' : 'rounded-t'} rounded-b`}>
              {/* Selection summary */}
              {local.length > 0 && (
                <div className="flex items-center justify-between border-b border-gray-100 bg-primary-50 px-3 py-1.5 text-xs text-primary-700">
                  <span>
                    {slotType === 'Item'
                      ? `1 ${t('campaigns.items')}`
                      : `${local.length} ${slotType === 'Group' ? t('campaigns.groups') : t('campaigns.selections')}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocal([])}
                    className="text-primary-500 hover:text-primary-700 underline"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
              {visibleGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('common.empty')}</p>
              ) : (
                visibleGroups.map((group) => (
                  <ItemGroupRow
                    key={group.id}
                    group={group}
                    isSelected={local.includes(group.id)}
                    onToggle={() => toggle(group.id)}
                    slotType={slotType}
                    forceExpand={dishSearch.trim().length > 0}
                    singleSelect={slotType === 'Item'}
                    selectedIds={local}
                    onSelectDish={(dishId) => toggle(dishId)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Checkbox } from './FormFields';
import { useLang } from '../../providers/LanguageProvider';
import type { Slot, Platform } from '../../types/models';

export interface SlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  slotsByPlatform: Map<string, Slot[]>;
  platforms: Platform[];
  usedSlotIds: string[];
  onSave: (slotIds: string[]) => void;
}

export function SlotPickerModal({
  open,
  onClose,
  slotsByPlatform,
  platforms,
  usedSlotIds,
  onSave,
}: SlotPickerModalProps) {
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
    setLocal((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('campaigns.addSlot')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={local.length === 0}
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            {t('common.save')}
            {local.length > 0 ? ` (${local.length})` : ''}
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
                  viewBox="0 0 6 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M1 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen &&
                pSlots.map((slot) => {
                  const alreadyAdded = usedSlotIds.includes(slot.id);
                  const isChecked = local.includes(slot.id);
                  return (
                    <label
                      key={slot.id}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                        alreadyAdded
                          ? 'cursor-default opacity-40'
                          : 'cursor-pointer hover:bg-primary-50'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={() => !alreadyAdded && toggle(slot.id)}
                        disabled={alreadyAdded}
                      />
                      <span className="flex-1 text-left text-gray-700">
                        {getLocalized(slot.name)}
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {slot.type}
                      </span>
                      {alreadyAdded && (
                        <svg
                          className="h-3.5 w-3.5 text-primary-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
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

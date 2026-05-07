import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Checkbox } from './FormFields';
import { useLang } from '../../providers/LanguageProvider';
import type { Schedule } from '../../types/models';

export interface SchedulePickerModalProps {
  open: boolean;
  onClose: () => void;
  schedules: Schedule[];
  selected: string[];
  onSave: (selected: string[]) => void;
}

export function SchedulePickerModal({ open, onClose, schedules, selected, onSave }: SchedulePickerModalProps) {
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

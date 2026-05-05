import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Checkbox } from '../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../components/LocalizedInputGroup';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import {
  getScheduleById,
  createSchedule,
  updateSchedule,
} from '../../api/scheduleService';
import { normalizeError } from '../../api/client';
import type { Schedule, SchedulePayload, WeekDay } from '../../types/models';
import type { Translation } from '../../types/common';

const DAYS: WeekDay['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyName: Translation = { ARM: '', ENG: '', RUS: '' };

const defaultWeekSchedule: WeekDay[] = DAYS.map((day) => ({
  day,
  enabled: false,
  start: 8,
  end: 20,
}));

interface ScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId?: string; // if present → edit mode
}

export function ScheduleFormModal({ open, onClose, onSuccess, scheduleId }: ScheduleFormModalProps) {
  const { t } = useLang();
  const { pushError } = useErrorModal();

  const [name, setName] = useState<Translation>(emptyName);
  const [color, setColor] = useState('#6366f1');
  const [weekSchedule, setWeekSchedule] = useState<WeekDay[]>(defaultWeekSchedule);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!scheduleId;

  // Load data when opening in edit mode
  React.useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      // Reset for create
      setName(emptyName);
      setColor('#6366f1');
      setWeekSchedule(defaultWeekSchedule);
      setHash(undefined);
      setErrors({});
      return;
    }
    setFetchLoading(true);
    getScheduleById(scheduleId!)
      .then((s: Schedule) => {
        setName(s.name);
        setColor(s.color);
        setWeekSchedule(s.weekSchedule);
        setHash(s.hash);
      })
      .catch((err: unknown) => {
        pushError(normalizeError(err));
        onClose();
      })
      .finally(() => setFetchLoading(false));
  }, [open, scheduleId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.ENG.trim()) errs['name.ENG'] = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: SchedulePayload = { name, color, weekSchedule, ...(hash ? { hash } : {}) };
      if (isEdit) {
        await updateSchedule(scheduleId!, payload);
      } else {
        await createSchedule(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      pushError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (index: number, field: keyof WeekDay, value: unknown) => {
    setWeekSchedule((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('schedules.editTitle') : t('schedules.createTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button type="submit" form="schedule-form" loading={loading || fetchLoading}>{t('common.save')}</Button>
        </>
      }
    >
      {fetchLoading ? (
        <div className="flex justify-center py-8">
          <svg className="h-8 w-8 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <form id="schedule-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LocalizedInputGroup label={t('common.name')} value={name} onChange={setName} required />

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">{t('common.color')}</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-gray-300"
            />
            <span className="text-sm text-gray-500">{color}</span>
          </div>

          {/* Week schedule */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">{t('schedules.weekSchedule')}</span>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="py-1 pr-3 text-left">{t('schedules.day')}</th>
                    <th className="py-1 pr-3 text-left">{t('schedules.enabled')}</th>
                    <th className="py-1 pr-3 text-left">{t('schedules.start')}</th>
                    <th className="py-1 text-left">{t('schedules.end')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {weekSchedule.map((day, i) => (
                    <tr key={day.day}>
                      <td className="py-1 pr-3 font-medium text-gray-700">{day.day}</td>
                      <td className="py-1 pr-3">
                        <Checkbox
                          checked={day.enabled}
                          onChange={(e) => updateDay(i, 'enabled', e.target.checked)}
                        />
                      </td>
                      <td className="py-1 pr-3">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={day.start}
                          disabled={!day.enabled}
                          onChange={(e) => updateDay(i, 'start', parseInt(e.target.value))}
                          className="w-16 rounded border border-gray-300 px-2 py-0.5 text-sm disabled:bg-gray-100"
                        />
                      </td>
                      <td className="py-1">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={day.end}
                          disabled={!day.enabled}
                          onChange={(e) => updateDay(i, 'end', parseInt(e.target.value))}
                          className="w-16 rounded border border-gray-300 px-2 py-0.5 text-sm disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

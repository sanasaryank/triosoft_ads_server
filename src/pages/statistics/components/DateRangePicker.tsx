import React from 'react';
import { useLang } from '../../../providers/LanguageProvider';
import { toDatetimeLocal, todayRange, yesterdayRange, last7DaysRange } from '../utils';

interface DateRangePickerProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
  const { t } = useLang();
  const nowStr = toDatetimeLocal(new Date());

  const applyPreset = (preset: 'today' | 'yesterday' | 'last7') => {
    const r =
      preset === 'today'     ? todayRange() :
      preset === 'yesterday' ? yesterdayRange() :
                               last7DaysRange();
    onChange(r.start, r.end);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">{t('stats.start')}</label>
        <input
          type="datetime-local"
          value={start}
          max={nowStr}
          onChange={(e) => onChange(e.target.value, end)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">{t('stats.end')}</label>
        <input
          type="datetime-local"
          value={end}
          max={nowStr}
          onChange={(e) => onChange(start, e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => applyPreset('today')}
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t('stats.today')}
        </button>
        <button
          type="button"
          onClick={() => applyPreset('yesterday')}
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t('stats.yesterday')}
        </button>
        <button
          type="button"
          onClick={() => applyPreset('last7')}
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t('stats.last7days')}
        </button>
      </div>
    </div>
  );
}

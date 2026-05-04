import React from 'react';
import { Select } from '../../../components/ui/FormFields';
import { useLang } from '../../../providers/LanguageProvider';
import type { FrequencyCap } from '../../../types/models';

interface CampaignFrequencyTabProps {
  frequencyCapStrategy: string;
  setFrequencyCapStrategy: (v: string) => void;
  frequencyCap: FrequencyCap;
  updateFCField: (
    scope: 'per_user' | 'per_session',
    type: 'impressions' | 'clicks',
    field: 'count' | 'window_sec',
    value: number,
  ) => void;
}

export function CampaignFrequencyTab({
  frequencyCapStrategy, setFrequencyCapStrategy,
  frequencyCap, updateFCField,
}: CampaignFrequencyTabProps) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-4">
      <Select label={t('campaigns.frequencyCapStrategy')} value={frequencyCapStrategy} onChange={(e) => setFrequencyCapStrategy(e.target.value)}>
        {['soft', 'hard'].map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <div className="rounded-md border border-gray-200 p-3">
        <span className="block text-sm font-semibold text-gray-700 mb-2">{t('campaigns.frequencyCap')}</span>
        {(['per_user', 'per_session'] as const).map((scope) => (
          <div key={scope} className="mb-3">
            <span className="block text-xs font-medium text-gray-500 mb-1 uppercase">{scope.replace('_', ' ')}</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['impressions', 'clicks'] as const).map((type) => (
                <div key={type} className="rounded bg-gray-50 p-2">
                  <span className="font-medium capitalize">{type}</span>
                  <div className="mt-1 flex gap-2">
                    <label className="flex flex-col gap-0.5 flex-1">
                      <span className="text-gray-400">Count</span>
                      <input type="number" className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                        value={frequencyCap[scope][type].count}
                        onChange={(e) => updateFCField(scope, type, 'count', parseInt(e.target.value))} />
                    </label>
                    <label className="flex flex-col gap-0.5 flex-1">
                      <span className="text-gray-400">Window (s)</span>
                      <input type="number" className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                        value={frequencyCap[scope][type].window_sec}
                        onChange={(e) => updateFCField(scope, type, 'window_sec', parseInt(e.target.value))} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Input } from './ui/FormFields';
import { useLang } from '../providers/LanguageProvider';
import type { Translation } from '../types/common';

interface LocalizedInputGroupProps {
  label: string;
  value: Translation;
  onChange: (value: Translation) => void;
  required?: boolean;
  errors?: Partial<Record<keyof Translation, string>>;
}

export function LocalizedInputGroup({ label, value, onChange, required, errors }: LocalizedInputGroupProps) {
  const { t } = useLang();

  const handleChange = (lang: keyof Translation, text: string) => {
    onChange({ ...value, [lang]: text });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}{required && <span className="ml-0.5 text-red-500">*</span>}</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input
          label={t('common.arm')}
          value={value.ARM}
          onChange={(e) => handleChange('ARM', e.target.value)}
          error={errors?.ARM}
          placeholder="Armenian..."
        />
        <Input
          label={t('common.eng')}
          value={value.ENG}
          onChange={(e) => handleChange('ENG', e.target.value)}
          error={errors?.ENG}
          placeholder="English..."
        />
        <Input
          label={t('common.rus')}
          value={value.RUS}
          onChange={(e) => handleChange('RUS', e.target.value)}
          error={errors?.RUS}
          placeholder="Russian..."
        />
      </div>
    </div>
  );
}

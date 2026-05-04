import React from 'react';
import { Input, Textarea, Select } from '../../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../../components/LocalizedInputGroup';
import { useLang } from '../../../providers/LanguageProvider';
import type { Translation } from '../../../types/common';

interface CampaignGeneralTabProps {
  name: Translation;
  setName: (v: Translation) => void;
  advertiserId: string;
  setAdvertiserId: (v: string) => void;
  advertisers: { id: string; label: string }[];
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

export function CampaignGeneralTab({
  name, setName,
  advertiserId, setAdvertiserId, advertisers,
  startDate, setStartDate,
  endDate, setEndDate,
  description, setDescription,
}: CampaignGeneralTabProps) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-4">
      <LocalizedInputGroup label={t('common.name')} value={name} onChange={setName} required />
      <Select label={`${t('campaigns.advertiser')} *`} value={advertiserId} onChange={(e) => setAdvertiserId(e.target.value)} required>
        <option value="">{t('campaigns.allAdvertisers')}</option>
        {advertisers.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('campaigns.startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label={t('campaigns.endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <Textarea label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
    </div>
  );
}

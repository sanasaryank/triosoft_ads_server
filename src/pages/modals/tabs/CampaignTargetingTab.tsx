import React from 'react';
import { Input } from '../../../components/ui/FormFields';
import { useLang } from '../../../providers/LanguageProvider';

interface CampaignTargetingTabProps {
  slotsInput: string;
  setSlotsInput: (v: string) => void;
}

export function CampaignTargetingTab({ slotsInput, setSlotsInput }: CampaignTargetingTabProps) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-4">
      <Input label={t('campaigns.slotIds')} value={slotsInput}
        onChange={(e) => setSlotsInput(e.target.value)} placeholder="id1, id2, id3" />
    </div>
  );
}

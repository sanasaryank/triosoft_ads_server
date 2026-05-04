import React from 'react';
import { Input, Select } from '../../../components/ui/FormFields';
import { useLang } from '../../../providers/LanguageProvider';

interface CampaignPricingTabProps {
  budget: number;
  setBudget: (v: number) => void;
  budgetDaily: number;
  setBudgetDaily: (v: number) => void;
  price: number;
  setPrice: (v: number) => void;
  pricingModel: string;
  setPricingModel: (v: string) => void;
  spendStrategy: string;
  setSpendStrategy: (v: string) => void;
  priority: number;
  setPriority: (v: number) => void;
  weight: number;
  setWeight: (v: number) => void;
  overdeliveryRatio: number;
  setOverdeliveryRatio: (v: number) => void;
}

export function CampaignPricingTab({
  budget, setBudget,
  budgetDaily, setBudgetDaily,
  price, setPrice,
  pricingModel, setPricingModel,
  spendStrategy, setSpendStrategy,
  priority, setPriority,
  weight, setWeight,
  overdeliveryRatio, setOverdeliveryRatio,
}: CampaignPricingTabProps) {
  const { t } = useLang();
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label={t('campaigns.budget')} type="number" value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))} />
      <Input label={t('campaigns.dailyBudget')} type="number" value={budgetDaily} onChange={(e) => setBudgetDaily(parseFloat(e.target.value))} />
      <Input label={t('campaigns.price')} type="number" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} />
      <Select label={t('campaigns.pricingModel')} value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
        {['CPM', 'CPC', 'CPA', 'CPV'].map((m) => <option key={m} value={m}>{m}</option>)}
      </Select>
      <Select label={t('campaigns.spendStrategy')} value={spendStrategy} onChange={(e) => setSpendStrategy(e.target.value)}>
        {['even', 'asap', 'frontloaded'].map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Input label={t('campaigns.priority')} type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value))} />
      <Input label={t('campaigns.weight')} type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} />
      <Input label={t('campaigns.overdeliveryRatio')} type="number" step="0.1" value={overdeliveryRatio} onChange={(e) => setOverdeliveryRatio(parseFloat(e.target.value))} />
    </div>
  );
}

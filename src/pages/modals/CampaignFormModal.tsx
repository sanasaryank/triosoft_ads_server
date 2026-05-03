import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../components/LocalizedInputGroup';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import { getCampaignById, createCampaign, updateCampaign } from '../../api/campaignService';
import { normalizeError } from '../../api/client';
import type { Campaign, CampaignPayload, FrequencyCap } from '../../types/models';
import type { Translation } from '../../types/common';

const emptyName: Translation = { ARM: '', ENG: '', RUS: '' };

const defaultFrequencyCap: FrequencyCap = {
  per_user: {
    impressions: { count: 3, window_sec: 3600 },
    clicks: { count: 1, window_sec: 3600 },
  },
  per_session: {
    impressions: { count: 1, window_sec: 900 },
    clicks: { count: 1, window_sec: 3600 },
  },
};

function toDateInput(ts: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toISOString().split('T')[0];
}

function fromDateInput(s: string): number {
  if (!s) return 0;
  return Math.floor(new Date(s).getTime() / 1000);
}

interface CampaignFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignId?: string;
  advertisers: { id: string; label: string }[];
}

export function CampaignFormModal({ open, onClose, onSuccess, campaignId, advertisers }: CampaignFormModalProps) {
  const { t } = useLang();
  const { pushError } = useErrorModal();
  const isEdit = !!campaignId;

  const [name, setName] = useState<Translation>(emptyName);
  const [advertiserId, setAdvertiserId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(0);
  const [budgetDaily, setBudgetDaily] = useState(0);
  const [price, setPrice] = useState(0);
  const [pricingModel, setPricingModel] = useState('CPM');
  const [spendStrategy, setSpendStrategy] = useState('even');
  const [frequencyCapStrategy, setFrequencyCapStrategy] = useState('soft');
  const [frequencyCap, setFrequencyCap] = useState<FrequencyCap>(defaultFrequencyCap);
  const [priority, setPriority] = useState(1);
  const [weight, setWeight] = useState(1);
  const [overdeliveryRatio, setOverdeliveryRatio] = useState(1);
  const [locationsMode, setLocationsMode] = useState('allowed');
  const [restaurantTypesMode, setRestaurantTypesMode] = useState('denied');
  const [menuTypesMode, setMenuTypesMode] = useState('denied');
  const [slotsInput, setSlotsInput] = useState(''); // comma-separated ids
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setName(emptyName); setAdvertiserId(''); setDescription('');
    setStartDate(''); setEndDate(''); setBudget(0); setBudgetDaily(0);
    setPrice(0); setPricingModel('CPM'); setSpendStrategy('even');
    setFrequencyCapStrategy('soft'); setFrequencyCap(defaultFrequencyCap);
    setPriority(1); setWeight(1); setOverdeliveryRatio(1);
    setLocationsMode('allowed'); setRestaurantTypesMode('denied');
    setMenuTypesMode('denied'); setSlotsInput(''); setHash(undefined);
  };

  React.useEffect(() => {
    if (!open) return;
    if (!isEdit) { resetForm(); return; }

    setFetchLoading(true);
    getCampaignById(campaignId!)
      .then((c: Campaign) => {
        setName(c.name); setAdvertiserId(c.advertiserId); setDescription(c.description);
        setStartDate(toDateInput(c.startDate)); setEndDate(toDateInput(c.endDate));
        setBudget(c.budget); setBudgetDaily(c.budgetDaily); setPrice(c.price);
        setPricingModel(c.pricingModel); setSpendStrategy(c.spendStrategy);
        setFrequencyCapStrategy(c.frequencyCapStrategy); setFrequencyCap(c.frequencyCap);
        setPriority(c.priority); setWeight(c.weight); setOverdeliveryRatio(c.overdeliveryRatio);
        setLocationsMode(c.locationsMode); setRestaurantTypesMode(c.restaurantTypesMode);
        setMenuTypesMode(c.menuTypesMode); setSlotsInput((c.slots ?? []).join(', ')); setHash(c.hash);
      })
      .catch((err: unknown) => { pushError(normalizeError(err)); onClose(); })
      .finally(() => setFetchLoading(false));
  }, [open, campaignId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.ENG.trim() || !advertiserId) return;
    setLoading(true);
    try {
      const payload: CampaignPayload = {
        name, advertiserId, description,
        startDate: fromDateInput(startDate),
        endDate: fromDateInput(endDate),
        budget, budgetDaily, price, pricingModel, spendStrategy,
        frequencyCapStrategy, frequencyCap,
        priority, weight, overdeliveryRatio,
        locationsMode, locations: [],
        restaurantTypesMode, restaurantTypes: [],
        menuTypesMode, menuTypes: [],
        slots: slotsInput.split(',').map((s) => s.trim()).filter(Boolean),
        targets: [],
        ...(hash ? { hash } : {}),
      };
      if (isEdit) await updateCampaign(campaignId!, payload);
      else await createCampaign(payload);
      onSuccess();
      onClose();
    } catch (err) {
      pushError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateFCField = (
    scope: 'per_user' | 'per_session',
    type: 'impressions' | 'clicks',
    field: 'count' | 'window_sec',
    value: number,
  ) => {
    setFrequencyCap((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [type]: { ...prev[scope][type], [field]: value },
      },
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('campaigns.editTitle') : t('campaigns.createTitle')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button type="submit" form="campaign-form" loading={loading || fetchLoading}>{t('common.save')}</Button>
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
        <form id="campaign-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LocalizedInputGroup label={t('common.name')} value={name} onChange={setName} required />

          <Select
            label={`${t('campaigns.advertiser')} *`}
            value={advertiserId}
            onChange={(e) => setAdvertiserId(e.target.value)}
            required
          >
            <option value="">{t('campaigns.allAdvertisers')}</option>
            {advertisers.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>

          <Textarea label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label={t('campaigns.startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label={t('campaigns.endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Input label={t('campaigns.budget')} type="number" value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))} />
            <Input label={t('campaigns.dailyBudget')} type="number" value={budgetDaily} onChange={(e) => setBudgetDaily(parseFloat(e.target.value))} />
            <Input label={t('campaigns.price')} type="number" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} />
            <Select label={t('campaigns.pricingModel')} value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
              {['CPM', 'CPC', 'CPA', 'CPV'].map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select label={t('campaigns.spendStrategy')} value={spendStrategy} onChange={(e) => setSpendStrategy(e.target.value)}>
              {['even', 'asap', 'frontloaded'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Frequency Cap Strategy" value={frequencyCapStrategy} onChange={(e) => setFrequencyCapStrategy(e.target.value)}>
              {['soft', 'hard'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label={t('campaigns.priority')} type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value))} />
            <Input label={t('campaigns.weight')} type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} />
            <Input label="Overdelivery Ratio" type="number" step="0.1" value={overdeliveryRatio} onChange={(e) => setOverdeliveryRatio(parseFloat(e.target.value))} />
          </div>

          {/* Frequency Cap */}
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
                          <input
                            type="number"
                            className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                            value={frequencyCap[scope][type].count}
                            onChange={(e) => updateFCField(scope, type, 'count', parseInt(e.target.value))}
                          />
                        </label>
                        <label className="flex flex-col gap-0.5 flex-1">
                          <span className="text-gray-400">Window (s)</span>
                          <input
                            type="number"
                            className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                            value={frequencyCap[scope][type].window_sec}
                            onChange={(e) => updateFCField(scope, type, 'window_sec', parseInt(e.target.value))}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Slots */}
          <Input
            label="Slot IDs (comma-separated)"
            value={slotsInput}
            onChange={(e) => setSlotsInput(e.target.value)}
            placeholder="id1, id2, id3"
          />

          <div className="grid grid-cols-3 gap-3">
            <Select label="Locations Mode" value={locationsMode} onChange={(e) => setLocationsMode(e.target.value)}>
              <option value="allowed">allowed</option>
              <option value="denied">denied</option>
            </Select>
            <Select label="Restaurant Types Mode" value={restaurantTypesMode} onChange={(e) => setRestaurantTypesMode(e.target.value)}>
              <option value="allowed">allowed</option>
              <option value="denied">denied</option>
            </Select>
            <Select label="Menu Types Mode" value={menuTypesMode} onChange={(e) => setMenuTypesMode(e.target.value)}>
              <option value="allowed">allowed</option>
              <option value="denied">denied</option>
            </Select>
          </div>
        </form>
      )}
    </Modal>
  );
}

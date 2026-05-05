import React, { useState, useEffect } from 'react';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import { getCampaignById, createCampaign, updateCampaign } from '../../api/campaignService';
import { getLocations } from '../../api/locationsService';
import { getRestaurantTypes, getMenuTypes } from '../../api/dictionaryService';
import { getPlacements } from '../../api/placementsService';
import { getSlots } from '../../api/slotService';
import { getPlatforms } from '../../api/platformService';
import { getSchedules } from '../../api/scheduleService';
import { normalizeError } from '../../api/client';
import { CampaignGeneralTab } from './tabs/CampaignGeneralTab';
import { CampaignPricingTab } from './tabs/CampaignPricingTab';
import { CampaignFrequencyTab } from './tabs/CampaignFrequencyTab';
import { CampaignTargetingRulesTab } from './tabs/CampaignTargetingRulesTab';
import { CampaignTargetingTab } from './tabs/CampaignTargetingTab';
import type { Campaign, CampaignPayload, FrequencyCap, LocationsResponse, DictionaryItem, CampaignTargets, Placement, Slot, Platform, Schedule } from '../../types/models';
import type { Translation } from '../../types/common';

type CampaignTab = 'general' | 'pricing' | 'frequency' | 'targeting-rules' | 'targeting';

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
  const { t, getLocalized } = useLang();
  const { pushError } = useErrorModal();
  const isEdit = !!campaignId;

  const [activeTab, setActiveTab] = useState<CampaignTab>('general');
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
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [restaurantTypesMode, setRestaurantTypesMode] = useState('denied');
  const [selectedRestaurantTypes, setSelectedRestaurantTypes] = useState<string[]>([]);
  const [menuTypesMode, setMenuTypesMode] = useState('denied');
  const [selectedMenuTypes, setSelectedMenuTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<CampaignTargets>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  const [locationsData, setLocationsData] = useState<LocationsResponse | null>(null);
  const [restaurantTypeOptions, setRestaurantTypeOptions] = useState<DictionaryItem[]>([]);
  const [menuTypeOptions, setMenuTypeOptions] = useState<DictionaryItem[]>([]);
  const [allPlacements, setAllPlacements] = useState<Placement[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [allPlatforms, setAllPlatforms] = useState<Platform[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);

  const resetForm = () => {
    setName(emptyName); setAdvertiserId(''); setDescription('');
    setStartDate(''); setEndDate(''); setBudget(0); setBudgetDaily(0);
    setPrice(0); setPricingModel('CPM'); setSpendStrategy('even');
    setFrequencyCapStrategy('soft'); setFrequencyCap(defaultFrequencyCap);
    setPriority(1); setWeight(1); setOverdeliveryRatio(1);
    setLocationsMode('allowed'); setSelectedLocations([]);
    setRestaurantTypesMode('denied'); setSelectedRestaurantTypes([]);
    setMenuTypesMode('denied'); setSelectedMenuTypes([]);
    setTargets({}); setHash(undefined);
    setActiveTab('general');
  };

  useEffect(() => {
    if (!open) return;
    getLocations().then(setLocationsData).catch(() => {});
    getRestaurantTypes().then((d) => setRestaurantTypeOptions(Array.isArray(d) ? d : [])).catch(() => {});
    getMenuTypes().then((d) => setMenuTypeOptions(Array.isArray(d) ? d : [])).catch(() => {});
    getPlacements().then((d) => setAllPlacements(Array.isArray(d) ? d : [])).catch(() => {});
    getSlots().then((d) => setAllSlots(Array.isArray(d) ? d : [])).catch(() => {});
    getPlatforms().then((d) => setAllPlatforms(Array.isArray(d) ? d : [])).catch(() => {});
    getSchedules().then((d) => setAllSchedules(Array.isArray(d) ? d : [])).catch(() => {});
  }, [open]);

  useEffect(() => {
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
        setLocationsMode(c.locationsMode); setSelectedLocations(c.locations ?? []);
        setRestaurantTypesMode(c.restaurantTypesMode); setSelectedRestaurantTypes(c.restaurantTypes ?? []);
        setMenuTypesMode(c.menuTypesMode); setSelectedMenuTypes(c.menuTypes ?? []);
        setTargets(c.targets ?? {}); setHash(c.hash);
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
        locationsMode, locations: selectedLocations,
        restaurantTypesMode, restaurantTypes: selectedRestaurantTypes,
        menuTypesMode, menuTypes: selectedMenuTypes,
        targets,
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
      [scope]: { ...prev[scope], [type]: { ...prev[scope][type], [field]: value } },
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
          <Tabs
            tabs={[
              { key: 'general',   label: t('campaigns.tabGeneral') },
              { key: 'pricing',   label: t('campaigns.tabPricing') },
              { key: 'frequency', label: t('campaigns.tabFrequency') },
              { key: 'targeting-rules', label: t('campaigns.tabTargetingRules') },
              { key: 'targeting',       label: t('campaigns.tabTargeting') },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'general' && (
            <CampaignGeneralTab
              name={name} setName={setName}
              advertiserId={advertiserId} setAdvertiserId={setAdvertiserId}
              advertisers={advertisers}
              startDate={startDate} setStartDate={setStartDate}
              endDate={endDate} setEndDate={setEndDate}
              description={description} setDescription={setDescription}
            />
          )}

          {activeTab === 'pricing' && (
            <CampaignPricingTab
              budget={budget} setBudget={setBudget}
              budgetDaily={budgetDaily} setBudgetDaily={setBudgetDaily}
              price={price} setPrice={setPrice}
              pricingModel={pricingModel} setPricingModel={setPricingModel}
              spendStrategy={spendStrategy} setSpendStrategy={setSpendStrategy}
              priority={priority} setPriority={setPriority}
              weight={weight} setWeight={setWeight}
              overdeliveryRatio={overdeliveryRatio} setOverdeliveryRatio={setOverdeliveryRatio}
            />
          )}

          {activeTab === 'frequency' && (
            <CampaignFrequencyTab
              frequencyCapStrategy={frequencyCapStrategy} setFrequencyCapStrategy={setFrequencyCapStrategy}
              frequencyCap={frequencyCap} updateFCField={updateFCField}
            />
          )}

          {activeTab === 'targeting-rules' && (
            <CampaignTargetingRulesTab
              locationsMode={locationsMode} setLocationsMode={setLocationsMode}
              selectedLocations={selectedLocations} setSelectedLocations={setSelectedLocations}
              locationsData={locationsData}
              restaurantTypesMode={restaurantTypesMode} setRestaurantTypesMode={setRestaurantTypesMode}
              selectedRestaurantTypes={selectedRestaurantTypes} setSelectedRestaurantTypes={setSelectedRestaurantTypes}
              restaurantTypeOptions={restaurantTypeOptions}
              menuTypesMode={menuTypesMode} setMenuTypesMode={setMenuTypesMode}
              selectedMenuTypes={selectedMenuTypes} setSelectedMenuTypes={setSelectedMenuTypes}
              menuTypeOptions={menuTypeOptions}
            />
          )}

          {activeTab === 'targeting' && (
            <CampaignTargetingTab
              targets={targets}
              setTargets={setTargets}
              placements={allPlacements}
              slots={allSlots}
              platforms={allPlatforms}
              schedules={allSchedules}
              isEdit={isEdit}
            />
          )}
        </form>
      )}
    </Modal>
  );
}



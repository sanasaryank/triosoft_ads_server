import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select, Checkbox } from '../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../components/LocalizedInputGroup';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import { getSlotById, createSlot, updateSlot } from '../../api/slotService';
import { normalizeError } from '../../api/client';
import type { Slot, SlotPayload, SlotType } from '../../types/models';
import type { Translation } from '../../types/common';

const emptyName: Translation = { ARM: '', ENG: '', RUS: '' };
const SLOT_TYPES: SlotType[] = ['MainBig', 'MainSmall', 'Group', 'Selection'];

interface SlotFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slotId?: string;
  platforms: { id: string; label: string }[];
}

export function SlotFormModal({ open, onClose, onSuccess, slotId, platforms }: SlotFormModalProps) {
  const { t } = useLang();
  const { pushError } = useErrorModal();
  const isEdit = !!slotId;

  const [name, setName] = useState<Translation>(emptyName);
  const [type, setType] = useState<SlotType>('MainBig');
  const [platformId, setPlatformId] = useState('');
  const [rotationPeriod, setRotationPeriod] = useState(30);
  const [refreshTTL, setRefreshTTL] = useState(300);
  const [noAdjacentSameAdvertiser, setNoAdjacentSameAdvertiser] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setName(emptyName);
      setType('MainBig');
      setPlatformId('');
      setRotationPeriod(30);
      setRefreshTTL(300);
      setNoAdjacentSameAdvertiser(false);
      setDescription('');
      setHash(undefined);
      return;
    }
    setFetchLoading(true);
    getSlotById(slotId!)
      .then((s: Slot) => {
        setName(s.name);
        setType(s.type);
        setPlatformId(s.platformId);
        setRotationPeriod(s.rotationPeriod);
        setRefreshTTL(s.refreshTTL);
        setNoAdjacentSameAdvertiser(s.noAdjacentSameAdvertiser);
        setDescription(s.description);
        setHash(s.hash);
      })
      .catch((err: unknown) => { pushError(normalizeError(err)); onClose(); })
      .finally(() => setFetchLoading(false));
  }, [open, slotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.ENG.trim()) return;
    setLoading(true);
    try {
      const payload: SlotPayload = {
        name, type, platformId, rotationPeriod, refreshTTL, noAdjacentSameAdvertiser, description,
        ...(hash ? { hash } : {}),
      };
      if (isEdit) await updateSlot(slotId!, payload);
      else await createSlot(payload);
      onSuccess();
      onClose();
    } catch (err) {
      pushError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('slots.editTitle') : t('slots.createTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button type="submit" form="slot-form" loading={loading || fetchLoading}>{t('common.save')}</Button>
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
        <form id="slot-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LocalizedInputGroup label={t('common.name')} value={name} onChange={setName} required />

          <Select label={t('common.type')} value={type} onChange={(e) => setType(e.target.value as SlotType)}>
            {SLOT_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
          </Select>

          <Select
            label={`${t('slots.platform')} *`}
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
            required
          >
            <option value="">{t('slots.selectPlatform')}</option>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('slots.rotationPeriod')}
              type="number"
              value={rotationPeriod}
              onChange={(e) => setRotationPeriod(parseInt(e.target.value))}
            />
            <Input
              label={t('slots.refreshTTL')}
              type="number"
              value={refreshTTL}
              onChange={(e) => setRefreshTTL(parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="noAdjacent"
              checked={noAdjacentSameAdvertiser}
              onChange={(e) => setNoAdjacentSameAdvertiser(e.target.checked)}
            />
            <label htmlFor="noAdjacent" className="text-sm font-medium text-gray-700">
              {t('slots.noAdjacentSameAdvertiser')}
            </label>
          </div>

          <Textarea
            label={t('common.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </form>
      )}
    </Modal>
  );
}

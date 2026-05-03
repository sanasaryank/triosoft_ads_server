import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../components/LocalizedInputGroup';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import { getAdvertiserById, createAdvertiser, updateAdvertiser } from '../../api/advertiserService';
import { normalizeError } from '../../api/client';
import type { Advertiser, AdvertiserPayload } from '../../types/models';
import type { Translation } from '../../types/common';

const emptyName: Translation = { ARM: '', ENG: '', RUS: '' };

interface AdvertiserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  advertiserId?: string;
}

export function AdvertiserFormModal({ open, onClose, onSuccess, advertiserId }: AdvertiserFormModalProps) {
  const { t } = useLang();
  const { pushError } = useErrorModal();
  const isEdit = !!advertiserId;

  const [name, setName] = useState<Translation>(emptyName);
  const [tin, setTin] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setName(emptyName); setTin(''); setDescription(''); setHash(undefined);
      return;
    }
    setFetchLoading(true);
    getAdvertiserById(advertiserId!)
      .then((a: Advertiser) => { setName(a.name); setTin(a.TIN); setDescription(a.description); setHash(a.hash); })
      .catch((err: unknown) => { pushError(normalizeError(err)); onClose(); })
      .finally(() => setFetchLoading(false));
  }, [open, advertiserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.ENG.trim()) return;
    setLoading(true);
    try {
      const payload: AdvertiserPayload = { name, TIN: tin, description, ...(hash ? { hash } : {}) };
      if (isEdit) await updateAdvertiser(advertiserId!, payload);
      else await createAdvertiser(payload);
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
      title={isEdit ? t('advertisers.editTitle') : t('advertisers.createTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button type="submit" form="advertiser-form" loading={loading || fetchLoading}>{t('common.save')}</Button>
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
        <form id="advertiser-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LocalizedInputGroup label={t('common.name')} value={name} onChange={setName} required />
          <Input label={t('advertisers.tin')} value={tin} onChange={(e) => setTin(e.target.value)} />
          <Textarea label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        </form>
      )}
    </Modal>
  );
}

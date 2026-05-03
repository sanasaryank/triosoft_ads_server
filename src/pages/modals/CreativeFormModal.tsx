import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../components/LocalizedInputGroup';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import { getCreativeById, createCreative, updateCreative } from '../../api/creativeService';
import { normalizeError } from '../../api/client';
import type { Creative, CreativePayload } from '../../types/models';
import type { Translation } from '../../types/common';

const emptyName: Translation = { ARM: '', ENG: '', RUS: '' };

interface CreativeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  creativeId?: string;
  campaigns: { id: string; label: string }[];
}

export function CreativeFormModal({ open, onClose, onSuccess, creativeId, campaigns }: CreativeFormModalProps) {
  const { t } = useLang();
  const { pushError } = useErrorModal();
  const isEdit = !!creativeId;

  const [name, setName] = useState<Translation>(emptyName);
  const [campaignId, setCampaignId] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [minWidth, setMinWidth] = useState(0);
  const [maxWidth, setMaxWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setName(emptyName); setCampaignId(''); setDataUrl('');
    setMinWidth(0); setMaxWidth(0); setMinHeight(0); setMaxHeight(0);
    setPreviewWidth(0); setPreviewHeight(0); setHash(undefined);
  };

  React.useEffect(() => {
    if (!open) return;
    if (!isEdit) { resetForm(); return; }

    setFetchLoading(true);
    getCreativeById(creativeId!)
      .then((c: Creative) => {
        setName(c.name); setCampaignId(c.campaignId); setDataUrl(c.dataUrl);
        setMinWidth(c.minWidth); setMaxWidth(c.maxWidth);
        setMinHeight(c.minHeight); setMaxHeight(c.maxHeight);
        setPreviewWidth(c.previewWidth); setPreviewHeight(c.previewHeight);
        setHash(c.hash);
      })
      .catch((err: unknown) => { pushError(normalizeError(err)); onClose(); })
      .finally(() => setFetchLoading(false));
  }, [open, creativeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.ENG.trim() || !campaignId) return;
    setLoading(true);
    try {
      const payload: CreativePayload = {
        name, campaignId, dataUrl,
        minWidth, maxWidth, minHeight, maxHeight, previewWidth, previewHeight,
        ...(hash ? { hash } : {}),
      };
      if (isEdit) await updateCreative(creativeId!, payload);
      else await createCreative(payload);
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
      title={isEdit ? t('creatives.editTitle') : t('creatives.createTitle')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button type="submit" form="creative-form" loading={loading || fetchLoading}>{t('common.save')}</Button>
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
        <form id="creative-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LocalizedInputGroup label={t('common.name')} value={name} onChange={setName} required />

          <Select
            label={`${t('creatives.campaign')} *`}
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            required
          >
            <option value="">{t('creatives.selectCampaign')}</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>

          <Textarea
            label="Data URL (HTML content)"
            value={dataUrl}
            onChange={(e) => setDataUrl(e.target.value)}
            rows={6}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input label="Min Width" type="number" value={minWidth} onChange={(e) => setMinWidth(parseInt(e.target.value))} />
            <Input label="Max Width" type="number" value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value))} />
            <Input label="Preview Width" type="number" value={previewWidth} onChange={(e) => setPreviewWidth(parseInt(e.target.value))} />
            <Input label="Min Height" type="number" value={minHeight} onChange={(e) => setMinHeight(parseInt(e.target.value))} />
            <Input label="Max Height" type="number" value={maxHeight} onChange={(e) => setMaxHeight(parseInt(e.target.value))} />
            <Input label="Preview Height" type="number" value={previewHeight} onChange={(e) => setPreviewHeight(parseInt(e.target.value))} />
          </div>
        </form>
      )}
    </Modal>
  );
}

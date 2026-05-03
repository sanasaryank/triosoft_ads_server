import React, { useState, useRef, useCallback } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormFields';
import { LocalizedInputGroup } from '../../components/LocalizedInputGroup';
import { useLang } from '../../providers/LanguageProvider';
import { useErrorModal } from '../../providers/ErrorModalProvider';
import { getCreativeById, createCreative, updateCreative } from '../../api/creativeService';
import { normalizeError, BANNERS_URL } from '../../api/client';
import type { CreativeDetail, CreativePayload, CreativeLanguage } from '../../types/models';
import type { Translation } from '../../types/common';
import { IconDownload, IconTrash } from '../../components/ui/Icons';

const ALLOWED_EXTENSIONS = ['html', 'htm', 'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'];
const MAX_NEW_SIZE_BYTES = 500 * 1024; // 500 KB

type CreativeFile = {
  name: string;
  contents?: string; // raw base64, new files only
  isNew: boolean;
};

const emptyName: Translation = { ARM: '', ENG: '', RUS: '' };

function getExt(name: string) {
  return name.slice(name.lastIndexOf('.') + 1).toLowerCase();
}

function downloadFile(url: string, fileName: string) {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    })
    .catch(() => { /* silent */ });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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

  const [activeTab, setActiveTab] = useState<'general' | 'files'>('general');
  const [name, setName] = useState<Translation>(emptyName);
  const [campaignId, setCampaignId] = useState('');
  const [language, setLanguage] = useState<CreativeLanguage>('ARM');
  const [indexFile, setIndexFile] = useState('');
  const [files, setFiles] = useState<CreativeFile[]>([]);
  const [minWidth, setMinWidth] = useState(0);
  const [maxWidth, setMaxWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setActiveTab('general');
    setName(emptyName); setCampaignId(''); setLanguage('ARM'); setIndexFile('');
    setFiles([]); setHash(undefined); setConfirmDelete(null);
    setMinWidth(0); setMaxWidth(0); setMinHeight(0);
    setMaxHeight(0); setPreviewWidth(0); setPreviewHeight(0);
  };

  React.useEffect(() => {
    if (!open) return;
    if (!isEdit) { resetForm(); return; }

    setFetchLoading(true);
    getCreativeById(creativeId!)
      .then((c: CreativeDetail) => {
        setName(c.name);
        setCampaignId(c.campaignId);
        setLanguage(c.language ?? 'ARM');
        const existingFiles: CreativeFile[] = (c.files ?? []).map((f) => ({ name: f, isNew: false }));
        setFiles(existingFiles);
        setIndexFile((c.files ?? []).includes(c.indexFile) ? c.indexFile : '');
        setMinWidth(c.minWidth); setMaxWidth(c.maxWidth);
        setMinHeight(c.minHeight); setMaxHeight(c.maxHeight);
        setPreviewWidth(c.previewWidth); setPreviewHeight(c.previewHeight);
        setHash(c.hash);
      })
      .catch((err: unknown) => { pushError(normalizeError(err)); onClose(); })
      .finally(() => setFetchLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, creativeId]);

  const addFiles = useCallback(async (picked: FileList | File[]) => {
    const fileArr = Array.from(picked);
    const errors: string[] = [];
    const toAdd: CreativeFile[] = [];

    // Calculate how many bytes of new files already exist (approximate from base64)
    let newBytesTotal = files
      .filter((f) => f.isNew && f.contents)
      .reduce((sum, f) => sum + Math.ceil((f.contents!.length * 3) / 4), 0);

    for (const file of fileArr) {
      const ext = getExt(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${file.name}": unsupported file type`);
        continue;
      }
      if (files.some((f) => f.name === file.name) || toAdd.some((f) => f.name === file.name)) {
        errors.push(`"${file.name}": duplicate name`);
        continue;
      }
      newBytesTotal += file.size;
      if (newBytesTotal > MAX_NEW_SIZE_BYTES) {
        errors.push(`Adding "${file.name}" would exceed the 500 KB new-file limit`);
        break;
      }
      try {
        const contents = await readFileAsBase64(file);
        toAdd.push({ name: file.name, contents, isNew: true });
      } catch {
        errors.push(`"${file.name}": failed to read`);
      }
    }

    if (toAdd.length > 0) setFiles((prev) => [...prev, ...toAdd]);
    if (errors.length > 0) pushError({ title: 'File error', message: errors.join('\n') });
  }, [files, pushError]);

  const deleteFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    if (indexFile === fileName) setIndexFile('');
    setConfirmDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.ENG.trim() || !campaignId) return;
    setLoading(true);
    try {
      const fileEntries = files.map((f) =>
        f.isNew && f.contents ? { name: f.name, contents: f.contents } : { name: f.name },
      );
      const payload: CreativePayload = {
        name, campaignId, language,
        indexFile: files.some((f) => f.name === indexFile) ? indexFile : '',
        files: fileEntries,
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
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
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['general', 'files'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'general' ? t('common.general') : t('common.files')}
              </button>
            ))}
          </div>

          {/* ── General tab ── */}
          {activeTab === 'general' && (
            <>
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

              <Select
                label={t('creatives.language')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as CreativeLanguage)}
              >
                <option value="ARM">{t('creatives.language.ARM')}</option>
                <option value="ENG">{t('creatives.language.ENG')}</option>
                <option value="RUS">{t('creatives.language.RUS')}</option>
              </Select>

              <div className="grid grid-cols-3 gap-3">
                <Input label="Min Width" type="number" value={minWidth} onChange={(e) => setMinWidth(parseInt(e.target.value) || 0)} />
                <Input label="Max Width" type="number" value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value) || 0)} />
                <Input label="Preview Width" type="number" value={previewWidth} onChange={(e) => setPreviewWidth(parseInt(e.target.value) || 0)} />
                <Input label="Min Height" type="number" value={minHeight} onChange={(e) => setMinHeight(parseInt(e.target.value) || 0)} />
                <Input label="Max Height" type="number" value={maxHeight} onChange={(e) => setMaxHeight(parseInt(e.target.value) || 0)} />
                <Input label="Preview Height" type="number" value={previewHeight} onChange={(e) => setPreviewHeight(parseInt(e.target.value) || 0)} />
              </div>
            </>
          )}

          {/* ── Files tab ── */}
          {activeTab === 'files' && (
            <div className="flex flex-col gap-4">
              {/* Index file selector */}
              <Select
                label="Index file"
                value={indexFile}
                onChange={(e) => setIndexFile(e.target.value)}
              >
                <option value="">— none —</option>
                {files.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </Select>

              {/* File list */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t('common.files')} ({files.length})
                </p>
                {files.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No files added yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
                    {files.map((f) => (
                      <li key={f.name}>
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-sm text-gray-800 truncate mr-2">
                            {f.name}
                            {f.isNew && (
                              <span className="ml-1.5 rounded bg-primary-100 px-1 py-0.5 text-xs text-primary-600">new</span>
                            )}
                            {f.name === indexFile && (
                              <span className="ml-1.5 rounded bg-green-100 px-1 py-0.5 text-xs text-green-600">index</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!f.isNew && isEdit && creativeId && (
                              <button
                                type="button"
                                onClick={() => downloadFile(`${BANNERS_URL}${creativeId}/${f.name}`, f.name)}
                                className="inline-flex items-center justify-center rounded p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                                title="Download"
                              >
                                <IconDownload />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(f.name)}
                              className="inline-flex items-center justify-center rounded p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </div>
                        {confirmDelete === f.name && (
                          <div className="flex items-center gap-3 bg-red-50 px-3 py-2 text-sm text-red-700">
                            <span>Delete &ldquo;{f.name}&rdquo;?</span>
                            <button
                              type="button"
                              onClick={() => deleteFile(f.name)}
                              className="font-medium underline"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-gray-500 underline"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Drag-and-drop / file picker */}
              <div
                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <p className="text-sm text-gray-500 mb-2">Drag files here, or</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse files
                </Button>
                <p className="mt-2 text-xs text-gray-400">
                  Allowed: HTML, CSS, JS, images &middot; Max 500 KB new files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.webp,.svg,.ico,.bmp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      addFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}


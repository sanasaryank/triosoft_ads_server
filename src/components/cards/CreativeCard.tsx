import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { CardShell, CardHeader, CardActions } from './CardBase';
import { IconButtonWithTooltip } from '../ui/Tooltip';
import { IconBarChart } from '../ui/Icons';
import { getBannersUrl } from '../../api/client';
import type { Creative } from '../../types/models';
import type { CreativeLanguage } from '../../types/models';

function wrapWithCharset(html: string, baseHref: string): string {
  const trimmed = html.trimStart();
  const isFullDoc = /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed);
  const inject = `<base href="${baseHref}"><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}</style>`;
  if (isFullDoc) {
    const injected = html.replace(/(<head[^>]*>)/i, `$1${inject}`);
    return injected !== html ? injected : html;
  }
  return `<!DOCTYPE html><html><head>${inject}</head><body>${html}</body></html>`;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);

function getExt(name: string) {
  return name.slice(name.lastIndexOf('.') + 1).toLowerCase();
}

function isImageFile(name: string) {
  return IMAGE_EXTENSIONS.has(getExt(name));
}

interface CreativeCardProps {
  creative: Creative;
  campaignName?: string;
  advertiserName?: string;
  onEdit: () => void;
  onToggleBlock: () => void;
  onStats?: () => void;
  blockLoading?: boolean;
}

export function CreativeCard({
  creative: c,
  campaignName,
  advertiserName,
  onEdit,
  onToggleBlock,
  onStats,
  blockLoading,
}: CreativeCardProps) {
  const { getLocalized, t, lang } = useLang();
  const [previewLang, setPreviewLang] = useState<CreativeLanguage>(lang as CreativeLanguage);
  const [srcDoc, setSrcDoc] = useState<string | undefined>(undefined);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const previewWidth = c.previewWidth || 320;
  const previewHeight = c.previewHeight || 120;

  // derive indexFile + effective lang: prefer selected lang, fall back to defaultLanguage
  const files = (c as any).files as Record<string, { indexFile?: string; media?: string[] }> & { defaultLanguage?: string } | undefined;
  const defaultLang = (files?.defaultLanguage ?? 'ENG') as CreativeLanguage;
  const effectiveLang: CreativeLanguage = files?.[previewLang]?.indexFile ? previewLang : (files?.[defaultLang]?.indexFile ? defaultLang : previewLang);
  const indexFile = files?.[effectiveLang]?.indexFile as string | undefined;
  const isImage = indexFile ? isImageFile(indexFile) : false;
  const bannersBaseHref = getBannersUrl(c.id, effectiveLang);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    if (w > 0) setScale(w / previewWidth);
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / previewWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewWidth]);

  useEffect(() => {
    if (!indexFile || isImage) { setSrcDoc(undefined); setPreviewFailed(false); return; }
    let cancelled = false;
    setPreviewFailed(false);
    const baseHref = bannersBaseHref;
    fetch(`${baseHref}${indexFile}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then((buf) => {
        if (!cancelled) setSrcDoc(wrapWithCharset(new TextDecoder('utf-8').decode(buf), bannersBaseHref));
      })
      .catch(() => { if (!cancelled) { setSrcDoc(undefined); setPreviewFailed(true); } });
    return () => { cancelled = true; };
  }, [c.id, indexFile, isImage, bannersBaseHref]);

  function renderPreview() {
    if (!indexFile || previewFailed) {
      return (
        <div className="flex items-center justify-center bg-gray-100 h-24 text-gray-400 text-xs">
          No preview
        </div>
      );
    }
    if (isImage) {
      return (
        <div
          ref={containerRef}
          className="border-b border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center"
          style={{ width: '100%', height: previewHeight * scale }}
        >
          <img
            src={`${bannersBaseHref}${indexFile}`}
            alt={getLocalized(c.name)}
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
      );
    }
    return (
      <div
        ref={containerRef}
        className="border-b border-gray-100 bg-gray-50 overflow-hidden"
        style={{ width: '100%', height: previewHeight * scale }}
      >
        <iframe
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          title={getLocalized(c.name)}
          style={{
            display: 'block',
            width: previewWidth,
            height: previewHeight,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            pointerEvents: 'none',
            border: 'none',
          }}
        />
      </div>
    );
  }

  const LANGS: { value: CreativeLanguage; label: string }[] = [
    { value: 'ARM', label: t('creatives.language.ARM') },
    { value: 'ENG', label: t('creatives.language.ENG') },
    { value: 'RUS', label: t('creatives.language.RUS') },
  ];

  return (
    <CardShell overflowHidden>
      {renderPreview()}

      <div className="p-4">
        <CardHeader title={getLocalized(c.name)} isBlocked={c.isBlocked} className="mb-1" />

        {advertiserName && (
          <p className="text-xs text-gray-400 mb-0.5">
            <span className="font-medium text-gray-500">{t('creatives.advertiser')}: </span>
            {advertiserName}
          </p>
        )}
        {campaignName && (
          <p className="text-xs text-gray-500 mb-1 truncate">
            <span className="font-medium">{t('creatives.campaign')}: </span>
            {campaignName}
          </p>
        )}

        {/* Language radio selector */}
        <div className="flex gap-2 mb-2">
          {LANGS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                name={`preview-lang-${c.id}`}
                value={value}
                checked={previewLang === value}
                onChange={() => setPreviewLang(value)}
                className="text-primary-600"
              />
              <span className={previewLang === value ? 'font-semibold text-gray-800' : 'text-gray-500'}>
                {label}
              </span>
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-3">
          <span className="font-medium text-gray-500">{t('creatives.size')}: </span>
          {c.previewWidth}×{c.previewHeight}px
        </p>

        <CardActions
          isBlocked={c.isBlocked}
          onEdit={onEdit}
          onToggleBlock={onToggleBlock}
          blockLoading={blockLoading}
          extraActions={onStats && (
            <IconButtonWithTooltip tooltip={t('stats.title')} icon={<IconBarChart />} onClick={onStats} />
          )}
        />
      </div>
    </CardShell>
  );
}

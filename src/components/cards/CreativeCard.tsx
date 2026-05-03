import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { CardShell, CardHeader, CardActions } from './CardBase';
import { BANNERS_URL } from '../../api/client';
import type { Creative } from '../../types/models';

function wrapWithCharset(html: string): string {
  const trimmed = html.trimStart();
  const isFullDoc = /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed);
  const baseStyle = '<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}</style>';
  if (isFullDoc) {
    if (/<meta[^>]+charset/i.test(html)) return html;
    const injected = html.replace(/(<head[^>]*>)/i, `$1<meta charset="utf-8">${baseStyle}`);
    return injected !== html ? injected : html;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>${html}</body></html>`;
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
  blockLoading?: boolean;
}

export function CreativeCard({
  creative: c,
  campaignName,
  advertiserName,
  onEdit,
  onToggleBlock,
  blockLoading,
}: CreativeCardProps) {
  const { getLocalized, t } = useLang();
  const [srcDoc, setSrcDoc] = useState<string | undefined>(undefined);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const previewWidth = c.previewWidth || 320;
  const previewHeight = c.previewHeight || 120;
  const isImage = c.indexFile ? isImageFile(c.indexFile) : false;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / previewWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewWidth]);

  useEffect(() => {
    if (!c.indexFile || isImage) { setSrcDoc(undefined); return; }
    let cancelled = false;
    fetch(`${BANNERS_URL}${c.id}/${c.indexFile}`)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!cancelled) setSrcDoc(wrapWithCharset(new TextDecoder('utf-8').decode(buf)));
      })
      .catch(() => { if (!cancelled) setSrcDoc(undefined); });
    return () => { cancelled = true; };
  }, [c.id, c.indexFile, isImage]);

  function renderPreview() {
    if (!c.indexFile) {
      return (
        <div className="flex items-center justify-center bg-gray-100 h-24 text-gray-400 text-xs">
          No preview
        </div>
      );
    }
    if (isImage) {
      return (
        <div
          className="border-b border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center"
          style={{ width: '100%', height: previewHeight * scale }}
        >
          <img
            src={`${BANNERS_URL}${c.id}/${c.indexFile}`}
            alt={getLocalized(c.name)}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
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

  return (
    <CardShell overflowHidden>
      {renderPreview()}

      <div className="p-4">
        <CardHeader title={getLocalized(c.name)} isBlocked={c.isBlocked} className="mb-1" />

        {advertiserName && <p className="text-xs text-gray-400 mb-0.5">{advertiserName}</p>}
        {campaignName && <p className="text-xs text-gray-500 mb-1 truncate">{campaignName}</p>}
        {c.language && (
          <p className="text-xs text-gray-400 mb-2">{t(`creatives.language.${c.language}`)}</p>
        )}

        <div className="text-xs text-gray-400 mb-3">
          {c.previewWidth}×{c.previewHeight}px
        </div>

        <CardActions
          isBlocked={c.isBlocked}
          onEdit={onEdit}
          onToggleBlock={onToggleBlock}
          blockLoading={blockLoading}
        />
      </div>
    </CardShell>
  );
}

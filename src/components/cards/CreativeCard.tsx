import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { CardShell, CardHeader, CardActions } from './CardBase';
import type { Creative } from '../../types/models';

// Ensures HTML rendered via srcDoc always uses UTF-8.
// Bare fragments (no <html> or <!DOCTYPE>) are wrapped in a full document so
// the <meta charset> is inside a proper <head> and browsers actually honor it.
function ensureUtf8Meta(html: string): string {
  const trimmed = html.trimStart();
  const isFullDoc = /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed);

  if (isFullDoc) {
    if (/<meta[^>]+charset/i.test(html)) return html;
    const injected = html.replace(/(<head[^>]*>)/i, '$1<meta charset="utf-8">');
    return injected !== html ? injected : html;
  }

  // Bare fragment — wrap in a minimal full document
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
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
  const { getLocalized } = useLang();
  const [srcDoc, setSrcDoc] = useState<string | undefined>(undefined);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHtml = Boolean(c.dataUrl?.trimStart().startsWith('<'));
  const previewWidth = c.previewWidth || 320;
  const previewHeight = c.previewHeight || 120;

  // Keep scale in sync with container width on every resize
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
    if (!c.dataUrl) { setSrcDoc(undefined); return; }

    if (isHtml) {
      setSrcDoc(ensureUtf8Meta(c.dataUrl));
      return;
    }

    // URL: fetch as raw bytes, decode as UTF-8 explicitly, render via srcDoc
    // This bypasses any wrong Content-Type charset the server may send
    let cancelled = false;
    fetch(c.dataUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!cancelled) setSrcDoc(ensureUtf8Meta(new TextDecoder('utf-8').decode(buf)));
      })
      .catch(() => { if (!cancelled) setSrcDoc(undefined); });
    return () => { cancelled = true; };
  }, [c.dataUrl, isHtml]);

  function renderPreview() {
    if (!c.dataUrl) {
      return (
        <div className="flex items-center justify-center bg-gray-100 h-24 text-gray-400 text-xs">
          No preview
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
          sandbox=""
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
        {campaignName && <p className="text-xs text-gray-500 mb-2 truncate">{campaignName}</p>}

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

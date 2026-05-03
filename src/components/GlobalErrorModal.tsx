import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useErrorModal } from '../providers/ErrorModalProvider';
import { useLang } from '../providers/LanguageProvider';

export function GlobalErrorModal() {
  const { errors, dismissCurrent } = useErrorModal();
  const { t } = useLang();

  const current = errors[0];

  return (
    <Modal
      open={!!current}
      onClose={dismissCurrent}
      title={current?.title ?? t('common.error')}
      size="sm"
      footer={<Button onClick={dismissCurrent}>{t('common.close')}</Button>}
    >
      {current && (
        <>
          <p className="text-sm text-gray-700">{current.message}</p>
          {current.status && (
            <p className="mt-1 text-xs text-gray-400">HTTP {current.status}</p>
          )}
          {current.details && (
            <pre className="mt-3 rounded bg-gray-50 p-3 text-xs text-gray-500 overflow-auto max-h-40">
              {JSON.stringify(current.details, null, 2)}
            </pre>
          )}
        </>
      )}
    </Modal>
  );
}

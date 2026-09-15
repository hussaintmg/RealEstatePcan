'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export type ConfirmationSeverity = 'danger' | 'warning' | 'info';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  severity?: ConfirmationSeverity;
  variant?: ConfirmationSeverity;
  loading?: boolean;
}

const severityConfig = {
  danger: {
    icon: AlertOctagon,
    iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    buttonVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    buttonVariant: 'primary' as const,
  },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  confirmText,
  cancelLabel = 'Cancel',
  severity = 'danger',
  variant,
  loading,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const activeSeverity = variant || severity;
  const activeConfirmLabel = confirmText || confirmLabel;
  const isExecuting = loading !== undefined ? loading : internalLoading;

  const cfg = severityConfig[activeSeverity] || severityConfig.danger;
  const Icon = cfg.icon;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch {
      // Keep open on error so caller can display message
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOutsideClick={!isExecuting}
      closeOnEscape={!isExecuting}
      showCloseButton={!isExecuting}
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-2xl flex-shrink-0 ${cfg.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className="text-base font-bold text-white tracking-tight">
              {title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isExecuting}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={cfg.buttonVariant}
            onClick={handleConfirm}
            loading={isExecuting}
          >
            {activeConfirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

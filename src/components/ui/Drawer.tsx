'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type DrawerSide = 'left' | 'right' | 'bottom';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  className?: string;
  width?: string;
}

const sideTransforms: Record<DrawerSide, { initial: string; animate: string; position: string }> = {
  left: {
    initial: '-translate-x-full',
    animate: 'translate-x-0',
    position: 'left-0 top-0 bottom-0 h-full',
  },
  right: {
    initial: 'translate-x-full',
    animate: 'translate-x-0',
    position: 'right-0 top-0 bottom-0 h-full',
  },
  bottom: {
    initial: 'translate-y-full',
    animate: 'translate-y-0',
    position: 'left-0 right-0 bottom-0 max-h-[85dvh] rounded-t-3xl',
  },
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  side = 'left',
  title,
  children,
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className = '',
  width = 'w-72 sm:w-80',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!mounted || !isOpen) return null;

  const config = sideTransforms[side];

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[50] flex"
    >
      {/* Backdrop */}
      <div
        onClick={closeOnOutsideClick ? onClose : undefined}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Body */}
      <div
        className={`fixed z-[55] bg-[#070a0f] border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          config.position
        } ${side === 'left' ? 'border-r' : side === 'right' ? 'border-l' : 'border-t'} ${
          side === 'bottom' ? 'w-full' : width
        } ${className}`}
      >
        {/* Optional Title Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            {title ? (
              <div className="text-sm font-bold text-white tracking-tight truncate">
                {title}
              </div>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

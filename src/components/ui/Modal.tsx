'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnEscape = true,
  closeOnOutsideClick = true,
  showCloseButton = true,
  className = '',
  initialFocusRef,
}) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasInitialFocusedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnEscapeRef = useRef(closeOnEscape);
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll & handle Escape key & initial focus on OPEN only
  useEffect(() => {
    if (!isOpen) {
      hasInitialFocusedRef.current = false;
      return;
    }

    if (!hasInitialFocusedRef.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscapeRef.current) {
        e.preventDefault();
        onCloseRef.current();
      }

      // Simple Tab Trap inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus ONLY once upon opening
    if (!hasInitialFocusedRef.current) {
      hasInitialFocusedRef.current = true;
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        // Prioritize actual inputs/textareas/selects inside the modal content body
        const firstInput = modalRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
        if (firstInput) {
          firstInput.focus();
        } else {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button:not([aria-label="Close dialog"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, initialFocusRef]);

  if (!mounted || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOutsideClick) {
      onClose();
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className={`w-full ${sizeClasses[size]} bg-[#101522] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden my-auto animate-in zoom-in-95 duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-white/10 flex-shrink-0">
            <div className="space-y-0.5 min-w-0 pr-3">
              {title && (
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-slate-400">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 min-h-0 text-slate-200">
          {children}
        </div>

        {/* Optional Pinned Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-white/10 bg-black/20 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

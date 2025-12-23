'use client';

import { useEffect } from 'react';
import type { Help } from '@/lib/forms/schema';
import HelpContent from './HelpContent';

interface HelpModalProps {
  help: Help;
  isOpen: boolean;
  onClose: () => void;
  questionLabel: string;
}

export default function HelpModal({
  help,
  isOpen,
  onClose,
  questionLabel,
}: HelpModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasBlocks = help.blocks && help.blocks.length > 0;
  const hasLegacyText = help.text && !hasBlocks;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#4A4A4A] font-sans">Подсказка: {questionLabel}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {hasBlocks && help.blocks ? (
            <HelpContent blocks={help.blocks} />
          ) : hasLegacyText ? (
            <div className="text-gray-700 whitespace-pre-line">{help.text}</div>
          ) : help.link ? (
            <a
              href={help.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {help.link}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

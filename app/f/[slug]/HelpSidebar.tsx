'use client';

import { useEffect } from 'react';
import type { Help } from '@/lib/forms/schema';
import HelpContent from './HelpContent';

interface HelpSidebarProps {
  help: Help;
  isOpen: boolean;
  onClose: () => void;
  questionLabel: string;
}

export default function HelpSidebar({
  help,
  isOpen,
  onClose,
  questionLabel,
}: HelpSidebarProps) {
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

  const hasBlocks = help.blocks && help.blocks.length > 0;
  const hasLegacyText = help.text && !hasBlocks;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#4A4A4A] font-sans">Подсказка: {questionLabel}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
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
    </>
  );
}

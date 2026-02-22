"use client";

import { useEffect } from 'react';

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Dialog({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}: DialogProps) {
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

  if (!isOpen) return null;

  const typeStyles = {
    success: 'border-green-500 bg-green-900/20',
    error: 'border-red-500 bg-red-900/20',
    warning: 'border-yellow-500 bg-yellow-900/20',
    info: 'border-blue-500 bg-blue-900/20'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-[#0a0a0a] border-2 border-[#333] rounded-lg shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className={`border-b-2 ${typeStyles[type]} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeIcons[type]}</span>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>
        
        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-[#1a1a1a] rounded-b-lg flex justify-end gap-3">
          {onConfirm && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 font-bold text-sm rounded transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

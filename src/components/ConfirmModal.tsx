import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger'
}: ConfirmModalProps) {
  const colors = {
    danger: {
      bg: 'bg-rose-50',
      icon: 'bg-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
      text: 'text-rose-900',
      subtext: 'text-rose-700'
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
      text: 'text-amber-900',
      subtext: 'text-amber-700'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
      text: 'text-blue-900',
      subtext: 'text-blue-700'
    }
  };

  const color = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${color.bg} rounded-bl-full -mr-12 -mt-12 opacity-50`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`${color.icon} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <p className="text-stone-600 font-medium mb-8 leading-relaxed">
                {message}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 ${color.button} text-white py-4 rounded-2xl font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { Calendar, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (monthName: string, cloneStudents: boolean) => void;
  existingMonths: string[];
}

export default function NewMonthModal({ isOpen, onClose, onConfirm, existingMonths }: NewMonthModalProps) {
  const [monthName, setMonthName] = useState('');
  const [cloneStudents, setCloneStudents] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthName.trim()) {
      setError('يرجى إدخال اسم الشهر');
      return;
    }
    if (existingMonths.includes(monthName.trim())) {
      setError('هذا الشهر موجود بالفعل');
      return;
    }
    onConfirm(monthName.trim(), cloneStudents);
    setMonthName('');
    onClose();
  };

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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">بدء شهر جديد</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2">اسم الشهر</label>
                <input
                  type="text"
                  value={monthName}
                  onChange={(e) => {
                    setMonthName(e.target.value);
                    setError('');
                  }}
                  placeholder="مثلاً: مارس "
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800"
                  autoFocus
                />
                {error && <p className="text-rose-500 text-xs mt-2 font-bold mr-1">{error}</p>}
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={cloneStudents}
                      onChange={(e) => setCloneStudents(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-12 h-6 bg-stone-200 rounded-full peer peer-checked:bg-emerald-600 transition-all after:content-[''] after:absolute after:top-1 after:right-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:-translate-x-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-800 group-hover:text-emerald-600 transition-colors">نسخ الطلاب من الشهر الحالي</p>
                    <p className="text-xs text-stone-500 font-medium">سيتم إضافة جميع طلاب الشهر الحالي إلى الشهر الجديد تلقائياً</p>
                  </div>
                  <Copy className={`w-5 h-5 ${cloneStudents ? 'text-emerald-600' : 'text-stone-300'}`} />
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                  بدء الشهر
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { UserPlus, X, GraduationCap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Class } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, classId: string) => void;
  classes: Class[];
  defaultClass?: string | null;
}

export default function AddStudentModal({ isOpen, onClose, onAdd, classes, defaultClass }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultClass) {
        setSelectedClassId(defaultClass);
      } else {
        setSelectedClassId('');
      }
      setName('');
      setError('');
    }
  }, [isOpen, defaultClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الطالب');
      return;
    }
    if (!selectedClassId) {
      setError('يرجى اختيار الصف');
      return;
    }
    onAdd(name.trim(), selectedClassId);
    setName('');
    setSelectedClassId('');
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
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">إضافة طالب جديد</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2">اسم الطالب</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="الاسم الثلاثي أو الرباعي..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2">اختيار الصف</label>
                <div className="relative">
                  <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 pr-12 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800 appearance-none"
                  >
                    <option value="" disabled>اختر الصف...</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                {classes.length === 0 && (
                  <p className="text-amber-600 text-[10px] mt-2 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    يجب إضافة صف أولاً من تبويب "الصفوف"
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                  إضافة الطالب
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

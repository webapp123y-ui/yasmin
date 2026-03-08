import React, { useState } from 'react';
import { Search, UserPlus, Printer, CheckCircle, XCircle, ChevronRight, Filter, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student } from '../types';

interface StudentsListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
  onBulkPrint: (studentIds: string[]) => void;
  activeClassFilter: string | null;
  onClearFilter: () => void;
  onScanQR: () => void;
}

export default function StudentsList({ students, onSelectStudent, onAddStudent, onBulkPrint, activeClassFilter, onClearFilter, onScanQR }: StudentsListProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = activeClassFilter ? s.class_name === activeClassFilter : true;
    return matchesSearch && matchesClass;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between bg-white p-4 sm:p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div className="flex-1 w-full relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="بحث عن اسم الطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-2.5 sm:py-3.5 pr-10 sm:pr-12 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm sm:text-base text-stone-800 placeholder:text-stone-400"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={onScanQR}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-emerald-600 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base hover:bg-emerald-50 transition-all active:scale-95 border-2 border-emerald-600 shadow-sm"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>مسح QR</span>
          </button>
          <button
            onClick={onAddStudent}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>إضافة طالب</span>
          </button>
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onBulkPrint(selectedIds)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة QR لـ ({selectedIds.length}) طلاب</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeClassFilter && (
        <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
          <Filter className="w-5 h-5 text-emerald-600" />
          <p className="text-emerald-800 font-bold">عرض طلاب: {activeClassFilter}</p>
          <button onClick={onClearFilter} className="mr-auto text-emerald-600 hover:text-emerald-800 font-bold text-sm underline underline-offset-4">إظهار الكل</button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="p-5 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded-lg border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 sm:p-5 text-stone-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider">الطالب</th>
                <th className="p-3 sm:p-5 text-stone-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider hidden sm:table-cell">الصف</th>
                <th className="p-3 sm:p-5 text-stone-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider">الحضور</th>
                <th className="p-3 sm:p-5 text-stone-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider hidden md:table-cell">الامتحانات</th>
                <th className="p-3 sm:p-5 text-stone-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider">الرسوم</th>
                <th className="p-3 sm:p-5 w-10 sm:w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredStudents.map((student) => {
                const attendedCount = student.attendance.filter(a => a !== 'absent').length;
                const avgGrade = student.exams.length > 0
                  ? (student.exams.reduce((acc, curr) => acc + curr.grade, 0) / student.exams.length).toFixed(1)
                  : '0';

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-stone-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="p-5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-5 h-5 rounded-lg border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 sm:p-5" onClick={() => onSelectStudent(student)}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stone-100 rounded-lg sm:rounded-xl flex items-center justify-center text-stone-500 font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors text-xs sm:text-base">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-xs sm:text-base text-stone-800 group-hover:text-emerald-600 transition-colors truncate max-w-[100px] sm:max-w-none">{student.name}</span>
                            {(() => {
                              const lastAction = [...student.attendance].reverse().find(a => a !== 'absent');
                              if (!lastAction) return null;
                              return (
                                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm shrink-0 ${
                                  lastAction === 'attended_hw' ? 'bg-emerald-500' :
                                  lastAction === 'attended_incomplete_hw' ? 'bg-blue-500' :
                                  'bg-rose-500'
                                }`} title={
                                  lastAction === 'attended_hw' ? 'حضر مع الواجب' :
                                  lastAction === 'attended_incomplete_hw' ? 'حضر بنصف الواجب' :
                                  'حضر بدون واجب'
                                } />
                              );
                            })()}
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">S: {student.id.toUpperCase()}</span>
                            {student.class_id && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-stone-400">C: {student.class_id.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-5 hidden sm:table-cell" onClick={() => onSelectStudent(student)}>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">{student.class_name}</span>
                    </td>
                    <td className="p-3 sm:p-5" onClick={() => onSelectStudent(student)}>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] sm:text-sm font-bold text-stone-800">{attendedCount} من 8</span>
                        <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              attendedCount >= 6 ? 'bg-emerald-500' :
                              attendedCount >= 4 ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${(attendedCount / 8) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-5 hidden md:table-cell" onClick={() => onSelectStudent(student)}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-800">{avgGrade}</span>
                        <span className="text-[10px] text-stone-400 font-bold uppercase">متوسط</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-5" onClick={() => onSelectStudent(student)}>
                      {student.feesPaid ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-bold">مدفوع</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600">
                          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-bold">غير مدفوع</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 sm:p-5">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-stone-300 group-hover:text-emerald-600 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-stone-200" />
            </div>
            <p className="text-stone-500 font-medium">لم يتم العثور على طلاب يطابقون بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}

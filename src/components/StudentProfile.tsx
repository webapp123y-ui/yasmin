import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2, CheckCircle, Wallet, Calendar, BookOpen, AlertCircle, Info, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, AttendanceStatus, Exam } from '../types';

interface StudentProfileProps {
  student: Student;
  onBack: () => void;
  onUpdateAttendance: (studentId: string, lessonIdx: number, status: AttendanceStatus) => void;
  onAddExam: (studentId: string, exam: Exam) => void;
  onUpdateExam: (studentId: string, examId: string, grade: number) => void;
  onDeleteExam: (studentId: string, examId: string) => void;
  onToggleFees: (studentId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onPrintQR: (studentId: string) => void;
}

export default function StudentProfile({
  student,
  onBack,
  onUpdateAttendance,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onToggleFees,
  onDeleteStudent,
  onPrintQR
}: StudentProfileProps) {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamGrade, setNewExamGrade] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');

  const attendanceCycle: AttendanceStatus[] = ['absent', 'attended_hw', 'attended_incomplete_hw', 'attended_no_hw'];

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'attended_hw': return 'bg-emerald-500 text-white shadow-emerald-100';
      case 'attended_incomplete_hw': return 'bg-blue-500 text-white shadow-blue-100';
      case 'attended_no_hw': return 'bg-rose-500 text-white shadow-rose-100';
      default: return 'bg-stone-200 text-stone-500';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'attended_hw': return 'حضر + واجب';
      case 'attended_incomplete_hw': return 'حضر + واجب ناقص';
      case 'attended_no_hw': return 'حضر بدون واجب';
      default: return 'غائب';
    }
  };

  const handleAttendanceClick = (idx: number) => {
    const currentStatus = student.attendance[idx];
    const currentIdx = attendanceCycle.indexOf(currentStatus);
    const nextIdx = (currentIdx + 1) % attendanceCycle.length;
    onUpdateAttendance(student.id, idx, attendanceCycle[nextIdx]);
  };

  const handleAddExam = () => {
    if (newExamName && newExamGrade) {
      onAddExam(student.id, {
        id: Math.random().toString(36).substr(2, 9),
        name: newExamName,
        grade: parseFloat(newExamGrade)
      });
      setNewExamName('');
      setNewExamGrade('');
      setIsExamModalOpen(false);
    }
  };

  const handleStartEdit = (exam: Exam) => {
    setEditingExamId(exam.id);
    setEditGrade(exam.grade.toString());
  };

  const handleSaveEdit = (examId: string) => {
    if (editGrade !== '') {
      onUpdateExam(student.id, examId, parseFloat(editGrade));
      setEditingExamId(null);
    }
  };

  const avgGrade = student.exams.length > 0
    ? (student.exams.reduce((acc, curr) => acc + curr.grade, 0) / student.exams.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-8 rounded-3xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={onBack}
            className="p-2 sm:p-3 hover:bg-stone-50 rounded-2xl transition-all border border-stone-100 group"
          >
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-stone-400 group-hover:text-emerald-600 transition-colors" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h2 className="text-xl sm:text-3xl font-bold text-stone-900">{student.name}</h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-sm font-bold rounded-full border border-emerald-100">
                {student.class_name}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] sm:text-sm font-bold rounded-full border border-blue-100">
                S-ID: {student.id.toUpperCase()}
              </span>
              {student.class_id && (
                <span className="px-3 py-1 bg-stone-50 text-stone-700 text-[10px] sm:text-sm font-bold rounded-full border border-stone-100">
                  C-ID: {student.class_id.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-stone-500 text-xs sm:text-base font-medium flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 h-4" />
              سجل متابعة شهر: {student.month}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onToggleFees(student.id)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-105 active:scale-95 ${
              student.feesPaid
                ? 'bg-emerald-600 text-white shadow-emerald-100'
                : 'bg-rose-600 text-white shadow-rose-100'
            }`}
          >
            <Wallet className="w-4 h-4 sm:w-5 h-5" />
            <span>{student.feesPaid ? 'تم الدفع' : 'دفع المصاريف'}</span>
          </button>
          <button
            onClick={() => onPrintQR(student.id)}
            className="p-3.5 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
            title="طباعة QR"
          >
            <Printer className="w-6 h-6" />
          </button>
          <button
            onClick={() => onDeleteStudent(student.id)}
            className="p-2.5 sm:p-3.5 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
            title="حذف الطالب"
          >
            <Trash2 className="w-5 h-5 sm:w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Attendance Section - Larger Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">تتبع الحضور والواجب</h3>
              </div>
              <div className="text-stone-400">
                <Info className="w-4 h-4 sm:w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {student.attendance.map((status, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAttendanceClick(idx)}
                  className={`flex flex-col items-center justify-center gap-2 sm:gap-4 p-4 sm:p-8 rounded-3xl transition-all hover:scale-105 active:scale-95 border-2 ${
                    status === 'absent' ? 'border-stone-100 bg-stone-50' : 'border-transparent ' + getStatusColor(status)
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60">الدرس {idx + 1}</span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner ${
                    status === 'absent' ? 'bg-stone-200 text-stone-400' : 'bg-white/20 text-white'
                  }`}>
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-center leading-tight">{getStatusLabel(status)}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 p-6 bg-stone-50 rounded-2xl border border-stone-100">
              <h4 className="text-sm font-bold text-stone-500 mb-4 uppercase tracking-wider">دليل الألوان</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {attendanceCycle.map(status => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                    <span className="text-xs font-bold text-stone-600">{getStatusLabel(status)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exams Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">الامتحانات</h3>
              </div>
              <button
                onClick={() => setIsExamModalOpen(true)}
                className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-4 text-center">
              <p className="text-emerald-800 font-bold text-2xl">{avgGrade}</p>
              <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">متوسط الدرجات</p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {student.exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group">
                  <div>
                    <p className="font-bold text-stone-800">{exam.name}</p>
                    <p className="text-xs text-stone-400 font-medium">درجة الامتحان</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {editingExamId === exam.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          className="w-16 bg-white border border-emerald-200 rounded-lg p-1 text-center font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                          onBlur={() => handleSaveEdit(exam.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(exam.id)}
                        />
                      </div>
                    ) : (
                      <span 
                        onClick={() => handleStartEdit(exam)}
                        className={`text-lg font-bold cursor-pointer hover:scale-110 transition-transform ${
                          exam.grade < 10 
                            ? 'text-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)] animate-pulse' 
                            : 'text-emerald-600'
                        }`}
                        title="اضغط لتعديل الدرجة"
                      >
                        {exam.grade}
                      </span>
                    )}
                    <button
                      onClick={() => onDeleteExam(student.id, exam.id)}
                      className="p-2 text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {student.exams.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-400 text-sm font-medium">لا يوجد امتحانات مسجلة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Modal */}
      <AnimatePresence>
        {isExamModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-stone-900 mb-6">إضافة امتحان جديد</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-2">اسم الامتحان</label>
                  <input
                    type="text"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="مثلاً: امتحان شهر أكتوبر"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-2">الدرجة</label>
                  <input
                    type="number"
                    value={newExamGrade}
                    onChange={(e) => setNewExamGrade(e.target.value)}
                    placeholder="0"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAddExam}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    إضافة
                  </button>
                  <button
                    onClick={() => setIsExamModalOpen(false)}
                    className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, Plus, Trash2, ChevronLeft, Users, FileText, Camera, X, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Class, Student, AttendanceStatus } from '../types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ClassesProps {
  classes: Class[];
  students: Student[];
  currentMonth: string;
  onAddClass: (name: string) => void;
  onDeleteClass: (id: string) => void;
  onSelectClass: (className: string) => void;
  onAddExamToClass: (className: string, examName: string) => void;
  onUpdateAttendance: (studentId: string, lessonIdx: number, status: AttendanceStatus) => void;
  onToggleFees: (studentId: string) => void;
  studentCountByClass: Record<string, number>;
  onScanQR: () => void;
}

export default function Classes({ 
  classes, 
  students,
  currentMonth,
  onAddClass, 
  onDeleteClass, 
  onSelectClass, 
  onAddExamToClass,
  onUpdateAttendance,
  onToggleFees,
  studentCountByClass,
  onScanQR
}: ClassesProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [activeClass, setActiveClass] = useState<Class | null>(null);
  
  const [selectedLesson, setSelectedLesson] = useState(1);
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "attendance-qr-reader";

  const [selectedClassName, setSelectedClassName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [examName, setExamName] = useState('');

  const startScanner = async () => {
    try {
      setScannerError(null);
      
      let attempts = 0;
      const checkContainer = setInterval(async () => {
        const container = document.getElementById(containerId);
        attempts++;
        
        if (container && container.clientWidth > 0) {
          clearInterval(checkContainer);
          try {
            if (scannerRef.current) {
              try { await scannerRef.current.stop(); } catch (e) {}
            }

            const html5QrCode = new Html5Qrcode(containerId);
            scannerRef.current = html5QrCode;

            const config = {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
            };

            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              (decodedText) => {
                handleScan(decodedText);
              },
              () => {}
            );
          } catch (err: any) {
            console.error("Scanner error:", err);
            setScannerError('حدث خطأ في تشغيل الكاميرا. يرجى التأكد من منح الإذن.');
          }
        } else if (attempts > 20) {
          clearInterval(checkContainer);
          setScannerError('تعذر العثور على حاوية الكاميرا.');
        }
      }, 200);
    } catch (err) {
      setScannerError('فشل إعداد الماسح الضوئي.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {}
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    if (isAttendanceMode && activeClass) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isAttendanceMode, activeClass]);

  const handleScan = (data: string) => {
    if (scannedStudentId) return; // Guard: don't process new scans if popup is open

    let studentId = data;
    if (data.includes('studentId=')) {
      const match = data.match(/studentId=([^&]+)/);
      if (match) studentId = match[1];
    }

    const student = students.find(s => 
      s.id.toLowerCase() === studentId.toLowerCase() && 
      s.month === currentMonth && 
      s.class_name === activeClass?.name
    );

    if (student) {
      setScannedStudentId(student.id);
      // Don't stop scanner, just show popup
    }
  };

  const handleStatusSelect = async (studentId: string, lessonIdx: number, status: AttendanceStatus) => {
    await onUpdateAttendance(studentId, lessonIdx, status);
    
    // Close popup immediately after selection
    setScannedStudentId(null);
  };

  const currentScannedStudent = scannedStudentId ? students.find(s => s.id === scannedStudentId) : null;

  const handleAdd = () => {
    if (newClassName.trim()) {
      onAddClass(newClassName.trim());
      setNewClassName('');
      setIsAddModalOpen(false);
    }
  };

  const handleAddExam = () => {
    if (examName.trim() && selectedClassName) {
      onAddExamToClass(selectedClassName, examName.trim());
      setExamName('');
      setIsExamModalOpen(false);
    }
  };

  if (isAttendanceMode && activeClass) {
    return (
      <div className="space-y-6 pb-20">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setIsAttendanceMode(false)}
              className="p-2 hover:bg-stone-50 rounded-xl transition-colors text-stone-400"
            >
              <ChevronLeft className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-stone-900">تسجيل حضور: {activeClass.name}</h2>
              <p className="text-stone-500 text-sm">وجه الكاميرا نحو كود الطالب</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-100 flex-1 sm:flex-none">
              <span className="text-xs font-bold text-stone-400 pr-2">الحصة:</span>
              <select 
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(Number(e.target.value))}
                className="bg-white border border-stone-200 rounded-xl px-4 py-2 font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Continuous Scanner View */}
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden relative aspect-square sm:aspect-video max-w-3xl mx-auto bg-black">
            <div id={containerId} className="w-full h-full [&_video]:object-cover" />
            
            {/* Scanner Overlays */}
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
                
                <motion.div 
                  animate={{ top: ['10%', '90%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-4 right-4 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                />
              </div>
            </div>

            {scannerError && (
              <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-8 text-center z-20">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
                <h4 className="text-white text-lg font-bold mb-2">عذراً، تعذر تشغيل الكاميرا</h4>
                <p className="text-stone-400 text-sm mb-6">{scannerError}</p>
                <button 
                  onClick={startScanner}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  إعادة المحاولة
                </button>
              </div>
            )}
          </div>

          {/* Attendance Popup Overlay */}
          <AnimatePresence>
            {currentScannedStudent && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8"
                >
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 text-3xl font-bold mx-auto mb-4">
                      {currentScannedStudent.name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900">{currentScannedStudent.name}</h3>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onToggleFees(currentScannedStudent.id)}
                        className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-sm ${
                          currentScannedStudent.feesPaid 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse'
                        }`}
                      >
                        {currentScannedStudent.feesPaid ? 'تم دفع المصاريف' : 'دفع المصاريف'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {(() => {
                      const currentIdx = selectedLesson - 1;
                      const prevIdx = currentIdx - 1;
                      const prevStatus = prevIdx >= 0 ? currentScannedStudent.attendance[prevIdx] : null;
                      
                      // Show previous if it was Blue (incomplete) or Yellow (no hw)
                      // Blue: attended_incomplete_hw, Yellow: attended_no_hw
                      const needsPrevUpdate = prevStatus === 'attended_incomplete_hw' || prevStatus === 'attended_no_hw';

                      return (
                        <div className="flex flex-col gap-6">
                          {needsPrevUpdate && (
                            <div className="space-y-3 p-4 bg-amber-50 rounded-3xl border border-amber-100">
                              <p className="text-center font-bold text-amber-700 flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>تعديل الحصة السابقة ({prevIdx + 1})</span>
                              </p>
                              <AttendanceSelector 
                                currentStatus={prevStatus as AttendanceStatus}
                                onSelect={(status) => handleStatusSelect(currentScannedStudent.id, prevIdx, status)} 
                              />
                            </div>
                          )}
                          <div className="space-y-3 p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                            <p className="text-center font-bold text-emerald-700">تسجيل الحصة الحالية ({selectedLesson})</p>
                            <AttendanceSelector 
                              currentStatus={currentScannedStudent.attendance[currentIdx]}
                              onSelect={(status) => handleStatusSelect(currentScannedStudent.id, currentIdx, status)} 
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <button 
                    onClick={() => setScannedStudentId(null)}
                    className="w-full py-3 text-stone-400 font-bold hover:text-stone-600 transition-colors"
                  >
                    إلغاء / مسح طالب آخر
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">الصفوف الدراسية</h2>
            <p className="text-stone-500 text-sm">إدارة المجموعات والصفوف الخاصة بك</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة صف</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">{cls.name}</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">ID: {cls.id.toUpperCase()}</span>
                </div>
                <button
                  onClick={() => onDeleteClass(cls.id)}
                  className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-stone-500 mb-6">
                <Users className="w-4 h-4" />
                <span className="font-bold">{studentCountByClass[cls.name] || 0} طالب مسجل</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectClass(cls.name)}
                  className="flex-1 flex items-center justify-center gap-2 bg-stone-50 text-stone-600 py-3.5 rounded-2xl font-bold hover:bg-emerald-600 hover:text-white transition-all group/btn"
                >
                  <span>عرض الطلاب</span>
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                </button>
                <button
                  onClick={() => {
                    setActiveClass(cls);
                    setIsAttendanceMode(true);
                  }}
                  className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  title="تسجيل حضور سريع"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedClassName(cls.name);
                    setIsExamModalOpen(true);
                  }}
                  className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="إضافة امتحان للصف"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {classes.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-10 h-10 text-stone-200" />
            </div>
            <p className="text-stone-500 font-medium">لا يوجد صفوف مسجلة حالياً</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">إضافة صف جديد</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-2">اسم الصف</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="مثلاً: الصف الأول الثانوي"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAdd}
                    disabled={!newClassName.trim()}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إضافة الصف
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
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

      <AnimatePresence>
        {isExamModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">إضافة امتحان لصف {selectedClassName}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-2">اسم الامتحان</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="مثلاً: امتحان شهر أكتوبر"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-stone-800"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAddExam}
                    disabled={!examName.trim()}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إضافة الامتحان للجميع
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

function AttendanceSelector({ onSelect, currentStatus }: { onSelect: (status: AttendanceStatus) => void; currentStatus?: AttendanceStatus }) {
  const options: { status: AttendanceStatus; label: string; color: string }[] = [
    { status: 'attended_hw', label: 'حضر + واجب', color: 'bg-emerald-500' },
    { status: 'attended_incomplete_hw', label: 'حضر + نص واجب', color: 'bg-blue-500' },
    { status: 'attended_no_hw', label: 'حضر بدون واجب', color: 'bg-rose-500' },
    { status: 'absent', label: 'غائب', color: 'bg-stone-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {options.map((opt) => (
        <button
          key={opt.status}
          onClick={() => onSelect(opt.status)}
          className={`${opt.color} text-white p-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center min-h-[80px] ${
            currentStatus === opt.status ? 'ring-4 ring-white ring-inset border-2 border-stone-900/20' : ''
          }`}
        >
          <span>{opt.label}</span>
          {currentStatus === opt.status && (
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">الحالة الحالية</span>
          )}
        </button>
      ))}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  handleGoogleLogin, 
  handleLogout, 
  loginFixedUser,
  saveUserProfile,
  saveAppData,
  fetchAppData,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  User,
  onAuthStateChanged
} from './firebase';
import { 
  Student, 
  Class, 
  STORAGE_KEYS, 
  AttendanceStatus, 
  Exam 
} from './types';
import { 
  LogIn, 
  Mail, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  Loader2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentsList from './components/StudentsList';
import StudentProfile from './components/StudentProfile';
import Classes from './components/Classes';
import AddStudentModal from './components/AddStudentModal';
import NewMonthModal from './components/NewMonthModal';
import ConfirmModal from './components/ConfirmModal';
import QRScannerModal from './components/QRScannerModal';
import QRPrintTemplate from './components/QRPrintTemplate';
import { generateStudentsQR_PDF } from './utils/pdfGenerator';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeClassFilter, setActiveClassFilter] = useState<string | null>(null);
  
  // UI State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [studentsToPrint, setStudentsToPrint] = useState<Student[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        await saveUserProfile(user);
      } else {
        // Clear state on logout
        setStudents([]);
        setClasses([]);
        setMonths([]);
        setCurrentMonth('');
        setSelectedStudent(null);
        setActiveTab('dashboard');
        setDataLoaded(false);
        // Clear local storage for this user is not strictly necessary as prefix changes, 
        // but we want the next user to start fresh
      }
    });
    return unsubscribe;
  }, []);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const userPrefix = `${user.uid}_`;
        
        // 1. Load from localStorage IMMEDIATELY for speed
        const savedStudents = localStorage.getItem(userPrefix + STORAGE_KEYS.STUDENTS);
        const savedClasses = localStorage.getItem(userPrefix + STORAGE_KEYS.CLASSES);
        const savedMonths = localStorage.getItem(userPrefix + STORAGE_KEYS.MONTHS);
        const savedCurrentMonth = localStorage.getItem(userPrefix + STORAGE_KEYS.CURRENT_MONTH);
        const savedActiveTab = localStorage.getItem(userPrefix + 'active_tab');
        const savedSelectedStudentId = localStorage.getItem(userPrefix + 'selected_student_id');

        if (savedStudents || savedClasses || savedMonths || savedCurrentMonth) {
          const parsedStudents = savedStudents ? JSON.parse(savedStudents) : [];
          if (savedStudents) setStudents(parsedStudents);
          if (savedClasses) setClasses(JSON.parse(savedClasses));
          const parsedMonths = savedMonths ? JSON.parse(savedMonths) : [];
          if (savedMonths) setMonths(parsedMonths);
          
          if (savedCurrentMonth) {
            setCurrentMonth(JSON.parse(savedCurrentMonth));
          } else if (parsedMonths.length > 0) {
            setCurrentMonth(parsedMonths[parsedMonths.length - 1]);
          }

          if (savedActiveTab) setActiveTab(JSON.parse(savedActiveTab));
          if (savedSelectedStudentId) {
            const sid = JSON.parse(savedSelectedStudentId);
            const student = parsedStudents.find((s: Student) => s.id === sid);
            if (student) setSelectedStudent(student);
          }
          setDataLoaded(true);
        }
        
        // 2. Sync from Firestore in the background
        try {
          const firestoreData = await fetchAppData(user.uid);
          if (firestoreData) {
            const fStudents = firestoreData.students || [];
            const fClasses = firestoreData.classes || [];
            const fMonths = firestoreData.months || [];
            const fCurrentMonth = firestoreData.currentMonth || (fMonths.length > 0 ? fMonths[fMonths.length - 1] : '');
            const fActiveTab = firestoreData.activeTab || 'dashboard';
            const fSelectedStudentId = firestoreData.selectedStudentId || null;
            
            setStudents(fStudents);
            setClasses(fClasses);
            setMonths(fMonths);
            setCurrentMonth(fCurrentMonth);
            
            if (fActiveTab) setActiveTab(fActiveTab);

            // If we don't have a selected student yet, or the one we have is from local, 
            // try to find it in the fresh firestore data
            const sid = fSelectedStudentId || (savedSelectedStudentId ? JSON.parse(savedSelectedStudentId) : null);
            if (sid) {
              const student = fStudents.find((s: Student) => s.id === sid);
              if (student) setSelectedStudent(student);
            }

            setDataLoaded(true);
          } else if (!savedStudents && !savedClasses) {
            setDataLoaded(true);
          }
        } catch (error) {
          console.error("Error syncing from Firestore:", error);
          setDataLoaded(true); // Still mark as loaded to allow usage
        }

        // Check for studentId in URL
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('studentId');
        if (studentId) {
          // We'll check students state in a separate effect or after sync
        }
      }
    };
    loadData();
  }, [user]);

  // Save Data (Debounced for Firestore)
  useEffect(() => {
    if (user && dataLoaded) {
      const userPrefix = `${user.uid}_`;
      
      // 1. Save to localStorage IMMEDIATELY (Fast)
      localStorage.setItem(userPrefix + STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem(userPrefix + STORAGE_KEYS.CLASSES, JSON.stringify(classes));
      localStorage.setItem(userPrefix + STORAGE_KEYS.MONTHS, JSON.stringify(months));
      localStorage.setItem(userPrefix + STORAGE_KEYS.CURRENT_MONTH, JSON.stringify(currentMonth));
      localStorage.setItem(userPrefix + 'active_tab', JSON.stringify(activeTab));
      localStorage.setItem(userPrefix + 'selected_student_id', JSON.stringify(selectedStudent?.id || null));
      
      // 2. Debounce Firestore Save (Prevents lag on every click)
      const debounceTimer = setTimeout(async () => {
        setIsSaving(true);
        try {
          await saveAppData(user.uid, {
            students,
            classes,
            months,
            currentMonth,
            activeTab,
            selectedStudentId: selectedStudent?.id || null
          });
        } catch (error) {
          console.error("Firestore save error:", error);
        } finally {
          setIsSaving(false);
        }
      }, 2000); // Wait 2 seconds of inactivity before saving to cloud
      
      return () => clearTimeout(debounceTimer);
    }
  }, [students, classes, months, currentMonth, user, dataLoaded]);

  // Handle URL student selection
  useEffect(() => {
    if (dataLoaded && students.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get('studentId');
      if (studentId) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          setSelectedStudent(student);
          setActiveTab('students');
          // Clear URL params without refreshing
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [dataLoaded, students.length]);
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      if (emailMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setLoginError('البريد الإلكتروني مستخدم بالفعل');
      } else if (error.code === 'auth/weak-password') {
        setLoginError('كلمة المرور ضعيفة جداً');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.code === 'auth/operation-not-allowed') {
        setLoginError('خطأ: يجب تفعيل تسجيل الدخول بالبريد الإلكتروني في إعدادات Firebase Console.');
      } else if (error.code === 'auth/network-request-failed') {
        setLoginError('خطأ في الاتصال: يرجى التأكد من إضافة نطاق الموقع (run.app) في القائمة المصرح بها في Firebase Console.');
      } else {
        setLoginError('حدث خطأ أثناء تسجيل الدخول: ' + error.message);
      }
    }
  };

  // Student Handlers
  const handleAddStudent = (name: string, class_name: string) => {
    // Generate a 6-digit numeric ID
    const studentId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Find class ID
    const studentClass = classes.find(c => c.name === class_name);
    const classId = studentClass?.id || '';

    const newStudent: Student = {
      id: studentId,
      name,
      class_name,
      class_id: classId,
      month: currentMonth,
      attendance: Array(8).fill('absent'),
      exams: [],
      feesPaid: false,
      createdAt: Date.now()
    };
    setStudents(prev => [newStudent, ...prev]);
  };

  const handleUpdateAttendance = (studentId: string, lessonIdx: number, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId 
        ? { ...s, attendance: s.attendance.map((a, i) => i === lessonIdx ? status : a) }
        : s
    ));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, attendance: prev.attendance.map((a, i) => i === lessonIdx ? status : a) } : null);
    }
  };

  const handleAddExam = (studentId: string, exam: Exam) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, exams: [...s.exams, exam] } : s
    ));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, exams: [...prev.exams, exam] } : null);
    }
  };

  const handleUpdateExam = (studentId: string, examId: string, grade: number) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId 
        ? { ...s, exams: s.exams.map(e => e.id === examId ? { ...e, grade } : e) }
        : s
    ));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, exams: prev.exams.map(e => e.id === examId ? { ...e, grade } : e) } : null);
    }
  };

  const handleDeleteExam = (studentId: string, examId: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, exams: s.exams.filter(e => e.id !== examId) } : s
    ));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, exams: prev.exams.filter(e => e.id !== examId) } : null);
    }
  };

  const handleToggleFees = (studentId: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, feesPaid: !s.feesPaid } : s
    ));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => prev ? { ...prev, feesPaid: !prev.feesPaid } : null);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف طالب',
      message: 'هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      onConfirm: () => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setSelectedStudent(null);
      }
    });
  };

  // Class Handlers
  const handleAddClass = (name: string) => {
    // Generate a 3-digit numeric ID for class
    const classId = Math.floor(100 + Math.random() * 900).toString();
    const newClass: Class = { id: classId, name };
    setClasses(prev => [...prev, newClass]);
  };

  const handleDeleteClass = (id: string) => {
    const cls = classes.find(c => c.id === id);
    const studentCount = students.filter(s => s.class_name === cls?.name).length;
    
    setConfirmConfig({
      isOpen: true,
      title: 'حذف صف',
      message: `هل أنت متأكد من حذف صف "${cls?.name}"؟ يوجد ${studentCount} طلاب مسجلين في هذا الصف.`,
      variant: 'danger',
      onConfirm: () => {
        setClasses(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  const handleAddExamToClass = (className: string, examName: string) => {
    const examId = Math.random().toString(36).substr(2, 9);
    setStudents(prev => prev.map(s => {
      if (s.class_name === className && s.month === currentMonth) {
        return {
          ...s,
          exams: [...s.exams, { id: examId, name: examName, grade: 0 }]
        };
      }
      return s;
    }));
    
    if (selectedStudent && selectedStudent.class_name === className && selectedStudent.month === currentMonth) {
      setSelectedStudent(prev => prev ? {
        ...prev,
        exams: [...prev.exams, { id: examId, name: examName, grade: 0 }]
      } : null);
    }
  };

  // Month Handlers
  const handleStartNewMonth = (monthName: string, cloneStudents: boolean) => {
    setMonths(prev => [...prev, monthName]);
    setCurrentMonth(monthName);
    
    if (cloneStudents) {
      const currentMonthStudents = students.filter(s => s.month === currentMonth);
      const clonedStudents = currentMonthStudents.map(s => ({
        ...s,
        id: Math.floor(100000 + Math.random() * 900000).toString(),
        month: monthName,
        class_id: s.class_id,
        attendance: Array(8).fill('absent'),
        exams: [],
        feesPaid: false,
        createdAt: Date.now()
      }));
      setStudents(prev => [...clonedStudents, ...prev]);
    }
  };

  // QR Handlers
  const handleScanQR = (data: string) => {
    let studentId = data;
    
    // If it's a URL, extract the studentId parameter
    if (data.includes('studentId=')) {
      try {
        const url = new URL(data);
        studentId = url.searchParams.get('studentId') || data;
      } catch (e) {
        // Fallback if URL parsing fails
        const match = data.match(/studentId=([^&]+)/);
        if (match) studentId = match[1];
      }
    }

    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setActiveTab('students');
      setIsQRScannerOpen(false);
    }
  };

  const handlePrintQR = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    setStudentsToPrint([student]);
    setIsSaving(true);
    
    // Small delay to allow template to render
    setTimeout(async () => {
      await generateStudentsQR_PDF('qr-print-template', `QR-${student.name}`);
      setIsSaving(false);
      setStudentsToPrint([]);
    }, 500);
  };

  const handleBulkPrint = async (studentIds: string[]) => {
    const selectedStudents = students.filter(s => studentIds.includes(s.id));
    if (selectedStudents.length === 0) return;
    
    setStudentsToPrint(selectedStudents);
    setIsSaving(true);
    
    setTimeout(async () => {
      await generateStudentsQR_PDF('qr-print-template', `QR-مجموعة-طلاب`);
      setIsSaving(false);
      setStudentsToPrint([]);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 sm:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-12 -mt-12 opacity-50" />
          
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-10">
              <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 mb-6">
                <BookOpen className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold text-stone-900 mb-2">طلابـي</h1>
              <p className="text-stone-500 font-medium">نظام إدارة الطلاب الذكي</p>
            </div>

            <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-8">
              <button
                onClick={() => setAuthMode('google')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${authMode === 'google' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                جوجل
              </button>
              <button
                onClick={() => setAuthMode('email')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${authMode === 'email' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                البريد الإلكتروني
              </button>
            </div>

            {authMode === 'google' ? (
              <div className="space-y-6">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white border-2 border-stone-100 text-stone-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                  <span>تسجيل الدخول باستخدام جوجل</span>
                </button>
                
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                    إذا واجهت خطأ "unauthorized-domain"، يرجى التأكد من إضافة نطاق التطبيق في إعدادات Firebase.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {emailMode === 'signup' && (
                  <div className="relative">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="الاسم الكامل"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800"
                      required
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-stone-800"
                    required
                  />
                </div>

                {loginError && (
                  <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                >
                  {emailMode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                </button>

                <p className="text-center text-stone-500 font-medium">
                  {emailMode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                  <button
                    type="button"
                    onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                    className="text-emerald-600 font-bold mr-2 hover:underline"
                  >
                    {emailMode === 'signin' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                  </button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const currentMonthStudents = students.filter(s => s.month === currentMonth);
  const studentCountByClass = classes.reduce((acc, cls) => {
    acc[cls.name] = currentMonthStudents.filter(s => s.class_name === cls.name).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      months={months}
      onStartNewMonth={() => setIsNewMonthModalOpen(true)}
      isSaving={isSaving}
      user={user}
      onLogout={handleLogout}
    >
      <AnimatePresence mode="wait">
        {selectedStudent ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <StudentProfile
              student={selectedStudent}
              onBack={() => setSelectedStudent(null)}
              onUpdateAttendance={handleUpdateAttendance}
              onAddExam={handleAddExam}
              onUpdateExam={handleUpdateExam}
              onDeleteExam={handleDeleteExam}
              onToggleFees={handleToggleFees}
              onDeleteStudent={handleDeleteStudent}
              onPrintQR={handlePrintQR}
            />
          </motion.div>
        ) : activeTab === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Dashboard 
              students={currentMonthStudents} 
              onSelectStudent={setSelectedStudent} 
            />
          </motion.div>
        ) : activeTab === 'students' ? (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StudentsList
              students={currentMonthStudents}
              onSelectStudent={setSelectedStudent}
              onAddStudent={() => setIsAddStudentModalOpen(true)}
              onBulkPrint={handleBulkPrint}
              activeClassFilter={activeClassFilter}
              onClearFilter={() => setActiveClassFilter(null)}
              onScanQR={() => setIsQRScannerOpen(true)}
            />
          </motion.div>
        ) : activeTab === 'classes' ? (
          <motion.div
            key="classes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Classes
              classes={classes}
              students={students}
              currentMonth={currentMonth}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onSelectClass={(name) => {
                setActiveClassFilter(name);
                setActiveTab('students');
              }}
              onAddExamToClass={handleAddExamToClass}
              onUpdateAttendance={handleUpdateAttendance}
              onToggleFees={handleToggleFees}
              studentCountByClass={studentCountByClass}
              onScanQR={() => setIsQRScannerOpen(true)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAdd={handleAddStudent}
        classes={classes}
        defaultClass={activeClassFilter}
      />

      <NewMonthModal
        isOpen={isNewMonthModalOpen}
        onClose={() => setIsNewMonthModalOpen(false)}
        onConfirm={handleStartNewMonth}
        existingMonths={months}
      />

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleScanQR}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
      />

      {/* Hidden Print Template */}
      <div 
        className="fixed -left-[2000px] top-0 pointer-events-none"
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
      >
        {studentsToPrint.length > 0 && (
          <QRPrintTemplate students={studentsToPrint} />
        )}
      </div>
    </Layout>
  );
}

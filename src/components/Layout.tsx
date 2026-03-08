import React, { useState } from 'react';
import { LayoutDashboard, Users, GraduationCap, Menu, X, ChevronLeft, Calendar, Loader2, LogOut, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  months: string[];
  onStartNewMonth: () => void;
  isSaving?: boolean;
  user: User;
  onLogout: () => void;
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  currentMonth, 
  setCurrentMonth, 
  months, 
  onStartNewMonth, 
  isSaving,
  user,
  onLogout
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'students', label: 'الطلاب', icon: Users },
    { id: 'classes', label: 'الصفوف', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-right" dir="rtl">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-stone-100 p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          <span>طلابـي</span>
        </h1>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-stone-50 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6 text-stone-600" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 right-0 w-72 bg-white border-l border-stone-100 flex flex-col z-[60] lg:relative lg:translate-x-0 ${
                !isSidebarOpen && 'hidden lg:flex'
              }`}
            >
              <div className="p-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                  <BookOpen className="w-8 h-8" />
                  <span>طلابـي</span>
                </h1>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-stone-50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="px-4 mb-6">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>الشهر الحالي</span>
                  </div>
                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button
                    onClick={onStartNewMonth}
                    className="w-full mt-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    بدء شهر جديد
                  </button>

                  <div className="relative h-6 mt-3">
                    <AnimatePresence>
                      {isSaving && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute inset-0 flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>جاري حفظ التغييرات...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                      activeTab === item.id
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-stone-400'}`} />
                    <span className="font-medium">{item.label}</span>
                    {activeTab === item.id && <ChevronLeft className="w-4 h-4 mr-auto" />}
                  </button>
                ))}
              </nav>

              <div className="p-6 border-t border-stone-100">
                <div className="bg-stone-50 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-stone-500">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
                    ) : (
                      <Users className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{user.displayName || 'معلم'}</p>
                    <button 
                      onClick={onLogout}
                      className="text-[10px] text-rose-500 font-bold flex items-center gap-1 hover:underline"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-3 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

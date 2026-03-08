import React from 'react';
import { Users, CheckCircle, AlertCircle, Trophy, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { Student } from '../types';

interface DashboardProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export default function Dashboard({ students, onSelectStudent }: DashboardProps) {
  const totalStudents = students.length;
  
  const unpaidStudents = students.filter(s => !s.feesPaid);

  const topStudents = [...students]
    .map(s => ({
      ...s,
      avgGrade: s.exams.length > 0 
        ? s.exams.reduce((acc, curr) => acc + curr.grade, 0) / s.exams.length
        : 0
    }))
    .sort((a, b) => b.avgGrade - a.avgGrade)
    .slice(0, 5);

  const stats = [
    { label: 'إجمالي الطلاب', value: totalStudents, icon: Users, color: 'bg-blue-500', shadow: 'shadow-blue-100' },
    { label: 'رسوم غير مدفوعة', value: unpaidStudents.length, icon: AlertCircle, color: 'bg-rose-500', shadow: 'shadow-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <p className="text-stone-500 text-xs sm:text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Students */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">أوائل الطلاب</h3>
          </div>
          <div className="space-y-4">
            {topStudents.map((student, idx) => (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer group border border-transparent hover:border-stone-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-amber-100 text-amber-600' :
                    idx === 1 ? 'bg-stone-100 text-stone-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-stone-50 text-stone-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-800 group-hover:text-emerald-600 transition-colors">{student.name}</p>
                      {(() => {
                        const lastAction = [...student.attendance].reverse().find(a => a !== 'absent');
                        if (!lastAction) return null;
                        return (
                          <div className={`w-2 h-2 rounded-full shadow-sm shrink-0 ${
                            lastAction === 'attended_hw' ? 'bg-emerald-500' :
                            lastAction === 'attended_incomplete_hw' ? 'bg-blue-500' :
                            'bg-rose-500'
                          }`} />
                        );
                      })()}
                    </div>
                    <p className="text-xs text-stone-500">{student.class_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{student.avgGrade.toFixed(1)}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">متوسط الدرجة</p>
                </div>
              </div>
            ))}
            {topStudents.length === 0 && (
              <p className="text-center text-stone-400 py-8 italic">لا يوجد بيانات كافية حالياً</p>
            )}
          </div>
        </motion.div>

        {/* Unpaid Fees */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">رسوم غير مدفوعة</h3>
          </div>
          <div className="space-y-4">
            {unpaidStudents.slice(0, 5).map((student) => (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-rose-50/50 transition-colors cursor-pointer group border border-transparent hover:border-rose-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-800 group-hover:text-rose-600 transition-colors">{student.name}</p>
                      {(() => {
                        const lastAction = [...student.attendance].reverse().find(a => a !== 'absent');
                        if (!lastAction) return null;
                        return (
                          <div className={`w-2 h-2 rounded-full shadow-sm shrink-0 ${
                            lastAction === 'attended_hw' ? 'bg-emerald-500' :
                            lastAction === 'attended_incomplete_hw' ? 'bg-blue-500' :
                            'bg-rose-500'
                          }`} />
                        );
                      })()}
                    </div>
                    <p className="text-xs text-stone-500">{student.class_name}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="px-3 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">غير مدفوع</span>
                </div>
              </div>
            ))}
            {unpaidStudents.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-stone-500 font-medium">جميع الرسوم مدفوعة!</p>
              </div>
            )}
            {unpaidStudents.length > 5 && (
              <p className="text-center text-stone-400 text-sm mt-4">وهناك {unpaidStudents.length - 5} طلاب آخرين...</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

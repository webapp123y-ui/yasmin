import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export type AttendanceStatus = 'absent' | 'attended_hw' | 'attended_incomplete_hw' | 'attended_no_hw';

export interface Exam {
  id: string;
  name: string;
  grade: number;
}

export interface Student {
  id: string;
  name: string;
  class_name: string;
  class_id?: string;
  month: string;
  attendance: AttendanceStatus[];
  exams: Exam[];
  feesPaid: boolean;
  createdAt: number;
}

export interface Class {
  id: string;
  name: string;
}

export const STORAGE_KEYS = {
  STUDENTS: 'my_students_data',
  CLASSES: 'my_students_classes',
  MONTHS: 'my_students_months',
  CURRENT_MONTH: 'my_students_current_month',
};

export const formatDate = (date: Date | string) => {
  return format(new Date(date), 'eeee, d MMMM yyyy', { locale: ar });
};

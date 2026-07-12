export type Gender = 'L' | 'P'; // L = Laki-laki, P = Perempuan

export interface Student {
  id: string;
  name: string;
  nisn: string;
  gender: Gender;
  parentName: string;
  phone: string;
  status: 'aktif' | 'pindahan' | 'keluar';
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A'; // Hadir, Sakit, Izin, Alpa

export interface AttendanceDay {
  date: string; // YYYY-MM-DD
  records: {
    [studentId: string]: AttendanceStatus;
  };
}

export interface CashRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'masuk' | 'keluar';
  amount: number;
  description: string;
  category: string;
}

export interface PiketGroup {
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  studentIds: string[];
}

export interface AgendaItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  type: 'tugas' | 'pengumuman' | 'kegiatan';
  dueDate?: string; // YYYY-MM-DD for tasks
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  subject: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  teacher: string;
}

export interface GradeItem {
  id: string;
  subject: string;
  title: string;
  date: string; // YYYY-MM-DD
  type?: 'formatif' | 'sumatif'; // 'formatif' | 'sumatif' Kurikulum Merdeka
  scores: {
    [studentId: string]: number; // score 0-100
  };
}

export interface ClassStructure {
  waliKelas: string;
  ketuaKelas: string;
  wakilKetua: string;
  sekretaris: string;
  bendahara: string;
}

export interface ClassInfo {
  className: string;
  academicYear: string;
  schoolName: string;
}

export interface ClassData {
  classInfo: ClassInfo;
  students: Student[];
  attendance: AttendanceDay[];
  cash: CashRecord[];
  piket: PiketGroup[];
  agendas: AgendaItem[];
  structure: ClassStructure;
  schedules: ScheduleItem[];
  grades: GradeItem[];
}

export interface TeacherAccount {
  id: string;
  username: string;
  name: string;
  className: string;
  role: 'teacher' | 'admin';
  photoUrl?: string;
  nip?: string;
  email?: string;
  phone?: string;
}

export interface SchoolAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  important: boolean;
}

export interface SchoolAchievement {
  id: string;
  title: string;
  year: string;
  description: string;
}

export interface SchoolInfo {
  schoolName: string;
  npsn: string;
  address: string;
  principal: string;
  vision: string;
  mission: string[];
  phone: string;
  email: string;
  announcements: SchoolAnnouncement[];
  achievements: SchoolAchievement[];
  logoUrl?: string;
}

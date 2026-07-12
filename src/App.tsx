import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  Calendar, 
  BookOpen, 
  LayoutDashboard, 
  ClipboardList,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  Award,
  Clock,
  School,
  LogOut,
  Download,
  Shield
} from 'lucide-react';

import { 
  Student, 
  AttendanceDay, 
  CashRecord, 
  PiketGroup, 
  AgendaItem, 
  ClassStructure, 
  ClassInfo, 
  AttendanceStatus,
  ScheduleItem,
  GradeItem,
  TeacherAccount,
  SchoolInfo
} from './types';

import ClassOverview from './components/ClassOverview';
import StudentManager from './components/StudentManager';
import AttendanceManager from './components/AttendanceManager';
import CashManager from './components/CashManager';
import PiketManager from './components/PiketManager';
import AgendaManager from './components/AgendaManager';
import ScheduleManager from './components/ScheduleManager';
import GradeManager from './components/GradeManager';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminExportPortal from './components/AdminExportPortal';
import AdminPanel from './components/AdminPanel';
import KalenderPendidikan from './components/KalenderPendidikan';
import ModulAjarGenerator from './components/ModulAjarGenerator';
import { AnimatePresence } from 'motion/react';

// Default school-wide configuration for SD Negeri Cimandirasa
const defaultSchoolInfo: SchoolInfo = {
  schoolName: 'SD Negeri Cimandirasa',
  npsn: '20239485',
  address: 'Jl. Raya Cimandirasa No. 45, Cimandirasa, Banten',
  principal: 'Haji Mulyono, M.Pd.',
  vision: 'Mewujudkan insan yang berakhlak mulia, cerdas, kreatif, berbudaya, dan unggul dalam prestasi berbasis kearifan lokal.',
  mission: [
    'Menyelenggarakan pembelajaran berkualitas yang menyenangkan bagi anak didik.',
    'Menanamkan nilai-nilai moral keagamaan dan budi pekerti yang kokoh.',
    'Mengembangkan bakat seni, olahraga, dan kreativitas siswa secara berkala.',
    'Meningkatkan literasi digital guru serta pemanfaatan sarana teknologi edukatif.'
  ],
  phone: '(021) 893-4857',
  email: 'info@sdncimandirasa.sch.id',
  announcements: [
    {
      id: 'ann_1',
      title: 'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran Baru',
      content: 'Pendaftaran siswa baru SDN Cimandirasa dibuka mulai 1 Juni s.d 15 Juli 2026. Persyaratan meliputi Akta Kelahiran, Kartu Keluarga, dan pas foto terbaru. Silakan hubungi panitia PPDB di sekolah pada jam kerja.',
      date: '2026-06-01',
      author: 'Kepala Sekolah',
      important: true
    },
    {
      id: 'ann_2',
      title: 'Libur Akhir Tahun Pelajaran & Pembagian Rapor',
      content: 'Pembagian rapor akan dilaksanakan serentak pada hari Jumat depan. Setelah itu, libur akhir tahun pelajaran dimulai dari tanggal 20 Juni hingga 10 Juli 2026. Kegiatan belajar mengajar semester baru dimulai 13 Juli 2026.',
      date: '2026-06-12',
      author: 'Haji Mulyono, M.Pd.',
      important: false
    }
  ],
  achievements: [
    { id: 'ach_1', title: 'Juara 1 Lomba Cerdas Cermat Tingkat Kabupaten', year: '2025', description: 'Diraih oleh Tim LCC Kelas VI yang beranggotakan Achmad Fauzi, Amanda Putri, dan Farhan Ramadhan.' },
    { id: 'ach_2', title: 'Peringkat Harapan II Seni Tari Kreasi Provinsi', year: '2025', description: 'Kelompok tari SDN Cimandirasa membawakan Tari Jaipong Kreasi Baru dengan sangat gemilang.' }
  ]
};

// Seeding standard default accounts
const defaultTeachers: TeacherAccount[] = [
  { id: 't_admin', username: 'gnd', name: 'Operator Utama (gnd)', className: 'Administrator', role: 'admin' },
  { id: 't_siti', username: 'bu_siti', name: 'Siti Rahmawati, S.Pd.', className: 'Kelas 6A', role: 'teacher' },
  { id: 't_budi', username: 'pak_budi', name: 'Budi Prasetyo, M.Si.', className: 'Kelas 5', role: 'teacher' },
  { id: 't_indah', username: 'bu_indah', name: 'Indah Permatasari, S.Sn.', className: 'Kelas 4B', role: 'teacher' }
];

const defaultPasswords: { [username: string]: string } = {
  'gnd': 'gnd',
  'bu_siti': 'siti123',
  'pak_budi': 'budi123',
  'bu_indah': 'indah123'
};

// Default structures and blank states
const defaultStructure: ClassStructure = {
  waliKelas: 'Siti Rahmawati, S.Pd.',
  ketuaKelas: 'Achmad Fauzi',
  wakilKetua: 'Amanda Putri',
  sekretaris: 'Farhan Ramadhan',
  bendahara: 'Indah Permatasari'
};

const defaultClassInfo: ClassInfo = {
  className: 'Kelas VI-A',
  schoolName: 'SD Negeri Cimandirasa',
  academicYear: '2026/2027'
};

const blankPiket: PiketGroup[] = [
  { day: 'Senin', studentIds: [] },
  { day: 'Selasa', studentIds: [] },
  { day: 'Rabu', studentIds: [] },
  { day: 'Kamis', studentIds: [] },
  { day: 'Jumat', studentIds: [] },
  { day: 'Sabtu', studentIds: [] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'siswa' | 'presensi' | 'kas' | 'piket' | 'agenda' | 'jadwal' | 'nilai' | 'administrasi' | 'admin_panel' | 'kalender' | 'modul_ajar'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Navigation & Auth states
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>(() => {
    const saved = localStorage.getItem('school_view_mode');
    return (saved as 'landing' | 'dashboard') || 'landing';
  });

  const [currentUser, setCurrentUser] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('school_current_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.username === 'admin') {
        return { id: 't_admin', username: 'gnd', name: 'Operator Utama (gnd)', className: 'Administrator', role: 'admin' };
      }
      return parsed;
    }
    return null;
  });

  const [showLoginModal, setShowLoginModal] = useState(false);

  // 2. School-wide profile states (editable by Admin)
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('school_general_info');
    return saved ? JSON.parse(saved) : defaultSchoolInfo;
  });

  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => {
    const saved = localStorage.getItem('school_teachers_registry');
    let loaded = saved ? JSON.parse(saved) : defaultTeachers;
    const hasOldAdmin = loaded.some((t: any) => t.username === 'admin');
    const hasNewAdmin = loaded.some((t: any) => t.username === 'gnd');
    if (hasOldAdmin || !hasNewAdmin) {
      loaded = loaded.filter((t: any) => t.username !== 'admin');
      if (!loaded.some((t: any) => t.username === 'gnd')) {
        loaded.unshift({ id: 't_admin', username: 'gnd', name: 'Operator Utama (gnd)', className: 'Administrator', role: 'admin' });
      }
    }
    return loaded;
  });

  const [passwords, setPasswords] = useState<{ [username: string]: string }>(() => {
    const saved = localStorage.getItem('school_passwords_registry');
    let loaded = saved ? JSON.parse(saved) : defaultPasswords;
    if ('admin' in loaded || !('gnd' in loaded)) {
      delete loaded['admin'];
      loaded['gnd'] = 'gnd';
    }
    return loaded;
  });

  // Admin selected teacher/classroom to manage
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState<string>(() => {
    const saved = localStorage.getItem('school_admin_selected_teacher_id');
    if (saved) return saved;
    const firstTeacher = defaultTeachers.find(t => t.role === 'teacher');
    return firstTeacher ? firstTeacher.id : '';
  });

  useEffect(() => {
    localStorage.setItem('school_admin_selected_teacher_id', selectedClassTeacherId);
  }, [selectedClassTeacherId]);

  const activeClassTeacherId = currentUser?.role === 'admin'
    ? (selectedClassTeacherId || (teachers.find(t => t.role === 'teacher')?.id || 't_siti'))
    : (currentUser?.id || '');

  // 3. Isolated Class states (Active teacher's class details)
  const [classInfo, setClassInfo] = useState<ClassInfo>(defaultClassInfo);
  const [structure, setStructure] = useState<ClassStructure>(defaultStructure);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [cash, setCash] = useState<CashRecord[]>([]);
  const [piket, setPiket] = useState<PiketGroup[]>(blankPiket);
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);

  // Sync general portal states to local storage
  useEffect(() => {
    localStorage.setItem('school_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('school_current_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('school_general_info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem('school_teachers_registry', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('school_passwords_registry', JSON.stringify(passwords));
  }, [passwords]);

  // Load isolated class data whenever active teacher changes
  useEffect(() => {
    if (!currentUser) return;

    const prefix = activeClassTeacherId;
    if (!prefix) return;

    const savedInfo = localStorage.getItem(`class_info_${prefix}`);
    const savedStructure = localStorage.getItem(`class_structure_${prefix}`);
    const savedStudents = localStorage.getItem(`class_students_${prefix}`);
    const savedAttendance = localStorage.getItem(`class_attendance_${prefix}`);
    const savedCash = localStorage.getItem(`class_cash_${prefix}`);
    const savedPiket = localStorage.getItem(`class_piket_${prefix}`);
    const savedAgendas = localStorage.getItem(`class_agendas_${prefix}`);
    const savedSchedules = localStorage.getItem(`class_schedules_${prefix}`);
    const savedGrades = localStorage.getItem(`class_grades_${prefix}`);

    if (savedInfo) {
      setClassInfo(JSON.parse(savedInfo));
      setStructure(savedStructure ? JSON.parse(savedStructure) : defaultStructure);
      setStudents(savedStudents ? JSON.parse(savedStudents) : []);
      setAttendance(savedAttendance ? JSON.parse(savedAttendance) : []);
      setCash(savedCash ? JSON.parse(savedCash) : []);
      setPiket(savedPiket ? JSON.parse(savedPiket) : blankPiket);
      setAgendas(savedAgendas ? JSON.parse(savedAgendas) : []);
      setSchedules(savedSchedules ? JSON.parse(savedSchedules) : []);
      setGrades(savedGrades ? JSON.parse(savedGrades) : []);
    } else {
      // Find the teacher account to generate initial template
      const correspondingTeacher = teachers.find(t => t.id === prefix) || currentUser;
      const initialData = getInitialClassData(correspondingTeacher);
      setClassInfo(initialData.classInfo);
      setStructure(initialData.structure);
      setStudents(initialData.students);
      setAttendance(initialData.attendance);
      setCash(initialData.cash);
      setPiket(initialData.piket);
      setAgendas(initialData.agendas);
      setSchedules(initialData.schedules);
      setGrades(initialData.grades);

      localStorage.setItem(`class_info_${prefix}`, JSON.stringify(initialData.classInfo));
      localStorage.setItem(`class_structure_${prefix}`, JSON.stringify(initialData.structure));
      localStorage.setItem(`class_students_${prefix}`, JSON.stringify(initialData.students));
      localStorage.setItem(`class_attendance_${prefix}`, JSON.stringify(initialData.attendance));
      localStorage.setItem(`class_cash_${prefix}`, JSON.stringify(initialData.cash));
      localStorage.setItem(`class_piket_${prefix}`, JSON.stringify(initialData.piket));
      localStorage.setItem(`class_agendas_${prefix}`, JSON.stringify(initialData.agendas));
      localStorage.setItem(`class_schedules_${prefix}`, JSON.stringify(initialData.schedules));
      localStorage.setItem(`class_grades_${prefix}`, JSON.stringify(initialData.grades));
    }
  }, [activeClassTeacherId, currentUser, teachers]);

  // Sync isolated class data to local storage on changes
  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_info_${activeClassTeacherId}`, JSON.stringify(classInfo));
  }, [classInfo, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_structure_${activeClassTeacherId}`, JSON.stringify(structure));
  }, [structure, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_students_${activeClassTeacherId}`, JSON.stringify(students));
  }, [students, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_attendance_${activeClassTeacherId}`, JSON.stringify(attendance));
  }, [attendance, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_cash_${activeClassTeacherId}`, JSON.stringify(cash));
  }, [cash, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_piket_${activeClassTeacherId}`, JSON.stringify(piket));
  }, [piket, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_agendas_${activeClassTeacherId}`, JSON.stringify(agendas));
  }, [agendas, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_schedules_${activeClassTeacherId}`, JSON.stringify(schedules));
  }, [schedules, activeClassTeacherId]);

  useEffect(() => {
    if (!activeClassTeacherId) return;
    localStorage.setItem(`class_grades_${activeClassTeacherId}`, JSON.stringify(grades));
  }, [grades, activeClassTeacherId]);


  // Helper function to build custom prefilled data for newly loaded accounts
  function getInitialClassData(teacher: TeacherAccount): {
    classInfo: ClassInfo;
    students: Student[];
    attendance: AttendanceDay[];
    cash: CashRecord[];
    piket: PiketGroup[];
    agendas: AgendaItem[];
    structure: ClassStructure;
    schedules: ScheduleItem[];
    grades: GradeItem[];
  } {
    const isSiti = teacher.username === 'bu_siti';
    
    const studentsList: Student[] = isSiti ? [
      { id: 'std_1', name: 'Achmad Fauzi', nisn: '0129384750', gender: 'L', parentName: 'Hendra Fauzi', phone: '08123456780', status: 'aktif' },
      { id: 'std_2', name: 'Amanda Putri', nisn: '0138475831', gender: 'P', parentName: 'Rian Raharjo', phone: '08123456781', status: 'aktif' },
      { id: 'std_3', name: 'Budi Santoso', nisn: '0148273642', gender: 'L', parentName: 'Gatot Santoso', phone: '08123456782', status: 'aktif' },
      { id: 'std_4', name: 'Citra Lestari', nisn: '0158273653', gender: 'P', parentName: 'Rudi Lestari', phone: '08123456783', status: 'aktif' },
      { id: 'std_5', name: 'Dwi Cahyono', nisn: '0168273664', gender: 'L', parentName: 'Sutrisno Cahyono', phone: '08123456784', status: 'aktif' },
      { id: 'std_6', name: 'Eka Rahmawati', nisn: '0178273675', gender: 'P', parentName: 'Bambang Rahmawan', phone: '08123456785', status: 'aktif' },
      { id: 'std_7', name: 'Farhan Ramadhan', nisn: '0188273686', gender: 'L', parentName: 'Syarif Ramadhan', phone: '08123456786', status: 'aktif' },
      { id: 'std_8', name: 'Gita Selvia', nisn: '0198273697', gender: 'P', parentName: 'Dicky Selvia', phone: '08123456787', status: 'aktif' },
      { id: 'std_9', name: 'Hendra Wijaya', nisn: '0110827378', gender: 'L', parentName: 'Agus Wijaya', phone: '08123456788', status: 'aktif' },
      { id: 'std_10', name: 'Indah Permatasari', nisn: '0111827379', gender: 'P', parentName: 'Aris Permata', phone: '08123456789', status: 'aktif' },
    ] : [
      { id: 'std_1', name: 'Ahmad Maulana', nisn: '0129384701', gender: 'L', parentName: 'Heri', phone: '08123456701', status: 'aktif' },
      { id: 'std_2', name: 'Bella Clarissa', nisn: '0138475802', gender: 'P', parentName: 'Dian', phone: '08123456702', status: 'aktif' },
      { id: 'std_3', name: 'Candra Pratama', nisn: '0148273603', gender: 'L', parentName: 'Sujono', phone: '08123456703', status: 'aktif' },
      { id: 'std_4', name: 'Dewi Lestari', nisn: '0158273604', gender: 'P', parentName: 'Mawan', phone: '08123456704', status: 'aktif' },
      { id: 'std_5', name: 'Elang Buana', nisn: '0168273605', gender: 'L', parentName: 'Agung', phone: '08123456705', status: 'aktif' },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const initialClassInfo: ClassInfo = {
      className: teacher.className,
      schoolName: 'SD Negeri Cimandirasa',
      academicYear: '2026/2027'
    };

    const initialStructure: ClassStructure = {
      waliKelas: teacher.name,
      ketuaKelas: isSiti ? 'Achmad Fauzi' : 'Ahmad Maulana',
      wakilKetua: isSiti ? 'Amanda Putri' : 'Bella Clarissa',
      sekretaris: isSiti ? 'Farhan Ramadhan' : 'Dewi Lestari',
      bendahara: isSiti ? 'Indah Permatasari' : 'Bella Clarissa'
    };

    const schedulesList: ScheduleItem[] = isSiti ? [
      { id: 'sch_1', day: 'Senin', subject: 'Matematika', startTime: '07:30', endTime: '09:00', teacher: 'Drs. Bambang Supriadi' },
      { id: 'sch_2', day: 'Senin', subject: 'Bahasa Indonesia', startTime: '09:15', endTime: '10:45', teacher: 'Siti Rahmawati, S.Pd.' },
      { id: 'sch_3', day: 'Selasa', subject: 'Ilmu Pengetahuan Alam (IPA)', startTime: '07:30', endTime: '09:00', teacher: 'Budi Prasetyo, M.Si.' },
      { id: 'sch_4', day: 'Selasa', subject: 'PPKn', startTime: '09:15', endTime: '10:45', teacher: 'Siti Rahmawati, S.Pd.' },
      { id: 'sch_5', day: 'Rabu', subject: 'Ilmu Pengetahuan Sosial (IPS)', startTime: '07:30', endTime: '09:00', teacher: 'Dra. Herlina' },
      { id: 'sch_6', day: 'Rabu', subject: 'Bahasa Inggris', startTime: '09:15', endTime: '10:45', teacher: 'Farhan Ramadhan, M.Hum.' },
    ] : [
      { id: 'sch_1', day: 'Senin', subject: 'Pendidikan Agama', startTime: '07:30', endTime: '09:00', teacher: 'Ust. Syarif' },
      { id: 'sch_2', day: 'Senin', subject: 'Matematika', startTime: '09:15', endTime: '10:45', teacher: teacher.name },
      { id: 'sch_3', day: 'Selasa', subject: 'Bahasa Indonesia', startTime: '07:30', endTime: '09:00', teacher: teacher.name },
      { id: 'sch_4', day: 'Selasa', subject: 'Ilmu Pengetahuan Alam (IPA)', startTime: '09:15', endTime: '10:45', teacher: 'Budi Prasetyo, M.Si.' },
    ];

    return {
      classInfo: initialClassInfo,
      students: studentsList,
      attendance: [
        {
          date: yesterdayStr,
          records: isSiti ? {
            'std_1': 'H', 'std_2': 'H', 'std_3': 'S', 'std_4': 'H', 'std_5': 'H',
            'std_6': 'H', 'std_7': 'I', 'std_8': 'H', 'std_9': 'H', 'std_10': 'H',
          } : {
            'std_1': 'H', 'std_2': 'H', 'std_3': 'H', 'std_4': 'S', 'std_5': 'H',
          }
        }
      ],
      cash: [
        { id: 'c_1', date: yesterdayStr, type: 'masuk', amount: 30000, description: 'Uang kas mingguan', category: 'Uang Kas' }
      ],
      piket: [
        { day: 'Senin', studentIds: ['std_1', 'std_2'] },
        { day: 'Selasa', studentIds: ['std_3', 'std_4'] },
        { day: 'Rabu', studentIds: ['std_5'] }
      ],
      agendas: [
        { id: 'a_1', date: todayStr, title: 'Bawa Buku Gambar', content: 'Membawa buku gambar A4 untuk pelajaran SBdP.', type: 'kegiatan' }
      ],
      structure: initialStructure,
      schedules: schedulesList,
      grades: [
        {
          id: 'g_1',
          subject: isSiti ? 'Matematika' : 'Bahasa Indonesia',
          title: 'Tugas Harian 1',
          date: yesterdayStr,
          scores: isSiti ? {
            'std_1': 85, 'std_2': 90, 'std_3': 70, 'std_4': 95, 'std_5': 60,
            'std_6': 80, 'std_7': 75, 'std_8': 88, 'std_9': 68, 'std_10': 92
          } : {
            'std_1': 85, 'std_2': 90, 'std_3': 78, 'std_4': 95, 'std_5': 80
          }
        }
      ]
    };
  }

  // Admin Profile-wide operations
  const handleAddTeacher = (newTeacher: TeacherAccount & { password?: string }) => {
    const { password, ...teacherData } = newTeacher;
    setTeachers(prev => [...prev, teacherData]);
    if (password) {
      setPasswords(prev => ({ ...prev, [newTeacher.username.toLowerCase()]: password }));
    }
  };

  const handleUpdateTeacher = (updated: TeacherAccount & { password?: string }) => {
    const { password, ...teacherData } = updated;
    setTeachers(prev => prev.map(t => t.id === updated.id ? teacherData : t));
    if (password) {
      setPasswords(prev => ({ ...prev, [updated.username.toLowerCase()]: password }));
    }
  };

  const handleDeleteTeacher = (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;
    setTeachers(prev => prev.filter(t => t.id !== id));
    
    // Clean passwords map
    const uName = teacher.username.toLowerCase();
    setPasswords(prev => {
      const copy = { ...prev };
      delete copy[uName];
      return copy;
    });

    // Wipe isolated storage associated with that teacher
    localStorage.removeItem(`class_info_${id}`);
    localStorage.removeItem(`class_structure_${id}`);
    localStorage.removeItem(`class_students_${id}`);
    localStorage.removeItem(`class_attendance_${id}`);
    localStorage.removeItem(`class_cash_${id}`);
    localStorage.removeItem(`class_piket_${id}`);
    localStorage.removeItem(`class_agendas_${id}`);
    localStorage.removeItem(`class_schedules_${id}`);
    localStorage.removeItem(`class_grades_${id}`);
  };

  const handleLoginSuccess = (user: TeacherAccount) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    if (user.role === 'teacher') {
      setViewMode('dashboard');
    } else {
      setViewMode('landing');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('landing');
  };

  // Seeder inside dashboard
  const handleLoadSampleData = () => {
    if (!currentUser) return;
    const initialData = getInitialClassData(currentUser);
    setStudents(initialData.students);
    setAttendance(initialData.attendance);
    setCash(initialData.cash);
    setPiket(initialData.piket);
    setAgendas(initialData.agendas);
    setSchedules(initialData.schedules);
    setGrades(initialData.grades);
  };

  // Class manipulations inside active dashboard
  const handleAddStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveAttendance = (date: string, records: { [studentId: string]: AttendanceStatus }) => {
    setAttendance(prev => {
      const existing = prev.findIndex(a => a.date === date);
      if (existing !== -1) {
        const copy = [...prev];
        copy[existing] = { date, records };
        return copy;
      }
      return [...prev, { date, records }];
    });
  };

  const handleAddTransaction = (record: CashRecord) => {
    setCash(prev => [...prev, record]);
  };

  const handleDeleteTransaction = (id: string) => {
    setCash(prev => prev.filter(r => r.id !== id));
  };

  const handleAddAgenda = (item: AgendaItem) => {
    setAgendas(prev => [...prev, item]);
  };

  const handleDeleteAgenda = (id: string) => {
    setAgendas(prev => prev.filter(a => a.id !== id));
  };

  const handleAddSchedule = (item: ScheduleItem) => {
    setSchedules(prev => [...prev, item]);
  };

  const handleUpdateSchedule = (updated: ScheduleItem) => {
    setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleAddGradeColumn = (column: GradeItem) => {
    setGrades(prev => [...prev, column]);
  };

  const handleUpdateGradeScores = (columnId: string, scores: { [studentId: string]: number }) => {
    setGrades(prev => prev.map(g => g.id === columnId ? { ...g, scores } : g));
  };

  const handleDeleteGradeColumn = (columnId: string) => {
    setGrades(prev => prev.filter(g => g.id !== columnId));
  };

  const handleLoadSampleGradesOnly = () => {
    if (students.length === 0) return;
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const sampleGrades: GradeItem[] = [
      {
        id: 'g_1',
        subject: 'Matematika',
        title: 'Tugas 1 (Perkalian)',
        date: yesterdayStr,
        scores: {
          'std_1': 85, 'std_2': 90, 'std_3': 70, 'std_4': 95, 'std_5': 60,
          'std_6': 80, 'std_7': 75, 'std_8': 88, 'std_9': 68, 'std_10': 92
        }
      },
      {
        id: 'g_2',
        subject: 'Matematika',
        title: 'Ulangan Harian 1',
        date: todayStr,
        scores: {
          'std_1': 80, 'std_2': 95, 'std_3': 75, 'std_4': 90, 'std_5': 65,
          'std_6': 85, 'std_7': 70, 'std_8': 82, 'std_9': 72, 'std_10': 90
        }
      }
    ];
    setGrades(sampleGrades);
  };

  // Main high-level view routing
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          schoolInfo={schoolInfo}
          teachers={teachers}
          currentUser={currentUser}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onEnterDashboard={() => setViewMode('dashboard')}
          onUpdateSchoolInfo={setSchoolInfo}
          onAddTeacher={handleAddTeacher}
          onUpdateTeacher={handleUpdateTeacher}
          onDeleteTeacher={handleDeleteTeacher}
        />

        <AnimatePresence>
          {showLoginModal && (
            <LoginPage
              onClose={() => setShowLoginModal(false)}
              onLoginSuccess={handleLoginSuccess}
              teachers={teachers}
              passwords={passwords}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Dashboard class-specific view
  return (
    <div className="min-h-screen flex bg-[#0F1115] text-slate-200 relative animate-fade-in">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-45 w-64 bg-[#161B22] text-slate-200 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col justify-between shadow-2xl md:shadow-none`}>
        
        <div className="flex flex-col flex-1">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wide uppercase text-white leading-tight">Admin Kelas</h2>
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block mt-0.5">Wali Kelas Portal</span>
              </div>
            </div>

            {/* Close Sidebar Trigger (Mobile) */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white md:hidden hover:bg-slate-850 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
            </button>

            <button
              onClick={() => { setActiveTab('siswa'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'siswa' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="siswa-nav-tab"
            >
              <Users className="w-4 h-4" /> Daftar Murid / Siswa
            </button>

            <button
              onClick={() => { setActiveTab('presensi'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'presensi' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="presensi-nav-tab"
            >
              <ClipboardList className="w-4 h-4" /> Presensi &amp; Absensi
            </button>

            <button
              onClick={() => { setActiveTab('kas'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'kas' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="kas-nav-tab"
            >
              <Wallet className="w-4 h-4" /> Buku Kas Kelas
            </button>

            <button
              onClick={() => { setActiveTab('piket'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'piket' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="piket-nav-tab"
            >
              <Calendar className="w-4 h-4" /> Jadwal Piket Harian
            </button>

            <button
              onClick={() => { setActiveTab('agenda'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'agenda' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="agenda-nav-tab"
            >
              <BookOpen className="w-4 h-4" /> Agenda &amp; Tugas
            </button>

            <button
              onClick={() => { setActiveTab('jadwal'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'jadwal' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="jadwal-nav-tab"
            >
              <Clock className="w-4 h-4" /> Jadwal Pelajaran
            </button>

            <button
              onClick={() => { setActiveTab('nilai'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'nilai' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="nilai-nav-tab"
            >
              <Award className="w-4 h-4" /> Manajemen Nilai
            </button>

            <button
              onClick={() => { setActiveTab('administrasi'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'administrasi' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="administrasi-nav-tab"
            >
              <Download className="w-4 h-4" /> Unduh Administrasi
            </button>

            <button
              onClick={() => { setActiveTab('kalender'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'kalender' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="kalender-nav-tab"
            >
              <Calendar className="w-4 h-4" /> Kalender Pendidikan
            </button>

            <button
              onClick={() => { setActiveTab('modul_ajar'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                activeTab === 'modul_ajar' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
              }`}
              id="modul_ajar-nav-tab"
            >
              <Sparkles className="w-4 h-4" /> Generator Modul Ajar
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin_panel'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition ${
                  activeTab === 'admin_panel' 
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-850/50 border-transparent'
                }`}
                id="admin_panel-nav-tab"
              >
                <Shield className="w-4 h-4" /> Panel Admin
              </button>
            )}

            {/* Back to General Portal Page */}
            <div className="pt-4 border-t border-slate-800/80 mt-4">
              <button
                onClick={() => { setViewMode('landing'); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl border border-dashed border-slate-700 text-slate-450 hover:text-white hover:bg-slate-850/30 transition"
                id="back-to-portal-btn"
              >
                <School className="w-4 h-4 text-indigo-400" /> Portal SDN Cimandirasa
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer Seeder */}
        <div className="p-4 border-t border-slate-800 space-y-2.5">
          {students.length === 0 && (
            <button
              onClick={handleLoadSampleData}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold transition"
            >
              <Sparkles className="w-4 h-4" /> Muat Contoh Data Kelas
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>

          <div className="text-[10px] text-slate-500 text-center font-medium">
            <span>v1.2.0 • Cimandirasa Portal</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane Wrapper */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Navbar Header */}
        <header className="bg-[#10141A] border-b border-slate-800 py-4 px-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-450 hover:text-white md:hidden hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            
            <div>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block leading-tight">Portal SDN Cimandirasa</span>
              <span className="text-xs font-extrabold text-white leading-none">{currentUser?.name || "Guru Kelas"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2 bg-indigo-950/45 border border-indigo-500/20 rounded-xl px-3 py-1.5 text-xs w-full sm:w-auto">
                <span className="text-indigo-400 font-bold uppercase tracking-wide text-[9px] whitespace-nowrap">Kelola Kelas:</span>
                <select
                  value={selectedClassTeacherId}
                  onChange={(e) => setSelectedClassTeacherId(e.target.value)}
                  className="bg-[#0F1115] text-white font-bold rounded-lg px-2.5 py-1 border border-slate-800 outline-none focus:border-indigo-500 text-xs w-full sm:w-auto"
                >
                  {teachers.filter(t => t.role === 'teacher').map(t => (
                    <option key={t.id} value={t.id}>
                      {t.className} - {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-slate-800/40 border border-slate-700/50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-350 shrink-0">
              🏫 {classInfo.className || "Tanpa Kelas"}
            </div>
          </div>
        </header>

        {/* Inner Tab viewport */}
        <main className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <ClassOverview
              students={students}
              attendance={attendance}
              cash={cash}
              piket={piket}
              agendas={agendas}
              structure={structure}
              classInfo={classInfo}
              onUpdateStructure={setStructure}
              onUpdateClassInfo={setClassInfo}
            />
          )}

          {activeTab === 'siswa' && (
            <StudentManager
              students={students}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onLoadSampleStudents={handleLoadSampleData}
            />
          )}

          {activeTab === 'presensi' && (
            <AttendanceManager
              students={students}
              attendance={attendance}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {activeTab === 'kas' && (
            <CashManager
              cash={cash}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'piket' && (
            <PiketManager
              students={students}
              piket={piket}
              onUpdatePiket={setPiket}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaManager
              agendas={agendas}
              onAddAgenda={handleAddAgenda}
              onDeleteAgenda={handleDeleteAgenda}
            />
          )}

          {activeTab === 'jadwal' && (
            <ScheduleManager
              schedules={schedules}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}

          {activeTab === 'nilai' && (
            <GradeManager
              students={students}
              grades={grades}
              attendance={attendance}
              classInfo={classInfo}
              onAddGradeColumn={handleAddGradeColumn}
              onUpdateGradeScores={handleUpdateGradeScores}
              onDeleteGradeColumn={handleDeleteGradeColumn}
              onLoadSampleGrades={handleLoadSampleGradesOnly}
            />
          )}

          {activeTab === 'administrasi' && currentUser && (
            <AdminExportPortal
              currentUser={currentUser}
              teachers={teachers}
              activeClassTeacherId={activeClassTeacherId}
            />
          )}

          {activeTab === 'admin_panel' && currentUser?.role === 'admin' && (
            <AdminPanel
              schoolInfo={schoolInfo}
              onUpdateSchoolInfo={setSchoolInfo}
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {activeTab === 'kalender' && (
            <KalenderPendidikan isAdmin={currentUser?.role === 'admin'} />
          )}

          {activeTab === 'modul_ajar' && (
            <ModulAjarGenerator currentTeacherClass={currentUser?.className} />
          )}
        </main>
      </div>

      {/* Screen Backdrop for Mobile Navigation */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden" 
        />
      )}
    </div>
  );
}

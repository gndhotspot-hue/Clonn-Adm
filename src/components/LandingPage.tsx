import React, { useState } from 'react';
import { 
  School, 
  Megaphone, 
  Award, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  UserCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  Save, 
  X, 
  Check, 
  Lock, 
  Settings, 
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileText
} from 'lucide-react';
import { SchoolInfo, TeacherAccount, SchoolAnnouncement, SchoolAchievement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';

// Use the generated school logo
const schoolLogoImg = '/src/assets/images/school_logo_1783870271743.jpg';

interface LandingPageProps {
  schoolInfo: SchoolInfo;
  teachers: TeacherAccount[];
  currentUser: TeacherAccount | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onEnterDashboard: () => void;
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  onAddTeacher: (teacher: TeacherAccount & { password?: string }) => void;
  onUpdateTeacher: (teacher: TeacherAccount & { password?: string }) => void;
  onDeleteTeacher: (id: string) => void;
}

export default function LandingPage({
  schoolInfo,
  teachers,
  currentUser,
  onLoginClick,
  onLogout,
  onEnterDashboard,
  onUpdateSchoolInfo,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: LandingPageProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<SchoolInfo>({ ...schoolInfo });

  // Calculate total students dynamically from local storage data of all teachers
  const getTotalStudents = () => {
    let total = 0;
    teachers.filter(t => t.role !== 'admin').forEach(t => {
      const raw = localStorage.getItem(`class_students_${t.id}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) total += parsed.length;
        } catch (e) {}
      }
    });
    return total;
  };
  
  // Tab within school management for Admin
  const [adminTab, setAdminTab] = useState<'announcements' | 'achievements' | 'teachers'>('announcements');
  
  // Announcement Edit States
  const [announcementForm, setAnnouncementForm] = useState<Partial<SchoolAnnouncement>>({
    title: '', content: '', important: false
  });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  
  // Achievement Edit States
  const [achievementForm, setAchievementForm] = useState<Partial<SchoolAchievement>>({
    title: '', year: '', description: ''
  });
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);

  // Teacher Edit States
  const [teacherForm, setTeacherForm] = useState<Partial<TeacherAccount & { password?: string }>>({
    username: '', name: '', className: '', password: '', role: 'teacher'
  });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Profile Update
  const handleSaveProfile = () => {
    onUpdateSchoolInfo(editedProfile);
    setIsEditingProfile(false);
  };

  // Announcement Sub-actions
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;

    let updatedAnnouncements = [...schoolInfo.announcements];
    if (editingAnnouncementId) {
      updatedAnnouncements = updatedAnnouncements.map(ann => 
        ann.id === editingAnnouncementId 
          ? { 
              ...ann, 
              title: announcementForm.title!, 
              content: announcementForm.content!, 
              important: announcementForm.important || false,
              date: new Date().toISOString().split('T')[0]
            } 
          : ann
      );
    } else {
      updatedAnnouncements.unshift({
        id: 'ann_' + Date.now(),
        title: announcementForm.title,
        content: announcementForm.content,
        important: announcementForm.important || false,
        date: new Date().toISOString().split('T')[0],
        author: currentUser?.name || 'Administrator'
      });
    }

    onUpdateSchoolInfo({ ...schoolInfo, announcements: updatedAnnouncements });
    setAnnouncementForm({ title: '', content: '', important: false });
    setEditingAnnouncementId(null);
  };

  const handleEditAnnouncement = (ann: SchoolAnnouncement) => {
    setAnnouncementForm({ title: ann.title, content: ann.content, important: ann.important });
    setEditingAnnouncementId(ann.id);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('Hapus pengumuman ini?')) {
      const updated = schoolInfo.announcements.filter(ann => ann.id !== id);
      onUpdateSchoolInfo({ ...schoolInfo, announcements: updated });
    }
  };

  // Achievement Sub-actions
  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementForm.title || !achievementForm.year || !achievementForm.description) return;

    let updatedAchievements = [...schoolInfo.achievements];
    if (editingAchievementId) {
      updatedAchievements = updatedAchievements.map(ach => 
        ach.id === editingAchievementId 
          ? { ...ach, title: achievementForm.title!, year: achievementForm.year!, description: achievementForm.description! } 
          : ach
      );
    } else {
      updatedAchievements.unshift({
        id: 'ach_' + Date.now(),
        title: achievementForm.title,
        year: achievementForm.year,
        description: achievementForm.description
      });
    }

    onUpdateSchoolInfo({ ...schoolInfo, achievements: updatedAchievements });
    setAchievementForm({ title: '', year: '', description: '' });
    setEditingAchievementId(null);
  };

  const handleEditAchievement = (ach: SchoolAchievement) => {
    setAchievementForm({ title: ach.title, year: ach.year, description: ach.description });
    setEditingAchievementId(ach.id);
  };

  const handleDeleteAchievement = (id: string) => {
    if (window.confirm('Hapus prestasi ini?')) {
      const updated = schoolInfo.achievements.filter(ach => ach.id !== id);
      onUpdateSchoolInfo({ ...schoolInfo, achievements: updated });
    }
  };

  // Teacher Sub-actions
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.username || !teacherForm.name || !teacherForm.className) return;

    if (editingTeacherId) {
      onUpdateTeacher({
        id: editingTeacherId,
        username: teacherForm.username.toLowerCase(),
        name: teacherForm.name,
        className: teacherForm.className,
        role: teacherForm.role || 'teacher',
        password: teacherForm.password || undefined // Only update password if provided
      });
    } else {
      if (!teacherForm.password) {
        alert('Password wajib diisi untuk akun baru');
        return;
      }
      onAddTeacher({
        id: 'tchr_' + Date.now(),
        username: teacherForm.username.toLowerCase(),
        name: teacherForm.name,
        className: teacherForm.className,
        role: teacherForm.role || 'teacher',
        password: teacherForm.password
      });
    }

    setTeacherForm({ username: '', name: '', className: '', password: '', role: 'teacher' });
    setEditingTeacherId(null);
    setShowPassword(false);
  };

  const handleEditTeacher = (t: TeacherAccount & { password?: string }) => {
    setTeacherForm({ 
      username: t.username, 
      name: t.name, 
      className: t.className, 
      role: t.role,
      password: t.password || '' 
    });
    setEditingTeacherId(t.id);
  };

  const handleDeleteTeacher = (id: string) => {
    if (id === currentUser?.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif');
      return;
    }
    if (window.confirm('Hapus akun guru ini? Semua data administrasi kelas guru bersangkutan juga akan dihapus.')) {
      onDeleteTeacher(id);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const handleExportDatabase = () => {
    const backupData: any = {
      version: "1.2.0",
      timestamp: new Date().toISOString(),
      schoolInfo: JSON.parse(localStorage.getItem('school_general_info') || 'null') || schoolInfo,
      teachers: JSON.parse(localStorage.getItem('school_teachers_registry') || 'null') || teachers,
      passwords: JSON.parse(localStorage.getItem('school_passwords_registry') || 'null') || {},
      classrooms: {}
    };

    // Scan localStorage for classroom keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('class_info_') || 
                   key.startsWith('class_structure_') || 
                   key.startsWith('class_students_') || 
                   key.startsWith('class_attendance_') || 
                   key.startsWith('class_cash_') || 
                   key.startsWith('class_piket_') || 
                   key.startsWith('class_agendas_') || 
                   key.startsWith('class_schedules_') || 
                   key.startsWith('class_grades_'))) {
        backupData.classrooms[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdn_cimandirasa_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const backupData = JSON.parse(jsonString);
        if (!backupData.schoolInfo || !backupData.teachers || !backupData.passwords) {
          alert("Format file cadangan tidak valid. Pastikan file backup berasal dari portal ini.");
          return;
        }

        const confirmRestore = window.confirm(
          "Apakah Anda yakin ingin memulihkan database dari file ini? Seluruh data yang ada saat ini di browser Anda akan ditimpa dengan data cadangan ini."
        );
        if (!confirmRestore) return;

        // Restore core school data
        localStorage.setItem('school_general_info', JSON.stringify(backupData.schoolInfo));
        localStorage.setItem('school_teachers_registry', JSON.stringify(backupData.teachers));
        localStorage.setItem('school_passwords_registry', JSON.stringify(backupData.passwords));

        // Clear existing classrooms
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('class_info_') || 
                       key.startsWith('class_structure_') || 
                       key.startsWith('class_students_') || 
                       key.startsWith('class_attendance_') || 
                       key.startsWith('class_cash_') || 
                       key.startsWith('class_piket_') || 
                       key.startsWith('class_agendas_') || 
                       key.startsWith('class_schedules_') || 
                       key.startsWith('class_grades_'))) {
            localStorage.removeItem(key);
          }
        }

        // Restore classroom entries
        if (backupData.classrooms) {
          Object.keys(backupData.classrooms).forEach(key => {
            localStorage.setItem(key, backupData.classrooms[key]);
          });
        }

        alert("Database berhasil dipulihkan dari cadangan! Halaman portal akan dimuat ulang.");
        window.location.reload();
      } catch (err) {
        alert("Gagal membaca file backup: " + err);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadMigrationGuide = () => {
    const guideText = `========================================================================
PANDUAN MIGRASI DAN HOSTING PORTAL ADMINISTRASI SEKOLAH SDN CIMANDIRASA
========================================================================
Dokumen panduan ini ditujukan bagi Administrator Web (gnd) SDN Cimandirasa
untuk memindahkan/menghos aplikasi portal dari lingkungan preview lokal
atau AI Studio ke Web Hosting Mandiri/Berbayar (Shared Hosting, cPanel, 
VPS, atau platform cloud gratis/premium seperti Vercel dan Netlify).

Langkah 1: Ekspor Kode Sumber (Source Code) dari AI Studio
-----------------------------------------------------------
1. Pada aplikasi AI Studio, buka panel editor.
2. Cari tombol pengaturan atau klik menu ekspor, lalu pilih "Export ZIP" 
   untuk mengunduh kode aplikasi secara utuh.
3. Ekstrak file ZIP di komputer lokal Anda. Di dalamnya terdapat struktur 
   projek React + Vite standard lengkap dengan \`package.json\`.

Langkah 2: Menghos Aplikasi Secara Instan & Gratis (Sangat Direkomendasikan)
----------------------------------------------------------------------------
Aplikasi ini berbasis SPA (Single Page Application) yang berjalan sangat
cepat langsung di peramban pengguna. Anda dapat menghosnya secara gratis
selamanya di server CDN kelas dunia:

Opsi A: Menggunakan Vercel
1. Buat akun di https://vercel.com (bisa masuk menggunakan akun GitHub).
2. Instal Vercel CLI dengan perintah: \`npm install -g vercel\`
3. Di folder projek yang telah diekstrak, buka terminal/command prompt.
4. Jalankan perintah \`vercel\` dan ikuti panduan di layar untuk mengunggah 
   dan mempublikasikan situs web Anda.
5. Anda juga bisa mengunggah folder projek ke GitHub terlebih dahulu,
   lalu menghubungkannya ke akun Vercel untuk pembaruan kode otomatis.

Opsi B: Menggunakan Netlify
1. Buat akun gratis di https://netlify.com.
2. Di komputer lokal Anda, kompilasi projek terlebih dahulu dengan menjalankan
   perintah: \`npm run build\`. Perintah ini akan menghasilkan folder \`dist/\` 
   yang berisi file static teroptimasi.
3. Masuk ke halaman admin Netlify, lalu seret (drag & drop) folder \`dist/\` 
   tersebut ke area pengunggahan situs baru di dashboard Netlify.
4. Netlify akan memberikan alamat web gratis, dan Anda bisa menambahkan 
   domain sekolah kustom Anda (cth: sdn-cimandirasa.sch.id).

Langkah 3: Pemasangan pada Hosting Tradisional Berbayar (cPanel / Hostinger / Niagahoster)
-----------------------------------------------------------------------------------------
Jika sekolah Anda telah menyewa Shared Hosting cPanel atau hosting berbayar:
1. Di komputer lokal Anda, instal dependensi dengan menjalankan \`npm install\`.
2. Lakukan kompilasi produksi dengan perintah: \`npm run build\`.
3. Buka folder projek Anda, temukan sub-folder bernama \`dist/\`. Folder ini
   berisi semua file web akhir (HTML, JS, CSS, gambar) yang sudah dikompilasi.
4. Masuk ke cPanel hosting Anda, lalu buka File Manager.
5. Cari folder akar web Anda, biasanya bernama \`public_html\` atau nama domain Anda.
6. Unggah semua isi di DALAM folder \`dist/\` ke direktori \`public_html/\` hosting Anda.
7. Portal web Anda siap diakses secara publik menggunakan domain sekolah berbayar Anda!

Langkah 4: Cara Memindahkan dan Memulihkan Data (Migrasi Database)
------------------------------------------------------------------
Sistem kami dirancang tangguh dengan mengandalkan penyimpanan aman lokal browser 
setiap guru kelas. Apabila Anda berpindah domain, server hosting, atau perangkat:
1. Masuk ke akun admin 'gnd' di situs web lama.
2. Di bagian bawah halaman utama admin, klik "Ekspor Database (JSON)".
3. File database cadangan berformat \`.json\` akan diunduh ke komputer Anda.
4. Buka portal di alamat hosting baru Anda.
5. Masuk dengan akun admin 'gnd'.
6. Klik tombol "Impor / Pulihkan Database" dan pilih file \`.json\` yang telah diunduh tadi.
7. Portal baru Anda kini memiliki data yang sama persis secara utuh dengan situs lama!

Jika Anda mengalami kendala teknis atau ingin menghubungkan portal ini ke 
database cloud SQL terpusat di masa mendatang, rancangan file ini sangat modular
dan siap dikembangkan lebih lanjut.

Salam hangat,
Tim Pengembang Sistem Portal SDN Cimandirasa
========================================================================`;

    const blob = new Blob([guideText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PANDUAN_MIGRASI_PORTAL_SDN_CIMANDIRASA.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Selected classroom teacher for download rekap
  const activeTeachers = teachers.filter(t => t.role === 'teacher');
  const [selectedDownloadTeacherId, setSelectedDownloadTeacherId] = useState<string>(() => {
    if (currentUser && currentUser.role === 'teacher') {
      return currentUser.id;
    }
    return activeTeachers.length > 0 ? activeTeachers[0].id : '';
  });

  React.useEffect(() => {
    if (currentUser && currentUser.role === 'teacher') {
      setSelectedDownloadTeacherId(currentUser.id);
    }
  }, [currentUser]);

  const selectedTeacherObj = teachers.find(t => t.id === selectedDownloadTeacherId);
  const selectedClassName = selectedTeacherObj ? selectedTeacherObj.className : 'Kelas';

  const handleDownloadStudents = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawData = localStorage.getItem(`class_students_${teacherId}`);
    if (!rawData) {
      alert(`Data siswa untuk ${className} belum tersedia atau masih kosong.`);
      return;
    }
    const students: any[] = JSON.parse(rawData);
    if (students.length === 0) {
      alert(`Daftar siswa untuk ${className} kosong.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const headers = ["NISN", "Nama Siswa", "Jenis Kelamin", "Nama Orang Tua / Wali", "No. Telepon Orang Tua", "Status Siswa"];
    const rows = students.map(s => [
      s.nisn || '-',
      s.name || '-',
      s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      s.parentName || '-',
      s.phone || '-',
      s.status ? s.status.toUpperCase() : 'AKTIF'
    ]);

    const title = `Daftar Murid / Siswa Kelas ${className}`;
    const filename = `daftar_siswa_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        colWidths: [25, 45, 12, 43, 35, 20],
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadAttendance = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawStudents = localStorage.getItem(`class_students_${teacherId}`);
    const rawAttendance = localStorage.getItem(`class_attendance_${teacherId}`);
    
    if (!rawStudents) {
      alert(`Data siswa untuk ${className} belum tersedia.`);
      return;
    }
    const students: any[] = JSON.parse(rawStudents);
    const attendanceDays: any[] = rawAttendance ? JSON.parse(rawAttendance) : [];

    if (students.length === 0) {
      alert(`Daftar siswa untuk ${className} kosong.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const headers = ["NISN", "Nama Siswa", "Hadir (H)", "Sakit (S)", "Izin (I)", "Alfa (A)", "Total Hari Efektif", "Persentase Kehadiran"];
    
    const rows = students.map(s => {
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;

      attendanceDays.forEach(day => {
        const status = day.records?.[s.id];
        if (status === 'H') hadir++;
        else if (status === 'S') sakit++;
        else if (status === 'I') izin++;
        else if (status === 'A') alfa++;
      });

      const total = hadir + sakit + izin + alfa;
      const persentase = total > 0 ? Math.round((hadir / total) * 100) + '%' : '100%';

      return [
        s.nisn || '-',
        s.name || '-',
        hadir,
        sakit,
        izin,
        alfa,
        total,
        persentase
      ];
    });

    const title = `Rekapitulasi Presensi & Kehadiran Siswa Kelas ${className}`;
    const filename = `rekap_presensi_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        colWidths: [25, 50, 12, 12, 12, 12, 27, 30],
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadCash = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawCash = localStorage.getItem(`class_cash_${teacherId}`);
    if (!rawCash) {
      alert(`Data keuangan kas untuk ${className} belum tersedia.`);
      return;
    }
    const cash: any[] = JSON.parse(rawCash);
    if (cash.length === 0) {
      alert(`Buku kas untuk ${className} kosong.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const sortedCash = [...cash].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const headers = ["ID Transaksi", "Tanggal", "Kategori", "Keterangan", "Tipe", "Jumlah (Rp)", "Saldo Kumulatif (Rp)"];
    let cumulativeBalance = 0;

    const rows = sortedCash.map(c => {
      const amt = Number(c.amount) || 0;
      if (c.type === 'masuk') {
        cumulativeBalance += amt;
      } else {
        cumulativeBalance -= amt;
      }

      return [
        c.id,
        c.date,
        c.category || 'Uang Kas',
        c.description || '-',
        c.type === 'masuk' ? 'Kas Masuk' : 'Kas Keluar',
        amt,
        cumulativeBalance
      ];
    });

    const title = `Buku Kas Utama Kelas ${className}`;
    const filename = `buku_kas_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        colWidths: [20, 22, 25, 43, 20, 25, 25],
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadPiket = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawPiket = localStorage.getItem(`class_piket_${teacherId}`);
    const rawStudents = localStorage.getItem(`class_students_${teacherId}`);
    
    if (!rawPiket) {
      alert(`Data piket untuk ${className} belum tersedia.`);
      return;
    }
    const piket: any[] = JSON.parse(rawPiket);
    const students: any[] = rawStudents ? JSON.parse(rawStudents) : [];

    if (piket.length === 0) {
      alert(`Jadwal piket untuk ${className} kosong.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const headers = ["Hari", "Petugas Piket (Daftar Siswa)"];
    const rows = piket.map(p => {
      const names = (p.studentIds || []).map((id: string) => {
        const student = students.find(s => s.id === id);
        return student ? student.name : id;
      }).join(', ');

      return [
        p.day,
        names || '-'
      ];
    });

    const title = `Jadwal Piket Harian Siswa Kelas ${className}`;
    const filename = `jadwal_piket_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        colWidths: [40, 140],
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadAgendas = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawAgendas = localStorage.getItem(`class_agendas_${teacherId}`);
    if (!rawAgendas) {
      alert(`Data agenda/tugas untuk ${className} belum tersedia.`);
      return;
    }
    const agendas: any[] = JSON.parse(rawAgendas);
    if (agendas.length === 0) {
      alert(`Daftar agenda/tugas untuk ${className} kosong.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const sortedAgendas = [...agendas].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const headers = ["Tanggal", "Kategori", "Judul Agenda / Tugas", "Isi Deskripsi"];
    const rows = sortedAgendas.map(a => [
      a.date,
      a.type ? a.type.toUpperCase() : 'KEGIATAN',
      a.title || '-',
      a.content || '-'
    ]);

    const title = `Agenda Kegiatan & Tugas Kelas ${className}`;
    const filename = `agenda_tugas_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        colWidths: [25, 25, 50, 80],
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadSchedules = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawSchedules = localStorage.getItem(`class_schedules_${teacherId}`);
    if (!rawSchedules) {
      alert(`Data jadwal pelajaran untuk ${className} belum tersedia.`);
      return;
    }
    const schedules: any[] = JSON.parse(rawSchedules);
    if (schedules.length === 0) {
      alert(`Jadwal pelajaran untuk ${className} kosong.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const dayOrder: { [key: string]: number } = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
    const sortedSchedules = [...schedules].sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      if (dayDiff !== 0) return dayDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    const headers = ["Hari", "Waktu Mulai", "Waktu Selesai", "Mata Pelajaran", "Guru Pengajar"];
    const rows = sortedSchedules.map(s => [
      s.day,
      s.startTime || '-',
      s.endTime || '-',
      s.subject || '-',
      s.teacher || '-'
    ]);

    const title = `Jadwal Pelajaran Kelas ${className}`;
    const filename = `jadwal_pelajaran_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        colWidths: [25, 25, 25, 50, 55],
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadGrades = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    const rawStudents = localStorage.getItem(`class_students_${teacherId}`);
    const rawGrades = localStorage.getItem(`class_grades_${teacherId}`);
    
    if (!rawStudents) {
      alert(`Data siswa untuk ${className} belum tersedia.`);
      return;
    }
    const students: any[] = JSON.parse(rawStudents);
    const grades: any[] = rawGrades ? JSON.parse(rawGrades) : [];

    if (students.length === 0) {
      alert(`Daftar siswa untuk ${className} kosong.`);
      return;
    }

    if (grades.length === 0) {
      alert(`Belum ada entri penilaian untuk ${className}.`);
      return;
    }

    const teacherObj = teachers.find(t => t.id === teacherId);
    const teacherName = teacherObj ? teacherObj.name : 'Guru Kelas';

    const gradeHeaders = grades.map(g => `${g.subject} - ${g.title} (${g.date})`);
    const headers = ["NISN", "Nama Siswa", ...gradeHeaders, "Rata-rata Nilai"];

    const rows = students.map(s => {
      let totalScore = 0;
      let gradedCount = 0;
      const scores = grades.map(g => {
        const score = g.scores?.[s.id];
        if (score !== undefined && score !== null) {
          const val = Number(score);
          totalScore += val;
          gradedCount++;
          return val;
        }
        return '-';
      });

      const average = gradedCount > 0 ? Math.round((totalScore / gradedCount) * 10) / 10 : '-';

      return [
        s.nisn || '-',
        s.name || '-',
        ...scores,
        average
      ];
    });

    const title = `Rekapitulasi Nilai Siswa Kelas ${className}`;
    const filename = `rekap_nilai_siswa_${className.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      exportToPDF({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.pdf`
      });
    } else {
      exportToExcel({
        title,
        className,
        teacherName,
        headers,
        rows,
        filename: `${filename}.xls`
      });
    }
  };

  const handleDownloadAllReports = (teacherId: string, className: string, format: 'pdf' | 'excel' = 'pdf') => {
    handleDownloadStudents(teacherId, className, format);
    setTimeout(() => handleDownloadAttendance(teacherId, className, format), 300);
    setTimeout(() => handleDownloadCash(teacherId, className, format), 600);
    setTimeout(() => handleDownloadPiket(teacherId, className, format), 1000);
    setTimeout(() => handleDownloadAgendas(teacherId, className, format), 1400);
    setTimeout(() => handleDownloadSchedules(teacherId, className, format), 1800);
    setTimeout(() => handleDownloadGrades(teacherId, className, format), 2200);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200" id="landing-page">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0F1115]/90 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 p-0.5 shadow-lg overflow-hidden shrink-0 border border-indigo-400/20">
              <img 
                src={schoolInfo.logoUrl || schoolLogoImg} 
                alt="SDN Cimandirasa Logo" 
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to Icon
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="hidden school-logo-fallback w-full h-full flex items-center justify-center bg-indigo-600 text-white font-extrabold">
                SD
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                {schoolInfo.schoolName}
              </h1>
              <p className="text-[10px] sm:text-xs text-indigo-400 font-bold tracking-widest mt-1 uppercase">
                Portal Administrasi Guru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden md:inline-flex flex-col text-right">
                  <span className="text-xs font-bold text-white">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentUser.role === 'admin' ? 'Administrator' : `Wali Kelas ${currentUser.className}`}
                  </span>
                </span>
                
                {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <button
                    onClick={onEnterDashboard}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition transform active:scale-95 border border-indigo-500/20"
                    id="btn-enter-dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Administrasi Kelas
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
                  id="btn-logout"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition transform active:scale-95 border border-indigo-500/20"
                id="btn-login-trigger"
              >
                <LogIn className="w-4 h-4" /> Login Guru
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-slate-850 bg-radial from-[#1A1F29]/40 to-[#0F1115]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Info content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 text-xs font-bold">
                <School className="w-3.5 h-3.5" /> NPSN: {schoolInfo.npsn}
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Portal Layanan &amp; <br />
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  Administrasi Kelas Terpadu
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Selamat datang di platform administrasi digital {schoolInfo.schoolName}. 
                Dirancang khusus untuk memfasilitasi para Guru dalam pengelolaan rekap data siswa, 
                presensi harian, jurnal kelas, kas kelas, rekap nilai siswa, serta jadwal pelajaran secara real-time.
              </p>

              {/* Quick stats list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-850">
                <div className="p-3 bg-[#161B22]/50 rounded-xl border border-slate-800">
                  <div className="text-xl font-extrabold text-white">{teachers.filter(t => t.role !== 'admin').length}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Wali Kelas</div>
                </div>
                <div className="p-3 bg-[#161B22]/50 rounded-xl border border-slate-800">
                  <div className="text-xl font-extrabold text-white">{getTotalStudents()}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Total Siswa</div>
                </div>
                <div className="p-3 bg-[#161B22]/50 rounded-xl border border-slate-800">
                  <div className="text-xl font-extrabold text-white">{schoolInfo.achievements.length}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Prestasi Sekolah</div>
                </div>
              </div>

              {/* Login callout for teachers */}
              {!currentUser && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={onLoginClick}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <LogIn className="w-4 h-4" /> Mulai Kelola Administrasi Kelas
                  </button>
                </div>
              )}
            </div>

            {/* Right Banner / Image content */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[360px] aspect-square rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-850 p-6 border border-slate-800 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="w-32 h-32 mx-auto rounded-full bg-indigo-500/10 p-1 border border-indigo-500/20 mb-6 flex items-center justify-center">
                  <img 
                    src={schoolInfo.logoUrl || schoolLogoImg} 
                    alt="SDN Cimandirasa Logo" 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-white">{schoolInfo.schoolName}</h3>
                  <p className="text-xs text-slate-400 italic">"Mencerdaskan, Berbudi Pekerti Luhur, Berkarya Hebat"</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-450">
                  <span>Kepala Sekolah:</span>
                  <span className="font-bold text-white">{schoolInfo.principal}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Grid: Info, Announcements, Achievements */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Row 1: Profile & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Profile Sekolah (4 Cols) */}
          <div className="lg:col-span-5 bg-[#161B22] rounded-2xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-400" /> Profil Sekolah
                </h3>
                {isAdmin && !isEditingProfile && (
                  <button
                    onClick={() => {
                      setEditedProfile({ ...schoolInfo });
                      setIsEditingProfile(true);
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Logo / Foto Sekolah</label>
                    <div className="flex items-center gap-3">
                      {editedProfile.logoUrl && (
                        <img 
                          src={editedProfile.logoUrl} 
                          alt="Pratinjau Logo" 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-505 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setEditedProfile({ ...editedProfile, logoUrl: ev.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Nama Sekolah</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      value={editedProfile.schoolName}
                      onChange={e => setEditedProfile({ ...editedProfile, schoolName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">NPSN</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editedProfile.npsn}
                        onChange={e => setEditedProfile({ ...editedProfile, npsn: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Kepala Sekolah</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editedProfile.principal}
                        onChange={e => setEditedProfile({ ...editedProfile, principal: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Alamat</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white resize-none"
                      value={editedProfile.address}
                      onChange={e => setEditedProfile({ ...editedProfile, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Telepon</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editedProfile.phone}
                        onChange={e => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Email</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={editedProfile.email}
                        onChange={e => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Visi</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white resize-none"
                      value={editedProfile.vision}
                      onChange={e => setEditedProfile({ ...editedProfile, vision: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      <Save className="w-3.5 h-3.5" /> Simpan
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                    >
                      <X className="w-3.5 h-3.5" /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="space-y-1 p-3 bg-[#0F1115]/50 border border-slate-850 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Visi Sekolah</span>
                    <p className="font-medium text-slate-300 italic">"{schoolInfo.vision}"</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Misi Sekolah</span>
                    <ul className="list-decimal list-inside space-y-1 text-xs text-slate-400 leading-relaxed pl-1">
                      {schoolInfo.mission.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-850 grid grid-cols-1 gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{schoolInfo.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{schoolInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{schoolInfo.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pengumuman Terkini (7 Cols) */}
          <div className="lg:col-span-7 bg-[#161B22] rounded-2xl border border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" /> Pengumuman Sekolah
              </h3>
            </div>

            <div className="space-y-4">
              {/* If Admin, show Quick Post announcement form */}
              {isAdmin && (
                <form onSubmit={handleSaveAnnouncement} className="p-4 bg-[#0F1115]/60 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    {editingAnnouncementId ? 'Edit Pengumuman' : 'Buat Pengumuman Sekolah Baru'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        placeholder="Judul Pengumuman"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={announcementForm.title || ''}
                        onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="sm:col-span-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ann_important"
                        className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 w-4 h-4"
                        checked={announcementForm.important || false}
                        onChange={e => setAnnouncementForm({ ...announcementForm, important: e.target.checked })}
                      />
                      <label htmlFor="ann_important" className="text-xs text-slate-400 font-semibold cursor-pointer">Penting/Urgent</label>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan isi detail pengumuman sekolah..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white resize-none"
                    value={announcementForm.content || ''}
                    onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    {editingAnnouncementId && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnouncementForm({ title: '', content: '', important: false });
                          setEditingAnnouncementId(null);
                        }}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" /> {editingAnnouncementId ? 'Simpan' : 'Posting'}
                    </button>
                  </div>
                </form>
              )}

              {/* Announcements list */}
              {schoolInfo.announcements.length > 0 ? (
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {schoolInfo.announcements.map(ann => (
                    <div key={ann.id} className="p-4 bg-[#0F1115]/40 border border-slate-850 rounded-xl relative overflow-hidden group">
                      
                      {ann.important && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-rose-500" />
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 pl-1">
                          <div className="flex items-center gap-2">
                            {ann.important && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/20">
                                PENTING
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {ann.date}
                            </span>
                            <span className="text-[10px] text-indigo-400 font-semibold">• oleh {ann.author}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white tracking-tight mt-1">{ann.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mt-1">{ann.content}</p>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition duration-200">
                            <button
                              onClick={() => handleEditAnnouncement(ann)}
                              className="p-1 text-indigo-400 hover:bg-indigo-500/15 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="p-1 text-rose-400 hover:bg-rose-500/15 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#0F1115]/20 border border-dashed border-slate-800 rounded-xl">
                  <Megaphone className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Belum ada pengumuman</p>
                  <p className="text-[10px] text-slate-500">Pengumuman sekolah resmi akan ditayangkan di sini</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Row 2: Achievements & Teacher-Class Registry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Achievements / Prestasi (5 Cols) */}
          <div className="lg:col-span-5 bg-[#161B22] rounded-2xl border border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-black text-white flex items-center gap-2 pb-4 border-b border-slate-850 mb-4">
              <Award className="w-5 h-5 text-indigo-400" /> Prestasi Sekolah
            </h3>

            <div className="space-y-4">
              {isAdmin && (
                <form onSubmit={handleSaveAchievement} className="p-4 bg-[#0F1115]/60 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400">
                    {editingAchievementId ? 'Edit Prestasi' : 'Tambah Prestasi Baru'}
                  </h4>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-9">
                      <input
                        type="text"
                        placeholder="Nama Prestasi/Kejuaraan"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={achievementForm.title || ''}
                        onChange={e => setAchievementForm({ ...achievementForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Tahun"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        value={achievementForm.year || ''}
                        onChange={e => setAchievementForm({ ...achievementForm, year: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Deskripsi pencapaian..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    value={achievementForm.description || ''}
                    onChange={e => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    {editingAchievementId && (
                      <button
                        type="button"
                        onClick={() => {
                          setAchievementForm({ title: '', year: '', description: '' });
                          setEditingAchievementId(null);
                        }}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" /> {editingAchievementId ? 'Simpan' : 'Tambah'}
                    </button>
                  </div>
                </form>
              )}

              {schoolInfo.achievements.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {schoolInfo.achievements.map(ach => (
                    <div key={ach.id} className="p-3 bg-[#0F1115]/30 border border-slate-850 rounded-xl group flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {ach.year}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 leading-tight">{ach.title}</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed">{ach.description}</p>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleEditAchievement(ach)}
                            className="p-1 text-indigo-400 hover:bg-indigo-500/15 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAchievement(ach.id)}
                            className="p-1 text-rose-400 hover:bg-rose-500/15 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#0F1115]/20 border border-dashed border-slate-800 rounded-xl">
                  <Award className="w-7 h-7 text-slate-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-400">Belum ada prestasi</p>
                </div>
              )}
            </div>
          </div>

          {/* Wali Kelas & Kelas (7 Cols) */}
          <div className="lg:col-span-7 bg-[#161B22] rounded-2xl border border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-black text-white flex items-center gap-2 pb-4 border-b border-slate-850 mb-4">
              <UserCheck className="w-5 h-5 text-indigo-400" /> Wali Kelas &amp; Ruang Kelas
            </h3>

            <div className="space-y-4">
              {/* Show list of teacher/classes in school */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teachers.filter(t => t.role !== 'admin').map(t => {
                  const rawStudents = localStorage.getItem(`class_students_${t.id}`);
                  const rawCash = localStorage.getItem(`class_cash_${t.id}`);
                  const rawAttendance = localStorage.getItem(`class_attendance_${t.id}`);
                  
                  let studentCount = 0;
                  let cashBalance = 0;
                  let attendanceRate = 100;
                  
                  if (rawStudents) {
                    try {
                      const parsed = JSON.parse(rawStudents);
                      if (Array.isArray(parsed)) studentCount = parsed.length;
                    } catch (e) {}
                  }
                  
                  if (rawCash) {
                    try {
                      const parsed = JSON.parse(rawCash);
                      if (Array.isArray(parsed)) {
                        cashBalance = parsed.reduce((sum, c) => {
                          const amt = Number(c.amount) || 0;
                          return c.type === 'masuk' ? sum + amt : sum - amt;
                        }, 0);
                      }
                    } catch (e) {}
                  }

                  if (rawStudents && rawAttendance) {
                    try {
                      const studentsList = JSON.parse(rawStudents);
                      const attendanceDays = JSON.parse(rawAttendance);
                      if (Array.isArray(studentsList) && Array.isArray(attendanceDays) && studentsList.length > 0 && attendanceDays.length > 0) {
                        let totalHadir = 0;
                        let totalRecords = 0;
                        attendanceDays.forEach(day => {
                          const records = day.records || {};
                          studentsList.forEach(s => {
                            if (records[s.id] !== undefined) {
                              totalRecords++;
                              if (records[s.id] === 'H') totalHadir++;
                            }
                          });
                        });
                        if (totalRecords > 0) {
                          attendanceRate = Math.round((totalHadir / totalRecords) * 100);
                        }
                      }
                    } catch (e) {}
                  }

                  return (
                    <div key={t.id} className="p-4 bg-[#0F1115]/50 border border-slate-800 rounded-xl flex flex-col justify-between group space-y-3 hover:border-indigo-500/30 transition duration-200" id={`class-card-${t.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                            {t.className}
                          </span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-white mt-1.5">{t.name}</h4>
                        </div>
                        {currentUser?.id === t.id && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-md">
                            Anda
                          </span>
                        )}
                      </div>
                      
                      {/* Dynamic Class Stats Block */}
                      <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                        <div className="bg-[#10141A]/50 p-2 rounded-lg border border-slate-850/40">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Siswa</span>
                          <span className="text-xs font-black text-slate-200">{studentCount} Murid</span>
                        </div>
                        <div className="bg-[#10141A]/50 p-2 rounded-lg border border-slate-850/40">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Kas Kelas</span>
                          <span className="text-xs font-black text-emerald-400">
                            {cashBalance >= 0 ? `Rp ${(cashBalance).toLocaleString('id-ID')}` : `-Rp ${Math.abs(cashBalance).toLocaleString('id-ID')}`}
                          </span>
                        </div>
                        <div className="bg-[#10141A]/50 p-2 rounded-lg border border-slate-850/40">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Presensi</span>
                          <span className="text-xs font-black text-sky-400">{attendanceRate}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* If Admin is logged in, show complete Teacher Account administration console */}
              {isAdmin && (
                <div className="pt-6 border-t border-slate-850 mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-xs sm:text-sm font-black text-white">Konsol Manajemen Akun Guru (Admin Only)</h4>
                  </div>

                  <form onSubmit={handleSaveTeacher} className="p-4 bg-[#0F1115]/60 border border-slate-800 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-indigo-400">
                      {editingTeacherId ? 'Edit Akun Guru' : 'Tambah Akun Guru Baru'}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap Guru</label>
                        <input
                          type="text"
                          placeholder="Cth: Siti Rahmawati, S.Pd."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          value={teacherForm.name || ''}
                          onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran / Wali Kelas</label>
                        <input
                          type="text"
                          placeholder="Cth: Kelas 6A atau Kelas 1"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          value={teacherForm.className || ''}
                          onChange={e => setTeacherForm({ ...teacherForm, className: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username Login</label>
                        <input
                          type="text"
                          placeholder="Cth: bu_siti"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          value={teacherForm.username || ''}
                          onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Password {editingTeacherId && '(Biarkan kosong jika tidak diubah)'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder={editingTeacherId ? "Pasword baru..." : "Masukkan password..."}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-10 py-1.5 text-xs text-white"
                            value={teacherForm.password || ''}
                            onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                            required={!editingTeacherId}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {editingTeacherId && (
                        <button
                          type="button"
                          onClick={() => {
                            setTeacherForm({ username: '', name: '', className: '', password: '', role: 'teacher' });
                            setEditingTeacherId(null);
                            setShowPassword(false);
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                        >
                          Batal
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                      >
                        {editingTeacherId ? 'Simpan Perubahan' : 'Daftarkan Akun Guru'}
                      </button>
                    </div>
                  </form>

                  {/* Registered Teachers Table */}
                  <div className="bg-[#0F1115]/40 border border-slate-850 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#10141A] text-slate-400 border-b border-slate-850 font-bold">
                          <th className="p-3">Username</th>
                          <th className="p-3">Nama Guru</th>
                          <th className="p-3">Kelas</th>
                          <th className="p-3">Peran</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/50">
                        {teachers.map(t => (
                          <tr key={t.id} className="hover:bg-slate-850/20 text-slate-300 font-medium">
                            <td className="p-3 font-mono text-indigo-400">{t.username}</td>
                            <td className="p-3 text-white font-bold">{t.name}</td>
                            <td className="p-3">{t.className || '-'}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                t.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {t.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditTeacher(t)}
                                  className="p-1 text-indigo-450 hover:bg-indigo-500/15 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeacher(t.id)}
                                  className="p-1 text-rose-400 hover:bg-rose-500/15 rounded"
                                  title="Hapus"
                                  disabled={t.id === currentUser?.id}
                                  style={{ opacity: t.id === currentUser?.id ? 0.3 : 1 }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pusat Unduhan Laporan Administrasi Kelas */}
              {currentUser && (
                <div className="pt-6 border-t border-slate-850 mt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-xs sm:text-sm font-black text-white">Pusat Unduhan Laporan Administrasi Kelas (Akses Guru)</h4>
                    </div>

                    <div className="p-5 bg-[#0F1115]/60 border border-slate-800 rounded-2xl space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-extrabold text-white">1. Pilih Kelas &amp; Wali Kelas</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Pilih salah satu kelas di bawah ini untuk mengunduh rekapitulasi data administrasi dari akses guru kelas yang bersangkutan.
                          </p>
                        </div>
                        <select
                          value={selectedDownloadTeacherId}
                          onChange={(e) => setSelectedDownloadTeacherId(e.target.value)}
                          className="bg-[#10141A] text-white font-bold rounded-xl px-3.5 py-2 border border-slate-800 outline-none focus:border-indigo-500 text-xs w-full sm:w-auto"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {teachers.filter(t => t.role === 'teacher').map(t => (
                            <option key={t.id} value={t.id}>
                              {t.className} - {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedDownloadTeacherId ? (
                        <div className="space-y-4 border-t border-slate-850/50 pt-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h5 className="text-xs font-extrabold text-indigo-450 uppercase tracking-wider">
                                Menu Unduhan Kelas: {selectedClassName}
                              </h5>
                              <p className="text-[10px] text-slate-450 mt-0.5">
                                Wali Kelas: <span className="font-bold text-slate-200">{selectedTeacherObj?.name}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadAllReports(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black shadow-md transition transform active:scale-95 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Unduh Semua (PDF)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadAllReports(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black shadow-md transition transform active:scale-95 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Unduh Semua (Excel)
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {/* Card 1: Siswa */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Daftar Murid / Siswa</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Data NISN, nama lengkap, jenis kelamin, wali, telepon, dan status.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadStudents(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadStudents(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>

                            {/* Card 2: Presensi */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Rekap Presensi &amp; Absensi</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Jumlah kehadiran, sakit, izin, alfa, dan presentase kehadiran.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttendance(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttendance(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>

                            {/* Card 3: Kas */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Buku Kas Kelas</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Aliran dana masuk/keluar, kategori transaksi, dan saldo kumulatif.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadCash(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadCash(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>

                            {/* Card 4: Piket */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Jadwal Piket Harian</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Daftar petugas kebersihan dan kedisiplinan kelas harian.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPiket(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPiket(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>

                            {/* Card 5: Agenda */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Agenda &amp; Tugas</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Catatan kegiatan harian kelas, pekerjaan rumah, dan tugas belajar.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAgendas(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAgendas(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>

                            {/* Card 6: Jadwal Pelajaran */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Jadwal Pelajaran</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Susunan mata pelajaran mingguan, waktu jam, dan pengajar.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSchedules(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSchedules(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>

                            {/* Card 7: Nilai */}
                            <div className="p-3.5 bg-[#10141A]/50 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Akses Guru</span>
                                <h6 className="text-xs font-extrabold text-white mt-0.5">Manajemen Nilai Siswa</h6>
                                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Rekapitulasi perolehan nilai, tugas harian, ujian, dan nilai rata-rata.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadGrades(selectedDownloadTeacherId, selectedClassName, 'pdf')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadGrades(selectedDownloadTeacherId, selectedClassName, 'excel')}
                                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold transition transform active:scale-95 cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                          <p className="text-xs font-bold text-slate-500">Silakan pilih kelas terlebih dahulu untuk menampilkan menu unduhan.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Cadangan & Migrasi Sistem */}
              {isAdmin && (
                <div className="pt-6 border-t border-slate-850 mt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Save className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-xs sm:text-sm font-black text-white">Cadangan (Backup) &amp; Migrasi Sistem</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Database Backup */}
                      <div className="p-4 bg-[#0F1115]/60 border border-slate-800 rounded-2xl space-y-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-extrabold text-white">1. Ekspor &amp; Impor Database Lokal (JSON)</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Ekspor seluruh data portal sekolah (profil sekolah, pengumuman, prestasi, daftar guru, data kelas, siswa, presensi, kas, piket, jadwal harian/mingguan, dan nilai tugas/mata pelajaran) menjadi file cadangan tunggal format `.json`.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={handleExportDatabase}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md transition transform active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" /> Ekspor Database (JSON)
                          </button>

                          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition transform active:scale-95">
                            <Upload className="w-3.5 h-3.5" /> Impor Database (.json)
                            <input
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={handleImportDatabase}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Code Migration Guide */}
                      <div className="p-4 bg-[#0F1115]/60 border border-slate-800 rounded-2xl space-y-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-extrabold text-white">2. Migrasi Kode Aplikasi &amp; Web Hosting</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Unduh berkas kode sumber (`source code`) utuh aplikasi dari menu ekspor AI Studio, lalu ikuti panduan kompilasi dan penempatan kami ke hosting berbayar (Shared cPanel, VPS, Vercel, atau Netlify).
                          </p>
                        </div>
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={handleDownloadMigrationGuide}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/15 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[11px] font-bold shadow-md transition transform active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5" /> Unduh Panduan Migrasi Lengkap (.txt)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-[#10141A] text-slate-500 py-8 mt-12 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-400">© 2026 {schoolInfo.schoolName}. Hak Cipta Dilindungi.</p>
          <p>Sistem Informasi &amp; Administrasi Sekolah Terintegrasi SD Negeri Cimandirasa</p>
          <p className="text-[10px] font-mono text-slate-600 mt-2">Dikelola secara aman dengan enkripsi lokal.</p>
        </div>
      </footer>
    </div>
  );
}

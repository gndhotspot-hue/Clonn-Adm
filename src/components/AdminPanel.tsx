import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  Plus, 
  Trash2, 
  Save, 
  Shield, 
  Check, 
  AlertCircle,
  FileText,
  UserCheck,
  Building2,
  Clock
} from 'lucide-react';
import { SchoolInfo, TeacherAccount } from '../types';

interface AdminPanelProps {
  schoolInfo: SchoolInfo;
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  teachers: TeacherAccount[];
  onAddTeacher: (teacher: TeacherAccount & { password?: string }) => void;
  onUpdateTeacher: (teacher: TeacherAccount & { password?: string }) => void;
  onDeleteTeacher: (id: string) => void;
}

export default function AdminPanel({
  schoolInfo,
  onUpdateSchoolInfo,
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'teachers' | 'classes' | 'subjects_days'>('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. School Profile & Accreditation States
  const [profileForm, setProfileForm] = useState({
    schoolName: schoolInfo.schoolName,
    principal: schoolInfo.principal,
    npsn: schoolInfo.npsn,
    address: schoolInfo.address,
    phone: schoolInfo.phone,
    email: schoolInfo.email,
    vision: schoolInfo.vision,
    accreditation: (schoolInfo as any).accreditation || 'A'
  });

  // 2. Teachers & Classes States
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    username: '',
    password: '',
    className: '',
    role: 'teacher' as 'teacher' | 'admin'
  });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Class list states (Classes that exist in school)
  const [classes, setClasses] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_classes_registry');
    if (saved) return JSON.parse(saved);
    // fallback: unique classes from teachers
    const derived = Array.from(new Set(teachers.map(t => t.className).filter(c => c !== 'Administrator')));
    return derived.length > 0 ? derived : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6A', 'Kelas 6B'];
  });
  const [newClassName, setNewClassName] = useState('');

  // 3. Subjects & Days States
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_subjects_registry');
    if (saved) return JSON.parse(saved);
    return [
      'Matematika',
      'Ilmu Pengetahuan Alam (IPA)',
      'Ilmu Pengetahuan Sosial (IPS)',
      'Bahasa Indonesia',
      'Bahasa Inggris',
      'Pendidikan Pancasila & Kewarganegaraan (PPKn)',
      'Pendidikan Agama & Budi Pekerti',
      'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
      'Seni Budaya & Prakarya (SBdP)',
      'Teknologi Informasi & Komunikasi (TIK)',
      'Bahasa Daerah / Sunda / Jawa',
      'Upacara & Pembiasaan'
    ];
  });
  const [newSubjectName, setNewSubjectName] = useState('');

  const [schoolDays, setSchoolDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_days_registry');
    if (saved) return JSON.parse(saved);
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  });

  const ALL_DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Trigger auto-dismiss alert
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 4000);
  };

  // Profile update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedInfo = {
      ...schoolInfo,
      schoolName: profileForm.schoolName,
      principal: profileForm.principal,
      npsn: profileForm.npsn,
      address: profileForm.address,
      phone: profileForm.phone,
      email: profileForm.email,
      vision: profileForm.vision,
      accreditation: profileForm.accreditation
    };
    onUpdateSchoolInfo(updatedInfo as any);
    showSuccess('Profil Sekolah dan Data Akreditasi berhasil diperbarui!');
  };

  // Class Management
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const trimmed = newClassName.trim();
    if (classes.includes(trimmed)) {
      showError('Kelas sudah terdaftar!');
      return;
    }
    const updated = [...classes, trimmed];
    setClasses(updated);
    localStorage.setItem('school_classes_registry', JSON.stringify(updated));
    setNewClassName('');
    showSuccess(`Kelas "${trimmed}" berhasil ditambahkan!`);
  };

  const handleDeleteClass = (classNameToDelete: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kelas "${classNameToDelete}"?`)) {
      const updated = classes.filter(c => c !== classNameToDelete);
      setClasses(updated);
      localStorage.setItem('school_classes_registry', JSON.stringify(updated));
      showSuccess(`Kelas "${classNameToDelete}" berhasil dihapus!`);
    }
  };

  // Teacher Management
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, username, password, className, role } = teacherForm;

    if (!name.trim() || !username.trim() || (!editingTeacherId && !password)) {
      showError('Semua kolom wajib diisi untuk akun guru baru!');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check duplicate username if not editing
    if (!editingTeacherId) {
      const exists = teachers.some(t => t.username === cleanUsername);
      if (exists) {
        showError('Username sudah digunakan oleh guru lain!');
        return;
      }

      onAddTeacher({
        id: 'tchr_' + Date.now(),
        name: name.trim(),
        username: cleanUsername,
        className: role === 'admin' ? 'Administrator' : className,
        role,
        password: password
      });
      showSuccess(`Akun Guru "${name}" berhasil ditambahkan!`);
    } else {
      onUpdateTeacher({
        id: editingTeacherId,
        name: name.trim(),
        username: cleanUsername,
        className: role === 'admin' ? 'Administrator' : className,
        role,
        password: password || undefined
      });
      showSuccess(`Akun Guru "${name}" berhasil diperbarui!`);
      setEditingTeacherId(null);
    }

    setTeacherForm({
      name: '',
      username: '',
      password: '',
      className: '',
      role: 'teacher'
    });
  };

  const handleEditTeacherClick = (t: TeacherAccount) => {
    setEditingTeacherId(t.id);
    setTeacherForm({
      name: t.name,
      username: t.username,
      password: '',
      className: t.className,
      role: t.role
    });
  };

  const handleDeleteTeacherClick = (id: string, name: string) => {
    if (window.confirm(`Hapus akun guru "${name}"? Seluruh data administrasi kelas guru bersangkutan juga akan dihapus secara permanen.`)) {
      onDeleteTeacher(id);
      showSuccess(`Akun Guru "${name}" telah dihapus.`);
    }
  };

  // Subjects & Days Management
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const trimmed = newSubjectName.trim();
    if (subjects.includes(trimmed)) {
      showError('Mata Pelajaran sudah terdaftar!');
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    localStorage.setItem('school_subjects_registry', JSON.stringify(updated));
    setNewSubjectName('');
    showSuccess(`Mata Pelajaran "${trimmed}" berhasil ditambahkan!`);
  };

  const handleDeleteSubject = (sub: string) => {
    if (window.confirm(`Hapus mata pelajaran "${sub}"?`)) {
      const updated = subjects.filter(s => s !== sub);
      setSubjects(updated);
      localStorage.setItem('school_subjects_registry', JSON.stringify(updated));
      showSuccess(`Mata Pelajaran "${sub}" berhasil dihapus.`);
    }
  };

  const handleToggleDay = (day: string) => {
    let updated;
    if (schoolDays.includes(day)) {
      if (schoolDays.length <= 1) {
        showError('Minimal harus ada 1 hari penyelenggaraan sekolah!');
        return;
      }
      updated = schoolDays.filter(d => d !== day);
    } else {
      updated = [...schoolDays, day];
      // Sort days based on standard order
      updated.sort((a, b) => ALL_DAYS_OF_WEEK.indexOf(a) - ALL_DAYS_OF_WEEK.indexOf(b));
    }
    setSchoolDays(updated);
    localStorage.setItem('school_days_registry', JSON.stringify(updated));
    showSuccess('Hari Penyelenggaraan Sekolah berhasil diperbarui!');
  };

  return (
    <div className="bg-[#161B22] border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in" id="admin-panel-container">
      {/* Tab Banner */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-slate-900 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">Panel Administrator</h1>
            <p className="text-xs text-slate-400">Pengaturan Akademik, Kelas, Guru, dan Data Akreditasi Sekolah</p>
          </div>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'profile'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 inline mr-1.5" /> Profil &amp; Akreditasi
          </button>
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'teachers'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" /> Data Guru
          </button>
          <button
            onClick={() => setActiveSubTab('classes')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'classes'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" /> Manajemen Kelas
          </button>
          <button
            onClick={() => setActiveSubTab('subjects_days')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'subjects_days'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline mr-1.5" /> Mapel &amp; Hari
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="mx-6 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form content */}
      <div className="p-6">
        
        {/* 1. PROFILE & ACCREDITATION TAB */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h2 className="text-sm font-extrabold text-slate-300 border-b border-slate-800 pb-2">Profil &amp; Akreditasi Sekolah</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Nama Sekolah</label>
                <input
                  type="text"
                  value={profileForm.schoolName}
                  onChange={e => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">NPSN (Nomor Pokok Sekolah Nasional)</label>
                <input
                  type="text"
                  value={profileForm.npsn}
                  onChange={e => setProfileForm({ ...profileForm, npsn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  value={profileForm.principal}
                  onChange={e => setProfileForm({ ...profileForm, principal: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Akreditasi Sekolah</label>
                <select
                  value={profileForm.accreditation}
                  onChange={e => setProfileForm({ ...profileForm, accreditation: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="A">A (Sangat Baik / Unggul)</option>
                  <option value="B">B (Baik)</option>
                  <option value="C">C (Cukup)</option>
                  <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Alamat Sekolah</label>
                <textarea
                  value={profileForm.address}
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Telepon Sekolah</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Email Sekolah</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Visi Sekolah</label>
                <textarea
                  value={profileForm.vision}
                  onChange={e => setProfileForm({ ...profileForm, vision: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan Profil
              </button>
            </div>
          </form>
        )}

        {/* 2. TEACHERS TAB */}
        {activeSubTab === 'teachers' && (
          <div className="space-y-8">
            {/* Form */}
            <form onSubmit={handleSaveTeacher} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                {editingTeacherId ? 'Ubah Akun Guru' : 'Tambah Akun Guru Baru'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap Guru</label>
                  <input
                    type="text"
                    value={teacherForm.name}
                    onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    placeholder="Contoh: Siti Aminah, S.Pd."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username (Login)</label>
                  <input
                    type="text"
                    value={teacherForm.username}
                    onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })}
                    placeholder="Contoh: bu_siti"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                    disabled={!!editingTeacherId}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    value={teacherForm.password}
                    onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    placeholder={editingTeacherId ? 'Kosongkan jika tidak diubah' : 'Min. 4 Karakter'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required={!editingTeacherId}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wali Kelas Untuk</label>
                  <select
                    value={teacherForm.className}
                    onChange={e => setTeacherForm({ ...teacherForm, className: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    disabled={teacherForm.role === 'admin'}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Guru Piket">Guru Piket / Tanpa Kelas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hak Akses / Peran</label>
                  <select
                    value={teacherForm.role}
                    onChange={e => {
                      const newRole = e.target.value as 'teacher' | 'admin';
                      setTeacherForm({
                        ...teacherForm,
                        role: newRole,
                        className: newRole === 'admin' ? 'Administrator' : ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="teacher">Guru / Wali Kelas</option>
                    <option value="admin">Administrator / Operator Utama</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {editingTeacherId ? 'Perbarui Akun Guru' : 'Tambahkan Akun'}
                  </button>
                </div>
              </div>
            </form>

            {/* List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300">Daftar Akun Guru Terdaftar</h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Nama Guru</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Tanggung Jawab Kelas</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-900/30">
                        <td className="p-4 font-semibold text-white">{t.name}</td>
                        <td className="p-4 font-mono text-slate-400">{t.username}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-750 rounded-lg text-[10px] font-bold">
                            {t.className}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {t.role === 'admin' ? 'Admin' : 'Guru'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleEditTeacherClick(t)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Edit"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacherClick(t.id, t.name)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. CLASSES TAB */}
        {activeSubTab === 'classes' && (
          <div className="space-y-6">
            {/* Form */}
            <form onSubmit={handleAddClass} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl max-w-md space-y-3">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Tambah Kelas Baru
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="Contoh: Kelas VI-C, Kelas 3B, dsb."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-lg transition shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300">Daftar Kelas Aktif Sekolah</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {classes.map(c => {
                  const hasWali = teachers.find(t => t.className === c);
                  return (
                    <div key={c} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{c}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Wali Kelas: <span className="font-semibold text-slate-300">{hasWali ? hasWali.name : 'Belum Ada Wali Kelas'}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteClass(c)}
                        className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. SUBJECTS & SCHOOL DAYS TAB */}
        {activeSubTab === 'subjects_days' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Subjects Column */}
            <div className="space-y-6">
              <h2 className="text-sm font-extrabold text-slate-300 border-b border-slate-800 pb-2">Daftar Mata Pelajaran</h2>
              
              <form onSubmit={handleAddSubject} className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="Nama Mapel Baru..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-lg transition shadow-md flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </form>

              <div className="border border-slate-800 bg-slate-900/20 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {subjects.map((sub, index) => (
                      <tr key={index} className="hover:bg-slate-900/30">
                        <td className="p-3 font-semibold text-white">{sub}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteSubject(sub)}
                            className="p-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* School Days Column */}
            <div className="space-y-6">
              <h2 className="text-sm font-extrabold text-slate-300 border-b border-slate-800 pb-2">Hari Penyelenggaraan Sekolah</h2>
              <p className="text-xs text-slate-400">Pilih hari-hari operasional atau hari sekolah aktif untuk menyusun jadwal pelajaran dan piket.</p>

              <div className="grid grid-cols-1 gap-2.5">
                {ALL_DAYS_OF_WEEK.map(day => {
                  const isActive = schoolDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`p-3.5 border rounded-xl flex items-center justify-between text-xs font-bold transition text-left ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <span>Hari {day}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isActive ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950'
                      }`}>
                        {isActive && <Check className="w-3 h-3 stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

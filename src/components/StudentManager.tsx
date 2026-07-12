import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  UserPlus, 
  Download, 
  Upload, 
  X, 
  Check, 
  FileSpreadsheet, 
  Filter,
  User,
  AlertCircle,
  QrCode,
  Printer
} from 'lucide-react';
import { Student, Gender } from '../types';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';

interface StudentManagerProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onLoadSampleStudents: () => void;
}

export default function StudentManager({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onLoadSampleStudents,
}: StudentManagerProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'L' | 'P'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'aktif' | 'pindahan' | 'keluar'>('All');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);

  // Form Fields state
  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    gender: 'L' as Gender,
    parentName: '',
    phone: '',
    status: 'aktif' as 'aktif' | 'pindahan' | 'keluar',
  });

  const [formError, setFormError] = useState('');

  // Handle Form open for Add
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      nisn: '',
      gender: 'L',
      parentName: '',
      phone: '',
      status: 'aktif',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Form open for Edit
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nisn: student.nisn,
      gender: student.gender,
      parentName: student.parentName,
      phone: student.phone,
      status: student.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama siswa harus diisi');
      return;
    }
    if (!formData.nisn.trim()) {
      setFormError('NISN harus diisi');
      return;
    }
    if (!/^\d+$/.test(formData.nisn.trim())) {
      setFormError('NISN harus berupa angka');
      return;
    }
    if (formData.nisn.trim().length !== 10) {
      setFormError('NISN biasanya terdiri dari 10 digit angka');
      // Just a warning or we can let it pass, but let's encourage 10 digits
    }

    const studentPayload: Student = {
      id: editingStudent ? editingStudent.id : 'std_' + Date.now().toString(),
      name: formData.name.trim(),
      nisn: formData.nisn.trim(),
      gender: formData.gender,
      parentName: formData.parentName.trim() || '-',
      phone: formData.phone.trim() || '-',
      status: formData.status,
    };

    if (editingStudent) {
      onUpdateStudent(studentPayload);
    } else {
      // Check duplicate NISN
      if (students.some(s => s.nisn === studentPayload.nisn)) {
        setFormError('NISN ini sudah terdaftar untuk siswa lain');
        return;
      }
      onAddStudent(studentPayload);
    }

    setIsModalOpen(false);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `daftar_siswa_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Basic validation
            const valid = parsed.every(s => s.id && s.name && s.nisn && s.gender);
            if (valid) {
              parsed.forEach(student => {
                onAddStudent(student);
              });
              alert('Daftar siswa berhasil diimpor!');
            } else {
              alert('Format file JSON tidak sesuai. Pastikan memiliki kolom ID, nama, nisn, dan gender.');
            }
          }
        } catch (error) {
          alert('Gagal membaca file JSON. Pastikan file valid.');
        }
      };
    }
  };

  // Filters calculation
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nisn.includes(searchTerm);
    const matchesGender = genderFilter === 'All' || student.gender === genderFilter;
    const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
    return matchesSearch && matchesGender && matchesStatus;
  });

  return (
    <div className="space-y-6" id="student-manager">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white">Manajemen Daftar Siswa</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola data murid, nomor induk, wali, serta kontak orang tua</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {students.length === 0 && (
            <button
              onClick={onLoadSampleStudents}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold transition"
              id="load-sample-students-btn"
            >
              <FileSpreadsheet className="w-4 h-4" /> Isi Contoh Data Murid
            </button>
          )}
          
          <button
            onClick={handleExportJSON}
            disabled={students.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Ekspor ke JSON"
          >
            <Download className="w-4 h-4" /> Ekspor
          </button>
          
          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition">
            <Upload className="w-4 h-4" /> Impor
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportJSON} 
              className="hidden" 
            />
          </label>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            id="add-student-btn"
          >
            <UserPlus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
        {/* Filters Panel */}
        <div className="p-4 bg-[#10141A] border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Filters dropdown/buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter:</span>
            </div>
            
            {/* Gender Filter Toggle */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-[#10141A] p-0.5">
              <button
                onClick={() => setGenderFilter('All')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                  genderFilter === 'All' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({students.length})
              </button>
              <button
                onClick={() => setGenderFilter('L')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                  genderFilter === 'L' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Laki-laki ({students.filter(s => s.gender === 'L').length})
              </button>
              <button
                onClick={() => setGenderFilter('P')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                  genderFilter === 'P' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Perempuan ({students.filter(s => s.gender === 'P').length})
              </button>
            </div>

            {/* Status Filter Toggle */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900/60 border border-slate-800 text-slate-200 px-3 py-1 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">Status: Semua</option>
              <option value="aktif">Aktif</option>
              <option value="pindahan">Pindahan Masuk</option>
              <option value="keluar">Sudah Keluar/Lulus</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#10141A] border-b border-slate-800">
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">No</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">NISN</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Gender</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Orang Tua / Wali</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Kontak Telp</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Status</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-6 text-xs font-medium text-slate-500">{index + 1}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                          student.gender === 'L' 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                            : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                        }`}>
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{student.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-xs font-mono text-slate-350 font-medium">{student.nisn}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        student.gender === 'L' 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                          : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                      }`}>
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-300">{student.parentName}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-300 font-mono">{student.phone}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        student.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        student.status === 'pindahan' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setQrStudent(student)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                          title="Lihat QR Code Presensi"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus data ${student.name}?`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 px-4">
              <User className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Tidak ada data murid</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm || genderFilter !== 'All' || statusFilter !== 'All'
                  ? 'Tidak ada siswa yang cocok dengan kriteria pencarian atau filter Anda.'
                  : 'Silakan klik "Tambah Siswa" untuk menambahkan data siswa secara manual atau isi dengan contoh data.'}
              </p>
              {(searchTerm || genderFilter !== 'All' || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setGenderFilter('All');
                    setStatusFilter('All');
                  }}
                  className="mt-3 text-xs text-indigo-400 font-semibold hover:underline"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Sidebar Form (Slide over overlay) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-800 flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingStudent ? `Edit Data Siswa: ${editingStudent.name}` : 'Tambah Siswa Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-rose-500/10 text-rose-450 text-xs rounded-xl flex items-center gap-2 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Nama Lengkap Siswa <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Ma'ruf"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* NISN */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">NISN (Nomor Induk Siswa Nasional) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Contoh: 0098765432"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
                />
              </div>

              {/* Gender Radio */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Jenis Kelamin <span className="text-rose-500">*</span></label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={formData.gender === 'L'}
                      onChange={() => setFormData({ ...formData, gender: 'L' })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Laki-laki</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={formData.gender === 'P'}
                      onChange={() => setFormData({ ...formData, gender: 'P' })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Perempuan</span>
                  </label>
                </div>
              </div>

              {/* Nama Wali */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  placeholder="Nama Ibu atau Ayah"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Telp Orang Tua */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Nomor Telepon Orang Tua</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Status Keanggotaan</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-900/60 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="aktif">Siswa Aktif</option>
                  <option value="pindahan">Pindahan Masuk</option>
                  <option value="keluar">Sudah Keluar/Lulus</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  id="save-student-submit-btn"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Murid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------- QR CODE & ID CARD VIEW MODAL --------------------- */}
      {qrStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Hidden Canvas used exclusively to feed crystal clear high-res QR png code to jsPDF */}
          <div className="hidden">
            <QRCodeCanvas id="student-qr-canvas" value={qrStudent.id} size={300} level="H" includeMargin={true} />
          </div>

          <div className="bg-[#161B22] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-400" /> Kartu Presensi Digital
              </h3>
              <button 
                onClick={() => setQrStudent(null)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Card Wrapper */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-950/40">
              {/* Actual Printable ID Card */}
              <div id="student-printable-card" className="w-64 bg-white text-slate-900 rounded-2xl p-5 border border-slate-300 shadow-lg flex flex-col items-center text-center space-y-4 relative overflow-hidden font-sans">
                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 h-2.5 bg-indigo-600"></div>
                
                {/* School Name */}
                <div className="pt-1">
                  <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 leading-none">Kartu Presensi Murid</h4>
                  <h3 className="text-[10px] font-black uppercase text-indigo-700 mt-0.5">SDN Cimandirasa</h3>
                </div>

                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-extrabold border-2 ${
                  qrStudent.gender === 'L' 
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                    : 'bg-pink-100 text-pink-700 border-pink-200'
                }`}>
                  {qrStudent.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Student Info */}
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 leading-tight">{qrStudent.name}</h3>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">NISN: {qrStudent.nisn}</p>
                </div>

                {/* QR Code Container */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <QRCodeSVG value={qrStudent.id} size={110} level="H" includeMargin={false} />
                </div>

                {/* Footer instructions */}
                <p className="text-[8px] text-slate-400 leading-snug font-medium italic">
                  Dekatkan QR Code ini ke kamera presensi guru untuk melakukan absen otomatis.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#10141A] border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  const printContent = document.getElementById('student-printable-card')?.outerHTML;
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(`
                      <html>
                        <head>
                          <title>Cetak Kartu Presensi - ${qrStudent.name}</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            @media print {
                              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                              #student-printable-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
                            }
                          </style>
                        </head>
                        <body class="bg-slate-100 flex items-center justify-center min-h-screen">
                          ${printContent}
                          <script>
                            window.onload = function() {
                              window.print();
                              setTimeout(() => { window.close(); }, 500);
                            }
                          </script>
                        </body>
                      </html>
                    `);
                    win.document.close();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>

              <button
                onClick={() => {
                  const canvas = document.getElementById('student-qr-canvas') as HTMLCanvasElement;
                  if (!canvas) return;

                  const qrDataUrl = canvas.toDataURL('image/png');

                  const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [85, 120] 
                  });

                  doc.setFillColor(255, 255, 255);
                  doc.rect(0, 0, 85, 120, 'F');

                  doc.setFillColor(79, 70, 229); 
                  doc.rect(0, 0, 85, 4, 'F');

                  doc.setFont('Helvetica', 'bold');
                  doc.setFontSize(7);
                  doc.setTextColor(156, 163, 175);
                  doc.text("KARTU PRESENSI MURID", 42.5, 9, { align: 'center' });
                  doc.setFontSize(9);
                  doc.setTextColor(67, 56, 202);
                  doc.text("SD NEGERI CIMANDIRASA", 42.5, 13, { align: 'center' });

                  doc.setDrawColor(229, 231, 235);
                  doc.setFillColor(243, 244, 246);
                  doc.ellipse(42.5, 26, 8, 8, 'FD');
                  
                  doc.setFont('Helvetica', 'bold');
                  doc.setFontSize(8);
                  doc.setTextColor(79, 70, 229);
                  doc.text(qrStudent.name.substring(0, 2).toUpperCase(), 42.5, 28.5, { align: 'center' });

                  doc.setFontSize(9);
                  doc.setTextColor(17, 24, 39);
                  doc.text(qrStudent.name, 42.5, 41, { align: 'center' });
                  
                  doc.setFont('Helvetica', 'normal');
                  doc.setFontSize(7.5);
                  doc.setTextColor(107, 114, 128);
                  doc.text(`NISN: ${qrStudent.nisn}`, 42.5, 45, { align: 'center' });

                  doc.addImage(qrDataUrl, 'PNG', 22.5, 50, 40, 40);

                  doc.setFontSize(6);
                  doc.setTextColor(156, 163, 175);
                  doc.text("Dekatkan QR Code ini ke kamera presensi guru", 42.5, 98, { align: 'center' });
                  doc.text("untuk melakukan absen otomatis.", 42.5, 101, { align: 'center' });

                  doc.setFontSize(5);
                  doc.setTextColor(209, 213, 219);
                  doc.text("SDN Cimandirasa - Smart School System", 42.5, 114, { align: 'center' });

                  doc.save(`Kartu_Presensi_${qrStudent.name.replace(/\s+/g, '_')}.pdf`);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" /> Unduh PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

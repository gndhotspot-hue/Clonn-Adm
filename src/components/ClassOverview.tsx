import React, { useState } from 'react';
import { 
  Users, 
  Wallet, 
  Calendar, 
  BookOpen, 
  User, 
  Shield, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Plus,
  Save,
  X,
  Edit
} from 'lucide-react';
import { Student, AttendanceDay, CashRecord, PiketGroup, AgendaItem, ClassStructure, ClassInfo } from '../types';

interface ClassOverviewProps {
  students: Student[];
  attendance: AttendanceDay[];
  cash: CashRecord[];
  piket: PiketGroup[];
  agendas: AgendaItem[];
  structure: ClassStructure;
  classInfo: ClassInfo;
  onUpdateStructure: (newStructure: ClassStructure) => void;
  onUpdateClassInfo: (newInfo: ClassInfo) => void;
}

export default function ClassOverview({
  students,
  attendance,
  cash,
  piket,
  agendas,
  structure,
  classInfo,
  onUpdateStructure,
  onUpdateClassInfo,
}: ClassOverviewProps) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingStructure, setIsEditingStructure] = useState(false);
  
  // States for form edits
  const [editedInfo, setEditedInfo] = useState<ClassInfo>({ ...classInfo });
  const [editedStructure, setEditedStructure] = useState<ClassStructure>({ ...structure });

  // 1. Calculate General Statistics
  const totalStudents = students.length;
  const maleCount = students.filter(s => s.gender === 'L').length;
  const femaleCount = students.filter(s => s.gender === 'P').length;

  // Today's attendance percentage (using the latest date entered in attendance)
  const getLatestAttendanceRate = () => {
    if (attendance.length === 0) return { percent: 0, date: '-' };
    // Sort attendance by date descending
    const sortedAttendance = [...attendance].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sortedAttendance[0];
    const totalRecords = Object.keys(latest.records).length;
    if (totalRecords === 0) return { percent: 0, date: latest.date };
    
    const presentCount = Object.values(latest.records).filter(status => status === 'H').length;
    const rate = Math.round((presentCount / totalRecords) * 100);
    return { percent: rate, date: latest.date };
  };

  const latestAttendance = getLatestAttendanceRate();

  // Cash Calculation
  const totalBalance = cash.reduce((acc, curr) => {
    return curr.type === 'masuk' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  // Today's Date Info
  const daysIndonesian = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsIndonesian = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const today = new Date();
  const dayName = daysIndonesian[today.getDay()];
  const formattedDate = `${today.getDate()} ${monthsIndonesian[today.getMonth()]} ${today.getFullYear()}`;

  // Current Cleaning Duty Group (Piket)
  const todayPiketGroup = piket.find(p => p.day === dayName);
  const piketStudents = todayPiketGroup 
    ? students.filter(s => todayPiketGroup.studentIds.includes(s.id))
    : [];

  // Active / Upcoming Agendas
  const upcomingAgendas = agendas
    .filter(item => {
      if (item.type === 'tugas' && item.dueDate) {
        return new Date(item.dueDate) >= new Date(today.setHours(0,0,0,0));
      }
      return true; // Keep announcements and general agendas
    })
    .slice(0, 3); // Get top 3

  const handleSaveInfo = () => {
    onUpdateClassInfo(editedInfo);
    setIsEditingInfo(false);
  };

  const handleSaveStructure = () => {
    onUpdateStructure(editedStructure);
    setIsEditingStructure(false);
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Header Banner */}
      <div className="bg-radial from-[#1A1F29] to-[#10141A] text-white rounded-2xl p-6 md:p-8 border border-slate-800/60 shadow-xl relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                Tahun Ajaran {classInfo.academicYear}
              </span>
              <span className="text-slate-450 text-xs flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-450" /> {dayName}, {formattedDate}
              </span>
            </div>
            
            {isEditingInfo ? (
              <div className="space-y-3 max-w-md mt-2">
                <input
                  type="text"
                  className="w-full bg-slate-900/60 text-white text-2xl font-bold px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                  value={editedInfo.className}
                  placeholder="Nama Kelas (cth: Kelas VI-A)"
                  onChange={(e) => setEditedInfo({ ...editedInfo, className: e.target.value })}
                />
                <input
                  type="text"
                  className="w-full bg-slate-900/60 text-slate-200 text-sm px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                  value={editedInfo.schoolName}
                  placeholder="Nama Sekolah"
                  onChange={(e) => setEditedInfo({ ...editedInfo, schoolName: e.target.value })}
                />
                <input
                  type="text"
                  className="w-full bg-slate-900/60 text-slate-200 text-sm px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                  value={editedInfo.academicYear}
                  placeholder="Tahun Ajaran (cth: 2025/2026)"
                  onChange={(e) => setEditedInfo({ ...editedInfo, academicYear: e.target.value })}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveInfo}
                    className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Simpan
                  </button>
                  <button
                    onClick={() => {
                      setEditedInfo({ ...classInfo });
                      setIsEditingInfo(false);
                    }}
                    className="flex items-center gap-1 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    <X className="w-3.5 h-3.5" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                  Administrasi Kelas - {classInfo.className || "Belum Diatur"}
                </h1>
                <p className="text-indigo-400 text-base font-semibold">
                  {classInfo.schoolName || "Sekolah Belum Diatur"}
                </p>
              </div>
            )}
          </div>

          {!isEditingInfo && (
            <button
              onClick={() => {
                setEditedInfo({ ...classInfo });
                setIsEditingInfo(true);
              }}
              className="self-start md:self-center flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold border border-indigo-500/20 transition backdrop-blur-sm shadow-sm"
              id="edit-class-info-btn"
            >
              <Edit className="w-4 h-4" /> Edit Detail Kelas
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-[#161B22] rounded-2xl p-5 border border-slate-800/80 shadow-sm flex items-center gap-4 hover:border-slate-750 transition">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Total Siswa</p>
            <h3 className="text-xl font-extrabold text-white mt-1">{totalStudents} Siswa</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Laki-laki: <span className="font-bold text-slate-350">{maleCount}</span> | Perempuan: <span className="font-bold text-slate-350">{femaleCount}</span>
            </p>
          </div>
        </div>

        {/* Kehadiran Terakhir */}
        <div className="bg-[#161B22] rounded-2xl p-5 border border-slate-800/80 shadow-sm flex items-center gap-4 hover:border-slate-750 transition">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Kehadiran Terakhir</p>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {latestAttendance.percent > 0 ? `${latestAttendance.percent}%` : '0%'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {latestAttendance.date !== '-' ? `Tanggal: ${latestAttendance.date}` : 'Belum ada absensi'}
            </p>
          </div>
        </div>

        {/* Saldo Kas Kelas */}
        <div className="bg-[#161B22] rounded-2xl p-5 border border-slate-800/80 shadow-sm flex items-center gap-4 hover:border-slate-750 transition">
          <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Kas Kelas</p>
            <h3 className="text-xl font-extrabold text-white mt-1">
              Rp {totalBalance.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Transaksi Aktif
            </p>
          </div>
        </div>

        {/* Agenda Aktif */}
        <div className="bg-[#161B22] rounded-2xl p-5 border border-slate-800/80 shadow-sm flex items-center gap-4 hover:border-slate-750 transition">
          <div className="p-3.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Agenda &amp; Tugas</p>
            <h3 className="text-xl font-extrabold text-white mt-1">{agendas.length} Agenda</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tugas: {agendas.filter(a => a.type === 'tugas').length} | Pengumuman: {agendas.filter(a => a.type === 'pengumuman').length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Struktur Organisasi */}
        <div className="lg:col-span-2 bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Struktur Organisasi Kelas</h2>
              <p className="text-xs text-slate-450 mt-0.5">Struktur kepengurusan resmi administrasi kelas</p>
            </div>
            {!isEditingStructure ? (
              <button
                onClick={() => {
                  setEditedStructure({ ...structure });
                  setIsEditingStructure(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold transition animate-fade-in"
                id="edit-structure-btn"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Pengurus
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveStructure}
                  className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan
                </button>
                <button
                  onClick={() => {
                    setEditedStructure({ ...structure });
                    setIsEditingStructure(false);
                  }}
                  className="flex items-center gap-1 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
              </div>
            )}
          </div>

          {isEditingStructure ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Wali Kelas</label>
                <input
                  type="text"
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                  value={editedStructure.waliKelas}
                  onChange={(e) => setEditedStructure({ ...editedStructure, waliKelas: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Ketua Kelas</label>
                <input
                  type="text"
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                  value={editedStructure.ketuaKelas}
                  onChange={(e) => setEditedStructure({ ...editedStructure, ketuaKelas: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Wakil Ketua Kelas</label>
                <input
                  type="text"
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                  value={editedStructure.wakilKetua}
                  onChange={(e) => setEditedStructure({ ...editedStructure, wakilKetua: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Sekretaris</label>
                <input
                  type="text"
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                  value={editedStructure.sekretaris}
                  onChange={(e) => setEditedStructure({ ...editedStructure, sekretaris: e.target.value })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400">Bendahara</label>
                <input
                  type="text"
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                  value={editedStructure.bendahara}
                  onChange={(e) => setEditedStructure({ ...editedStructure, bendahara: e.target.value })}
                />
              </div>
            </div>
          ) : (
            /* Visual Organization Flow Tree */
            <div className="flex flex-col items-center gap-6 py-4 bg-[#10141A] rounded-xl border border-dashed border-slate-800">
              {/* Wali Kelas */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl px-6 py-2.5 border border-indigo-500/30 shadow-md flex items-center gap-2 text-center text-sm md:text-base">
                  <Shield className="w-5 h-5 text-indigo-300" />
                  <div className="text-left">
                    <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider leading-none mb-0.5">Wali Kelas</div>
                    <div className="font-extrabold">{structure.waliKelas || "Belum ditentukan"}</div>
                  </div>
                </div>
                <div className="w-0.5 h-6 bg-slate-800" />
              </div>

              {/* Ketua & Wakil Kelas */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 relative w-full justify-center px-4">
                {/* Connector line for large screens */}
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0" />
                
                {/* Ketua */}
                <div className="bg-[#161B22] border-2 border-indigo-500/10 rounded-2xl px-5 py-3 shadow-sm text-center w-full max-w-[200px] relative z-10">
                  <div className="mx-auto w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-1.5 font-bold text-xs">1</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ketua Kelas</div>
                  <div className="font-bold text-white text-sm">{structure.ketuaKelas || "-"}</div>
                </div>

                {/* Wakil Ketua */}
                <div className="bg-[#161B22] border-2 border-indigo-500/10 rounded-2xl px-5 py-3 shadow-sm text-center w-full max-w-[200px] relative z-10">
                  <div className="mx-auto w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-1.5 font-bold text-xs">2</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wakil Ketua</div>
                  <div className="font-bold text-white text-sm">{structure.wakilKetua || "-"}</div>
                </div>
              </div>

              <div className="w-0.5 h-6 bg-slate-800" />

              {/* Sekretaris & Bendahara */}
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
                {/* Sekretaris */}
                <div className="bg-[#161B22] border border-slate-800 rounded-2xl px-5 py-3 shadow-sm text-center w-full max-w-[200px]">
                  <div className="mx-auto w-7 h-7 rounded-full bg-slate-800 text-slate-400 border border-slate-750 flex items-center justify-center mb-1.5 font-extrabold text-xs">S</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sekretaris</div>
                  <div className="font-bold text-slate-300 text-xs md:text-sm">{structure.sekretaris || "-"}</div>
                </div>

                {/* Bendahara */}
                <div className="bg-[#161B22] border border-slate-800 rounded-2xl px-5 py-3 shadow-sm text-center w-full max-w-[200px]">
                  <div className="mx-auto w-7 h-7 rounded-full bg-slate-800 text-slate-400 border border-slate-750 flex items-center justify-center mb-1.5 font-extrabold text-xs">B</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bendahara</div>
                  <div className="font-bold text-slate-300 text-xs md:text-sm">{structure.bendahara || "-"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Piket Hari Ini & Agenda Terdekat */}
        <div className="space-y-6">
          {/* Piket Hari Ini */}
          <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" /> Jadwal Piket hari {dayName}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Siswa bertugas menjaga kebersihan kelas hari ini</p>
            
            {piketStudents.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {piketStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-2 p-2 bg-[#10141A] rounded-xl border border-slate-800/60">
                    <div className={`w-2 h-2 rounded-full ${student.gender === 'L' ? 'bg-indigo-400' : 'bg-pink-400'}`} />
                    <span className="text-xs font-bold text-slate-300 truncate">{student.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-[#10141A] rounded-xl border border-dashed border-slate-800">
                <User className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-400">Tidak ada piket</p>
                <p className="text-[10px] text-slate-500">Atur jadwal di menu Piket</p>
              </div>
            )}
          </div>

          {/* Agenda & Tugas Terdekat */}
          <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Agenda &amp; Tugas Kelas
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Informasi tugas dan kegiatan terbaru</p>
            
            {upcomingAgendas.length > 0 ? (
              <div className="space-y-3">
                {upcomingAgendas.map(agenda => (
                  <div key={agenda.id} className="p-3 bg-[#10141A] rounded-xl border border-slate-800 relative overflow-hidden">
                    {/* Color bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                      agenda.type === 'tugas' ? 'bg-rose-500' : 
                      agenda.type === 'pengumuman' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`} />
                    
                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-1 ${
                          agenda.type === 'tugas' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                          agenda.type === 'pengumuman' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {agenda.type}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{agenda.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{agenda.content}</p>
                      </div>
                      
                      {agenda.dueDate && (
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-lg border border-rose-500/20">
                            Dl: {agenda.dueDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-[#10141A] rounded-xl border border-dashed border-slate-800">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-400">Belum ada agenda</p>
                <p className="text-[10px] text-slate-500">Semua tugas kelas akan tampil di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

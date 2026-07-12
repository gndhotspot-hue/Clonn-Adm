import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Award, 
  TrendingUp, 
  User, 
  Save, 
  Search, 
  Calculator, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  BarChart2,
  FileText,
  Download,
  Printer,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { Student, GradeItem, AttendanceDay, ClassInfo } from '../types';
import { jsPDF } from 'jspdf';

interface GradeManagerProps {
  students: Student[];
  grades: GradeItem[];
  attendance?: AttendanceDay[];
  classInfo?: ClassInfo;
  onAddGradeColumn: (grade: GradeItem) => void;
  onUpdateGradeScores: (id: string, scores: { [studentId: string]: number }) => void;
  onDeleteGradeColumn: (id: string) => void;
  onLoadSampleGrades?: () => void;
}

const SUBJECT_LIST = [
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'PPKn',
  'Pendidikan Agama & Budi Pekerti',
  'Seni Budaya & Prakarya (SBdP)',
  'PJOK'
];

export default function GradeManager({
  students,
  grades,
  attendance = [],
  classInfo,
  onAddGradeColumn,
  onUpdateGradeScores,
  onDeleteGradeColumn,
  onLoadSampleGrades
}: GradeManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'subject_recap' | 'overall_recap' | 'erapor'>('input');
  
  // Selection States
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECT_LIST[0]);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  
  // Grade Input Form States
  const [isNewColModalOpen, setIsNewColModalOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDate, setNewColDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newColType, setNewColType] = useState<'formatif' | 'sumatif'>('formatif');
  const [colError, setColError] = useState('');
  
  // Score inputs state (temporary buffer during editing)
  const [scoreBuffer, setScoreBuffer] = useState<{ [studentId: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // e-Rapor States
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [semesterSelection, setSemesterSelection] = useState<string>('Semester 1 (Ganjil)');
  const [catatanWali, setCatatanWali] = useState<{ [studentId: string]: string }>(() => {
    const saved = localStorage.getItem('erapor_catatan_wali');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Extracurricular data per student
  const [ekskulData, setEkskulData] = useState<{ 
    [studentId: string]: { nama: string; predikat: string; keterangan: string }[] 
  }>(() => {
    const saved = localStorage.getItem('erapor_ekskul_data');
    return saved ? JSON.parse(saved) : {};
  });

  // Target passing score (KKM)
  const KKM = 70;

  // Sync state to LocalStorage
  React.useEffect(() => {
    localStorage.setItem('erapor_catatan_wali', JSON.stringify(catatanWali));
  }, [catatanWali]);

  React.useEffect(() => {
    localStorage.setItem('erapor_ekskul_data', JSON.stringify(ekskulData));
  }, [ekskulData]);

  // Set default selected student for e-Rapor
  React.useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Filter grade columns for the selected subject
  const currentSubjectColumns = grades.filter(g => g.subject === selectedSubject);

  // Auto-select a column if none selected or if selected isn't in current subject list
  const activeColumn = currentSubjectColumns.find(c => c.id === selectedColumnId) || currentSubjectColumns[0];

  // Initialize buffer when column changes
  React.useEffect(() => {
    if (activeColumn) {
      setSelectedColumnId(activeColumn.id);
      const initialBuffer: { [studentId: string]: string } = {};
      students.forEach(std => {
        const score = activeColumn.scores[std.id];
        initialBuffer[std.id] = score !== undefined ? String(score) : '';
      });
      setScoreBuffer(initialBuffer);
    } else {
      setSelectedColumnId('');
      setScoreBuffer({});
    }
    setSaveSuccessMsg('');
  }, [activeColumn, students, selectedSubject]);

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    setColError('');

    if (!newColTitle.trim()) {
      setColError('Judul penilaian wajib diisi.');
      return;
    }

    // Check if column title already exists for this subject
    const titleExists = currentSubjectColumns.some(
      c => c.title.toLowerCase() === newColTitle.trim().toLowerCase()
    );
    if (titleExists) {
      setColError('Judul penilaian ini sudah ada untuk mata pelajaran ini.');
      return;
    }

    const newCol: GradeItem = {
      id: 'grd_' + Date.now(),
      subject: selectedSubject,
      title: newColTitle.trim(),
      date: newColDate,
      type: newColType,
      scores: {}
    };

    onAddGradeColumn(newCol);
    setSelectedColumnId(newCol.id);
    setIsNewColModalOpen(false);
    setNewColTitle('');
  };

  const handleSaveScores = () => {
    if (!activeColumn) return;

    const numericScores: { [studentId: string]: number } = {};
    students.forEach(std => {
      const val = scoreBuffer[std.id];
      if (val !== undefined && val !== '') {
        const parsed = parseFloat(val);
        numericScores[std.id] = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
      }
    });

    onUpdateGradeScores(activeColumn.id, numericScores);
    setSaveSuccessMsg('Nilai berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Calculations for Per-Subject Recap
  const getStudentSubjectAverage = (studentId: string, subjectName: string) => {
    const subjectGrades = grades.filter(g => g.subject === subjectName);
    let total = 0;
    let count = 0;
    subjectGrades.forEach(g => {
      const s = g.scores[studentId];
      if (s !== undefined) {
        total += s;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : null;
  };

  // Calculations for Overall Recap
  const getStudentOverallAverage = (studentId: string) => {
    let sumOfAverages = 0;
    let subjectCount = 0;
    SUBJECT_LIST.forEach(sub => {
      const avg = getStudentSubjectAverage(studentId, sub);
      if (avg !== null) {
        sumOfAverages += avg;
        subjectCount++;
      }
    });
    return subjectCount > 0 ? Math.round(sumOfAverages / subjectCount) : null;
  };

  // Overall class averages and statistics
  const getOverallClassStatistics = () => {
    const studentAverages = students
      .map(std => getStudentOverallAverage(std.id))
      .filter((avg): avg is number => avg !== null);

    if (studentAverages.length === 0) return null;

    const classAvg = studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length;
    const highest = Math.max(...studentAverages);
    const lowest = Math.min(...studentAverages);
    const passedCount = studentAverages.filter(avg => avg >= KKM).length;

    return {
      classAverage: Math.round(classAvg * 10) / 10,
      highest,
      lowest,
      passedCount,
      totalCount: studentAverages.length
    };
  };

  const classStats = getOverallClassStatistics();

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nisn.includes(searchQuery)
  );

  return (
    <div className="space-y-6" id="grade-manager">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" /> Buku Nilai &amp; Akademik Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Masukkan nilai tugas, ulangan harian, ujian semester, serta pantau rekapitulasi nilai per mapel dan rapor bayangan</p>
        </div>

        {students.length > 0 && grades.length === 0 && onLoadSampleGrades && (
          <button
            onClick={onLoadSampleGrades}
            className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            Generate Contoh Nilai
          </button>
        )}
      </div>

      {/* Main Tab bar */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('input')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'input' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/10' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" /> Input Nilai Guru
        </button>
        <button
          onClick={() => setActiveSubTab('subject_recap')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'subject_recap' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/10' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Rekap Per Mata Pelajaran
        </button>
        <button
          onClick={() => setActiveSubTab('overall_recap')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'overall_recap' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/10' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Rekap Nilai Keseluruhan
        </button>
        <button
          onClick={() => setActiveSubTab('erapor')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'erapor' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/10' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
          id="erapor-tab-btn"
        >
          <FileText className="w-4 h-4" /> E-Rapor Kurikulum Merdeka
        </button>
      </div>

      {/* --------------------- TAB 1: INPUT NILAI --------------------- */}
      {activeSubTab === 'input' && (
        <div className="space-y-6">
          {/* Filters and Controls block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161B22] p-4 rounded-2xl border border-slate-800/80">
            {/* Subject Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Pilih Mata Pelajaran</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-[#10141A] text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {SUBJECT_LIST.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Assessment Column Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Pilih Kolom Penilaian</label>
              <div className="flex gap-2">
                <select
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  disabled={currentSubjectColumns.length === 0}
                  className="flex-1 bg-[#10141A] text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:text-slate-500"
                >
                  {currentSubjectColumns.length > 0 ? (
                    currentSubjectColumns.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.title} ({col.type === 'sumatif' ? 'Sumatif' : 'Formatif'}) - {col.date}
                      </option>
                    ))
                  ) : (
                    <option value="">Belum ada kolom nilai</option>
                  )}
                </select>

                <button
                  onClick={() => setIsNewColModalOpen(true)}
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center shrink-0"
                  title="Tambah Kolom Penilaian Baru"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Delete Column Column */}
            <div className="flex items-end justify-end">
              {activeColumn && (
                <button
                  onClick={() => {
                    if (confirm(`Hapus kolom nilai "${activeColumn.title}" dan semua nilai siswa di dalamnya?`)) {
                      onDeleteGradeColumn(activeColumn.id);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950/40 hover:border-rose-900 border border-slate-700 text-slate-350 hover:text-rose-400 rounded-xl text-xs font-semibold transition w-full md:w-auto"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Kolom Nilai
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          {students.length === 0 ? (
            <div className="bg-[#161B22] rounded-2xl border border-slate-800 py-16 text-center">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Daftar murid kosong</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan tambah murid terlebih dahulu di menu "Daftar Murid" sebelum memasukkan nilai akademik.
              </p>
            </div>
          ) : !activeColumn ? (
            <div className="bg-[#161B22] rounded-2xl border border-slate-800 py-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Belum Ada Kolom Penilaian</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Buat kolom nilai pertama untuk mata pelajaran <b>{selectedSubject}</b> seperti Tugas 1, Ulangan Harian, atau Ujian Semester.
              </p>
              <button
                onClick={() => setIsNewColModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Buat Kolom Nilai Baru
              </button>
            </div>
          ) : (
            <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
              <div className="p-4 bg-[#10141A] border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Masukkan Nilai: {activeColumn.title} ({selectedSubject})</h3>
                    {activeColumn.type === 'sumatif' ? (
                      <span className="inline-flex px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] rounded-full font-bold uppercase tracking-wider">
                        Sumatif
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] rounded-full font-bold uppercase tracking-wider">
                        Formatif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Edit nilai langsung pada kolom masukan di bawah, lalu klik "Simpan Nilai"</p>
                </div>

                <div className="relative w-full md:max-w-xs">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari murid..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#10141A]/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Nama Siswa</th>
                      <th className="py-3 px-6">NISN</th>
                      <th className="py-3 px-6">Gender</th>
                      <th className="py-3 px-6 w-36 text-center">Nilai (0 - 100)</th>
                      <th className="py-3 px-6 w-44 text-right">Status KKM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredStudents.map((std) => {
                      const scoreVal = scoreBuffer[std.id];
                      const numericVal = scoreVal !== '' ? parseFloat(scoreVal) : NaN;
                      const hasPassed = !isNaN(numericVal) && numericVal >= KKM;
                      const isFailing = !isNaN(numericVal) && numericVal < KKM;

                      return (
                        <tr key={std.id} className="hover:bg-slate-800/20 transition">
                          <td className="py-3 px-6 font-semibold text-white">{std.name}</td>
                          <td className="py-3 px-6 text-slate-400 font-mono">{std.nisn}</td>
                          <td className="py-3 px-6 text-slate-500 font-bold font-mono">{std.gender}</td>
                          <td className="py-3 px-6">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="--"
                                value={scoreVal ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setScoreBuffer(prev => ({
                                    ...prev,
                                    [std.id]: v === '' ? '' : String(Math.min(100, Math.max(0, parseFloat(v) || 0)))
                                  }));
                                }}
                                className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-6 text-right">
                            {isNaN(numericVal) ? (
                              <span className="text-slate-500 italic font-semibold">Belum Diisi</span>
                            ) : hasPassed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                                Tuntas (≥{KKM})
                              </span>
                            ) : isFailing ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-bold text-[10px]">
                                Remedial (&lt;{KKM})
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save CTA bar */}
              <div className="p-4 border-t border-slate-800 bg-[#10141A] flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400">
                  {saveSuccessMsg ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-4 h-4" /> {saveSuccessMsg}
                    </span>
                  ) : (
                    <span>Terdapat {students.length} murid total untuk dinilai</span>
                  )}
                </div>

                <button
                  onClick={handleSaveScores}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Save className="w-4 h-4" /> Simpan Nilai
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------- TAB 2: REKAP NILAI PER MAPEL --------------------- */}
      {activeSubTab === 'subject_recap' && (
        <div className="space-y-6">
          {/* Select Subject Filter Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161B22] p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Mata Pelajaran</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-white focus:outline-none p-0 mt-0.5 cursor-pointer hover:text-indigo-400 transition"
                >
                  {SUBJECT_LIST.map(sub => (
                    <option key={sub} value={sub} className="bg-[#161B22] text-white font-medium">{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-semibold bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
              Terdapat {currentSubjectColumns.length} Kolom Penilaian Terdaftar
            </span>
          </div>

          {currentSubjectColumns.length === 0 ? (
            <div className="bg-[#161B22] rounded-2xl border border-slate-800 py-16 text-center">
              <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Tidak ada data rekap</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan buat kolom nilai dan masukkan skor siswa di menu "Input Nilai Guru" untuk melihat rekapitulasi data mapel {selectedSubject}.
              </p>
            </div>
          ) : (
            <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
              <div className="p-4 bg-[#10141A] border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Tabel Rekapitulasi Nilai Mapel: {selectedSubject}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rangkuman seluruh skor dan nilai rata-rata mata pelajaran bagi setiap siswa</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#10141A]/50 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Nama Siswa</th>
                      {currentSubjectColumns.map(col => (
                        <th key={col.id} className="py-3 px-6 text-center whitespace-nowrap min-w-[100px]">
                          {col.title}
                        </th>
                      ))}
                      <th className="py-3 px-6 text-right font-bold text-indigo-400">Rata-Rata Mapel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {students.map((std) => {
                      const subjectAvg = getStudentSubjectAverage(std.id, selectedSubject);
                      const isPassingAvg = subjectAvg !== null && subjectAvg >= KKM;

                      return (
                        <tr key={std.id} className="hover:bg-slate-800/20 transition">
                          <td className="py-3 px-6 font-semibold text-white">{std.name}</td>
                          {currentSubjectColumns.map(col => {
                            const score = col.scores[std.id];
                            return (
                              <td key={col.id} className="py-3 px-6 text-center font-mono font-bold">
                                {score !== undefined ? (
                                  <span className={score < KKM ? 'text-rose-400' : 'text-slate-200'}>
                                    {score}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-6 text-right font-mono font-extrabold text-sm">
                            {subjectAvg !== null ? (
                              <span className={isPassingAvg ? 'text-emerald-400' : 'text-rose-450'}>
                                {subjectAvg}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic font-semibold text-xs">Belum Ada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------- TAB 3: REKAP NILAI KESELURUHAn --------------------- */}
      {activeSubTab === 'overall_recap' && (
        <div className="space-y-6">
          {/* Class statistics cards */}
          {classStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#161B22] p-5 rounded-2xl border border-slate-800/80 shadow-sm hover:shadow-md transition">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Kelas</p>
                <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{classStats.classAverage}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Akumulasi nilai seluruh mapel</p>
              </div>

              <div className="bg-[#161B22] p-5 rounded-2xl border border-slate-800/80 shadow-sm hover:shadow-md transition">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Tertinggi</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{classStats.highest}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Rata-rata murid tertinggi</p>
              </div>

              <div className="bg-[#161B22] p-5 rounded-2xl border border-slate-800/80 shadow-sm hover:shadow-md transition">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Terendah</p>
                <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{classStats.lowest}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Rata-rata murid terendah</p>
              </div>

              <div className="bg-[#161B22] p-5 rounded-2xl border border-slate-800/80 shadow-sm hover:shadow-md transition">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ketuntasan Kelas</p>
                <h3 className="text-2xl font-extrabold text-blue-400 mt-1">
                  {Math.round((classStats.passedCount / classStats.totalCount) * 100)}%
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">{classStats.passedCount} dari {classStats.totalCount} murid tuntas KKM (≥{KKM})</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 p-4 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Belum ada data nilai yang diinput di mata pelajaran apa pun untuk menghitung statistik kelas.</span>
            </div>
          )}

          {/* Master Ledger Table */}
          <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-[#10141A] border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Tabel Rekap Nilai Akademik Keseluruhan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ledger nilai rata-rata mata pelajaran siswa untuk melihat performa kualitatif dan kuantitatif</p>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
                KKM Kelas: {KKM}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#10141A]/50 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6 sticky left-0 bg-[#161B22] z-10">Nama Siswa</th>
                    {SUBJECT_LIST.map(sub => (
                      <th key={sub} className="py-3 px-6 text-center whitespace-nowrap min-w-[120px]">
                        {sub.split(' ')[0]} {/* Short subject code */}
                      </th>
                    ))}
                    <th className="py-3 px-6 text-right font-bold text-indigo-400 whitespace-nowrap sticky right-0 bg-[#161B22] border-l border-slate-800">
                      Rata-Rata Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {students.map((std) => {
                    const overallAvg = getStudentOverallAverage(std.id);
                    const isPassingOverall = overallAvg !== null && overallAvg >= KKM;

                    return (
                      <tr key={std.id} className="hover:bg-slate-800/20 transition">
                        <td className="py-3.5 px-6 font-semibold text-white sticky left-0 bg-[#161B22] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                          {std.name}
                        </td>
                        {SUBJECT_LIST.map(sub => {
                          const avg = getStudentSubjectAverage(std.id, sub);
                          return (
                            <td key={sub} className="py-3.5 px-6 text-center font-mono font-bold">
                              {avg !== null ? (
                                <span className={avg < KKM ? 'text-rose-400' : 'text-slate-300'}>
                                  {avg}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-normal italic text-[11px]">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3.5 px-6 text-right font-mono font-extrabold text-sm sticky right-0 bg-[#161B22] border-l border-slate-800 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.2)]">
                          {overallAvg !== null ? (
                            <span className={isPassingOverall ? 'text-emerald-400' : 'text-rose-450'}>
                              {overallAvg}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic font-semibold text-xs">Belum Ada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- TAB 4: E-RAPOR KURIKULUM MERDEKA --------------------- */}
      {activeSubTab === 'erapor' && (() => {
        // Find selected student
        const student = students.find(s => s.id === selectedStudentId) || students[0];
        if (!student) {
          return (
            <div className="bg-[#161B22] rounded-2xl border border-slate-800 py-16 text-center">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Daftar murid kosong</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan tambah murid terlebih dahulu di menu "Daftar Murid" untuk mengelola E-Rapor.
              </p>
            </div>
          );
        }

        // Attendance count helper
        const getStudentAttendanceCount = (studentId: string, status: 'S' | 'I' | 'A') => {
          let count = 0;
          attendance.forEach(day => {
            if (day.records[studentId] === status) {
              count++;
            }
          });
          return count;
        };

        const sCount = getStudentAttendanceCount(student.id, 'S');
        const iCount = getStudentAttendanceCount(student.id, 'I');
        const aCount = getStudentAttendanceCount(student.id, 'A');

        // Dynamic Capaian Kompetensi Kurikulum Merdeka
        const getCapaianKompetensi = (studentId: string, subjectName: string, avg: number | null) => {
          if (avg === null) return "Belum ada penilaian tercatat.";
          
          const subjectGrades = grades.filter(g => g.subject === subjectName);
          const validGrades = subjectGrades.filter(g => g.scores[studentId] !== undefined);
          
          if (validGrades.length === 0) return "Belum ada penilaian tercatat.";
          
          let highestGrade = validGrades[0];
          let lowestGrade = validGrades[0];
          
          validGrades.forEach(g => {
            const score = g.scores[studentId];
            if (score > highestGrade.scores[studentId]) {
              highestGrade = g;
            }
            if (score < lowestGrade.scores[studentId]) {
              lowestGrade = g;
            }
          });
          
          const hScore = highestGrade.scores[studentId];
          const lScore = lowestGrade.scores[studentId];
          const hTitle = highestGrade.title;
          const lTitle = lowestGrade.title;
          
          if (validGrades.length === 1) {
            if (hScore >= 70) {
              return `Menunjukkan penguasaan yang sangat baik dalam memahami materi ${hTitle}.`;
            } else {
              return `Perlu bimbingan lebih lanjut dan pendampingan dalam memahami materi ${hTitle}.`;
            }
          }
          
          if (hScore === lScore) {
            return `Menunjukkan penguasaan yang konsisten dalam materi ${hTitle} dengan capaian yang baik.`;
          }
          
          let text = `Menunjukkan penguasaan yang sangat baik dalam materi ${hTitle}.`;
          if (lScore < 70) {
            text += ` Perlu bimbingan dan remedial intensif terutama dalam meningkatkan pemahaman tentang ${lTitle}.`;
          } else {
            text += ` Perlu peningkatan pemahaman yang lebih mendalam pada materi ${lTitle} agar lebih optimal.`;
          }
          return text;
        };

        const studentEkskuls = ekskulData[student.id] || [
          { nama: 'Pramuka', predikat: 'Baik', keterangan: 'Sangat aktif mengikuti latihan kepanduan dengan aktif dan berdisiplin tinggi.' },
          { nama: 'UKS / Dokter Kecil', predikat: 'Baik', keterangan: 'Memahami dasar-dasar kesehatan lingkungan dengan sangat memadai.' }
        ];

        const handleEkskulChange = (index: number, field: 'nama' | 'predikat' | 'keterangan', value: string) => {
          const updated = [...studentEkskuls];
          updated[index] = { ...updated[index], [field]: value };
          setEkskulData(prev => ({
            ...prev,
            [student.id]: updated
          }));
        };

        const handleAddEkskul = () => {
          const updated = [...studentEkskuls, { nama: 'Ekskul Baru', predikat: 'Baik', keterangan: 'Mengikuti kegiatan dengan baik dan aktif.' }];
          setEkskulData(prev => ({
            ...prev,
            [student.id]: updated
          }));
        };

        const handleRemoveEkskul = (index: number) => {
          const updated = studentEkskuls.filter((_, idx) => idx !== index);
          setEkskulData(prev => ({
            ...prev,
            [student.id]: updated
          }));
        };

        const activeWaliNote = catatanWali[student.id] || "Tingkatkan terus belajarmu, pelihara semangat pantang menyerah untuk menggapai cita-citamu.";

        // High-fidelity official PDF Generation using jsPDF vector placements
        const handleDownloadRaporPDF = (student: Student) => {
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pageWidth = doc.internal.pageSize.width; // 210
          const pageHeight = doc.internal.pageSize.height; // 297
          const marginX = 15;
          const printWidth = pageWidth - (marginX * 2); // 180

          let currentY = 15;

          // 1. Header (Kop)
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text("LAPORAN HASIL BELAJAR (RAPOR)", pageWidth / 2, currentY, { align: 'center' });
          currentY += 5.5;
          doc.setFontSize(11);
          doc.text("KURIKULUM MERDEKA", pageWidth / 2, currentY, { align: 'center' });
          currentY += 8;

          // 2. Student Metadata Table (2 Columns layout)
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);

          // Left block
          doc.text("Nama Peserta Didik", marginX, currentY);
          doc.text(`: ${student.name}`, marginX + 35, currentY);
          doc.text("NISN", marginX, currentY + 5);
          doc.text(`: ${student.nisn}`, marginX + 35, currentY + 5);
          doc.text("Sekolah", marginX, currentY + 10);
          doc.text(`: ${classInfo?.schoolName || 'SD Negeri Cimandirasa'}`, marginX + 35, currentY + 10);

          // Right block
          const rightColX = pageWidth / 2 + 10;
          doc.text("Kelas", rightColX, currentY);
          doc.text(`: ${classInfo?.className || 'Kelas VI-A'}`, rightColX + 25, currentY);
          doc.text("Semester", rightColX, currentY + 5);
          doc.text(`: ${semesterSelection}`, rightColX + 25, currentY + 5);
          doc.text("Tahun Ajaran", rightColX, currentY + 10);
          doc.text(`: ${classInfo?.academicYear || '2026/2027'}`, rightColX + 25, currentY + 10);

          currentY += 16;

          // Draw single divider line
          doc.setDrawColor(148, 163, 184);
          doc.setLineWidth(0.3);
          doc.line(marginX, currentY, pageWidth - marginX, currentY);
          currentY += 6;

          // 3. Subjects Table Header
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.text("A. NILAI AKADEMIK & CAPAIAN KOMPETENSI", marginX, currentY);
          currentY += 5;

          // Draw Academic Table Headers
          const tableHeaderY = currentY;
          const colWidths = [10, 50, 25, 95]; // total 180
          const headers = ["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"];
          
          doc.setFillColor(241, 245, 249); // slate-100
          doc.rect(marginX, tableHeaderY, printWidth, 8, 'F');
          doc.setDrawColor(71, 85, 105);
          doc.setLineWidth(0.2);

          let xOffset = marginX;
          headers.forEach((h, idx) => {
            const w = colWidths[idx];
            doc.rect(xOffset, tableHeaderY, w, 8, 'S');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text(h, xOffset + (w / 2), tableHeaderY + 5.5, { align: 'center' });
            xOffset += w;
          });

          currentY += 8;

          // Draw table rows
          SUBJECT_LIST.forEach((subject, subIdx) => {
            const avg = getStudentSubjectAverage(student.id, subject);
            const desc = getCapaianKompetensi(student.id, subject, avg);

            // Wrap description text to fit in 91mm wide cell
            const wrappedDesc = doc.splitTextToSize(desc, 91);
            const linesCount = wrappedDesc.length;
            
            const rowHeight = Math.max(10, (linesCount * 4) + 4);

            // Check for page overflow
            if (currentY + rowHeight > pageHeight - 20) {
              doc.addPage();
              currentY = 20;
              
              // Re-draw table header on new page
              doc.setFillColor(241, 245, 249);
              doc.rect(marginX, currentY, printWidth, 8, 'F');
              let tempX = marginX;
              headers.forEach((h, idx) => {
                const w = colWidths[idx];
                doc.rect(tempX, currentY, w, 8, 'S');
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.text(h, tempX + (w / 2), currentY + 5.5, { align: 'center' });
                tempX += w;
              });
              currentY += 8;
            }

            // Draw cell boxes
            let tempX = marginX;
            colWidths.forEach((w) => {
              doc.rect(tempX, currentY, w, rowHeight, 'S');
              tempX += w;
            });

            // No
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(String(subIdx + 1), marginX + 5, currentY + (rowHeight / 2) + 1, { align: 'center' });

            // Subject Name
            doc.text(subject, marginX + 12, currentY + (rowHeight / 2) + 1);

            // Final Grade (Nilai Akhir)
            doc.setFont('Helvetica', 'bold');
            const avgText = avg !== null ? String(avg) : "-";
            doc.text(avgText, marginX + 10 + 50 + (25 / 2), currentY + (rowHeight / 2) + 1, { align: 'center' });

            // Description (Capaian Kompetensi)
            doc.setFont('Helvetica', 'normal');
            wrappedDesc.forEach((lineText: string, lIdx: number) => {
              doc.text(lineText, marginX + 10 + 50 + 25 + 2, currentY + 4.5 + (lIdx * 4));
            });

            currentY += rowHeight;
          });

          currentY += 8;

          // 4. Extracurricular Table
          if (currentY + 30 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.text("B. EKSTRAKURIKULER", marginX, currentY);
          currentY += 4.5;

          const ekskulHeaders = ["No", "Kegiatan Ekstrakurikuler", "Predikat", "Keterangan"];
          const ekskulWidths = [10, 60, 25, 85];

          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, printWidth, 7, 'F');
          let tempX = marginX;
          ekskulHeaders.forEach((eh, idx) => {
            const w = ekskulWidths[idx];
            doc.rect(tempX, currentY, w, 7, 'S');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(eh, tempX + (w / 2), currentY + 4.5, { align: 'center' });
            tempX += w;
          });
          currentY += 7;

          studentEkskuls.forEach((ek, ekIdx) => {
            const ekRowHeight = 9;
            tempX = marginX;
            ekskulWidths.forEach((w) => {
              doc.rect(tempX, currentY, w, ekRowHeight, 'S');
              tempX += w;
            });

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(String(ekIdx + 1), marginX + 5, currentY + 5.5, { align: 'center' });
            doc.text(ek.nama, marginX + 12, currentY + 5.5);
            doc.setFont('Helvetica', 'bold');
            doc.text(ek.predikat, marginX + 10 + 60 + (25 / 2), currentY + 5.5, { align: 'center' });
            doc.setFont('Helvetica', 'normal');
            doc.text(ek.keterangan, marginX + 10 + 60 + 25 + 2, currentY + 5.5);
            
            currentY += ekRowHeight;
          });

          currentY += 8;

          // 5. Attendance (Kehadiran) & Wali Notes (side by side)
          if (currentY + 32 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
          }

          const boxWidth = 85;
          const boxHeight = 25;

          // Draw Attendance Box
          doc.setDrawColor(148, 163, 184);
          doc.rect(marginX, currentY, boxWidth, boxHeight, 'S');
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, currentY, boxWidth, 6, 'F');
          doc.line(marginX, currentY + 6, marginX + boxWidth, currentY + 6);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text("C. KETIDAKHADIRAN", marginX + (boxWidth / 2), currentY + 4, { align: 'center' });

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`1. Sakit`, marginX + 4, currentY + 11);
          doc.text(`: ${sCount} hari`, marginX + 35, currentY + 11);
          doc.text(`2. Izin`, marginX + 4, currentY + 16);
          doc.text(`: ${iCount} hari`, marginX + 35, currentY + 16);
          doc.text(`3. Tanpa Keterangan (Alpa)`, marginX + 4, currentY + 21);
          doc.text(`: ${aCount} hari`, marginX + 35, currentY + 21);

          // Draw Notes Box
          const notesX = pageWidth - marginX - boxWidth;
          doc.rect(notesX, currentY, boxWidth, boxHeight, 'S');
          doc.rect(notesX, currentY, boxWidth, 6, 'F');
          doc.line(notesX, currentY + 6, notesX + boxWidth, currentY + 6);
          doc.setFont('Helvetica', 'bold');
          doc.text("D. CATATAN WALI KELAS", notesX + (boxWidth / 2), currentY + 4, { align: 'center' });

          doc.setFont('Helvetica', 'normal');
          const noteText = activeWaliNote;
          const wrappedNotes = doc.splitTextToSize(noteText, boxWidth - 6);
          wrappedNotes.forEach((line: string, lineIdx: number) => {
            if (lineIdx < 4) { 
              doc.text(line, notesX + 3, currentY + 11 + (lineIdx * 4.5));
            }
          });

          currentY += boxHeight + 12;

          // 6. Signatures block
          if (currentY + 30 > pageHeight - 15) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);

          // Parents
          let sY = currentY;
          doc.text("Mengetahui,", marginX + 5, sY);
          sY += 4.5;
          doc.text("Orang Tua / Wali Siswa", marginX + 5, sY);
          sY += 15;
          doc.text("__________________________", marginX + 5, sY);

          // Principal
          sY = currentY;
          const midX = pageWidth / 2;
          doc.text("Kepala Sekolah", midX, sY, { align: 'center' });
          sY += 4.5;
          doc.text("SD Negeri Cimandirasa", midX, sY, { align: 'center' });
          sY += 15;
          doc.setFont('Helvetica', 'bold');
          doc.text("Haji Mulyono, M.Pd.", midX, sY, { align: 'center' });
          doc.setFont('Helvetica', 'normal');
          sY += 4;
          doc.text("NIP. 196805121991031005", midX, sY, { align: 'center' });

          // Wali Kelas
          sY = currentY;
          const rightAlignX = pageWidth - marginX - 5;
          const dStr = `Sukabumi, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
          doc.text(dStr, rightAlignX, sY, { align: 'right' });
          sY += 4.5;
          doc.text(`Wali Kelas`, rightAlignX, sY, { align: 'right' });
          sY += 15;
          doc.setFont('Helvetica', 'bold');
          const teacherName = localStorage.getItem('school_current_user') 
            ? JSON.parse(localStorage.getItem('school_current_user')!).name 
            : "Guru Kelas";
          doc.text(teacherName, rightAlignX, sY, { align: 'right' });
          doc.setFont('Helvetica', 'normal');
          sY += 4;
          doc.text("NIP. -", rightAlignX, sY, { align: 'right' });

          // Save the PDF
          doc.save(`Rapor_Merdeka_${student.name.replace(/\s+/g, '_')}.pdf`);
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Selector and Editable Fields */}
            <div className="space-y-6">
              <div className="bg-[#161B22] p-5 rounded-2xl border border-slate-800/80 shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">1. Pilih Murid</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-[#10141A] text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.nisn})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">2. Pilih Semester</label>
                  <select
                    value={semesterSelection}
                    onChange={(e) => setSemesterSelection(e.target.value)}
                    className="w-full bg-[#10141A] text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                    <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
                  </select>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Catatan Wali Kelas</label>
                    <span className="text-[9px] text-slate-500 font-bold">{activeWaliNote.length}/150 karakter</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={150}
                    placeholder="Tulis saran atau evaluasi umum untuk memotivasi siswa..."
                    value={activeWaliNote}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCatatanWali(prev => ({
                        ...prev,
                        [student.id]: v
                      }));
                    }}
                    className="w-full bg-[#10141A] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>

              {/* Extracurricular Editor */}
              <div className="bg-[#161B22] p-5 rounded-2xl border border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-indigo-400" /> Ekstrakurikuler
                  </h4>
                  <button
                    onClick={handleAddEkskul}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20 transition"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {studentEkskuls.map((ek, idx) => (
                    <div key={idx} className="p-3 bg-[#10141A] rounded-xl border border-slate-800/80 space-y-2 relative">
                      <button
                        onClick={() => handleRemoveEkskul(idx)}
                        className="absolute right-2 top-2 p-1 text-slate-500 hover:text-rose-400 rounded transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1 pr-6">
                        <input
                          type="text"
                          value={ek.nama}
                          onChange={(e) => handleEkskulChange(idx, 'nama', e.target.value)}
                          className="w-full bg-slate-900 border-b border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 pb-0.5"
                          placeholder="Nama Ekstrakurikuler"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <select
                            value={ek.predikat}
                            onChange={(e) => handleEkskulChange(idx, 'predikat', e.target.value)}
                            className="w-full bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] font-bold focus:outline-none"
                          >
                            <option value="Sangat Baik">Sangat Baik</option>
                            <option value="Baik">Baik</option>
                            <option value="Cukup">Cukup</option>
                            <option value="Kurang">Kurang</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={ek.keterangan}
                            onChange={(e) => handleEkskulChange(idx, 'keterangan', e.target.value)}
                            className="w-full bg-slate-900 text-slate-450 border border-slate-800 rounded-lg px-2 py-1 text-[10px] focus:outline-none"
                            placeholder="Keterangan Capaian"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {studentEkskuls.length === 0 && (
                    <p className="text-center py-4 text-[10px] text-slate-500 font-bold">Belum ada kegiatan ekstrakurikuler</p>
                  )}
                </div>
              </div>

              {/* Action Buttons Box */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleDownloadRaporPDF(student)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md transition"
                >
                  <Download className="w-4 h-4" /> Unduh Rapor Resmi (PDF)
                </button>
              </div>
            </div>

            {/* Right Column: Physical A4 Paper Preview */}
            <div className="lg:col-span-2 bg-[#10141A] rounded-2xl p-4 md:p-6 border border-slate-800 overflow-hidden flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Pratinjau Cetak Halaman Rapor</span>
              
              <div className="w-full bg-white text-slate-900 border border-slate-350 p-8 md:p-12 rounded-xl shadow-lg font-sans text-[11px] leading-relaxed select-none max-w-[700px] overflow-x-auto">
                {/* Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Laporan Hasil Belajar (Rapor)</h3>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-0.5">Kurikulum Merdeka</h4>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] mb-5">
                  <div className="space-y-0.5">
                    <div className="flex"><span className="w-28 font-bold">Nama Peserta Didik</span><span>: {student.name}</span></div>
                    <div className="flex"><span className="w-28 font-bold">NISN</span><span>: {student.nisn}</span></div>
                    <div className="flex"><span className="w-28 font-bold">Sekolah</span><span>: {classInfo?.schoolName || 'SD Negeri Cimandirasa'}</span></div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex"><span className="w-24 font-bold">Kelas</span><span>: {classInfo?.className || 'Kelas VI-A'}</span></div>
                    <div className="flex"><span className="w-24 font-bold">Semester</span><span>: {semesterSelection}</span></div>
                    <div className="flex"><span className="w-24 font-bold">Tahun Ajaran</span><span>: {classInfo?.academicYear || '2026/2027'}</span></div>
                  </div>
                </div>

                {/* Section A: Academic Grades */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-800">A. Nilai Akademik &amp; Capaian Kompetensi</h4>
                  
                  <table className="w-full text-left border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400">
                        <th className="border border-slate-400 py-1.5 px-2 text-center w-8 font-extrabold">No</th>
                        <th className="border border-slate-400 py-1.5 px-3 font-extrabold w-36">Mata Pelajaran</th>
                        <th className="border border-slate-400 py-1.5 px-2 text-center w-16 font-extrabold">Nilai Akhir</th>
                        <th className="border border-slate-400 py-1.5 px-3 font-extrabold">Deskripsi Capaian Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {SUBJECT_LIST.map((subject, idx) => {
                        const avg = getStudentSubjectAverage(student.id, subject);
                        const competencyDesc = getCapaianKompetensi(student.id, subject, avg);
                        return (
                          <tr key={subject}>
                            <td className="border border-slate-400 py-2 px-2 text-center font-bold text-slate-600">{idx + 1}</td>
                            <td className="border border-slate-400 py-2 px-3 font-bold text-slate-800">{subject}</td>
                            <td className="border border-slate-400 py-2 px-2 text-center font-mono font-extrabold text-xs text-indigo-900 bg-indigo-50/20">
                              {avg !== null ? avg : <span className="text-slate-400 italic font-semibold text-[10px]">-</span>}
                            </td>
                            <td className="border border-slate-400 py-2 px-3 text-[10px] leading-tight text-slate-700 font-medium">{competencyDesc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Section B: Extracurricular */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-800">B. Ekstrakurikuler</h4>
                  <table className="w-full text-left border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400">
                        <th className="border border-slate-400 py-1 px-2 text-center w-8 font-extrabold">No</th>
                        <th className="border border-slate-400 py-1 px-3 font-extrabold w-48">Kegiatan Ekstrakurikuler</th>
                        <th className="border border-slate-400 py-1 px-2 text-center w-24 font-extrabold">Predikat</th>
                        <th className="border border-slate-400 py-1 px-3 font-extrabold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentEkskuls.map((ek, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-400 py-1.5 px-2 text-center text-slate-600">{idx + 1}</td>
                          <td className="border border-slate-400 py-1.5 px-3 font-bold text-slate-800">{ek.nama}</td>
                          <td className="border border-slate-400 py-1.5 px-2 text-center font-bold text-emerald-700">{ek.predikat}</td>
                          <td className="border border-slate-400 py-1.5 px-3 text-[10px] leading-tight text-slate-600">{ek.keterangan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section C & D: Attendance & Wali Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Attendance Box */}
                  <div className="border border-slate-400 rounded-lg p-3 space-y-2">
                    <h5 className="font-extrabold border-b border-slate-300 pb-1 text-slate-800">C. Ketidakhadiran</h5>
                    <div className="text-[10px] space-y-1.5">
                      <div className="flex justify-between"><span>1. Sakit</span><span className="font-bold">{sCount} Hari</span></div>
                      <div className="flex justify-between"><span>2. Izin</span><span className="font-bold">{iCount} Hari</span></div>
                      <div className="flex justify-between"><span>3. Tanpa Keterangan (Alpa)</span><span className="font-bold">{aCount} Hari</span></div>
                    </div>
                  </div>

                  {/* Wali Note Box */}
                  <div className="border border-slate-400 rounded-lg p-3 space-y-1.5">
                    <h5 className="font-extrabold border-b border-slate-300 pb-1 text-slate-800">D. Catatan Wali Kelas</h5>
                    <p className="text-[10px] text-slate-600 italic leading-relaxed font-medium">
                      "{activeWaliNote}"
                    </p>
                  </div>
                </div>

                {/* Signature Line Section */}
                <div className="grid grid-cols-3 gap-4 text-center text-[9px] font-medium pt-4">
                  <div className="space-y-12">
                    <div>
                      <span>Mengetahui,</span><br />
                      <span>Orang Tua / Wali Siswa</span>
                    </div>
                    <div className="font-bold border-b border-slate-400 w-32 mx-auto"></div>
                  </div>
                  <div className="space-y-12">
                    <div>
                      <span>Kepala Sekolah</span><br />
                      <span>SD Negeri Cimandirasa</span>
                    </div>
                    <div>
                      <span className="font-bold">Haji Mulyono, M.Pd.</span><br />
                      <span>NIP. 196805121991031005</span>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <div>
                      <span>Sukabumi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span><br />
                      <span>Wali Kelas</span>
                    </div>
                    <div>
                      <span className="font-bold">
                        {localStorage.getItem('school_current_user') 
                          ? JSON.parse(localStorage.getItem('school_current_user')!).name 
                          : "Guru Kelas"}
                      </span><br />
                      <span>NIP. -</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Column Modal */}
      {isNewColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-850">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tambah Kolom Penilaian Baru</h3>
              <button 
                onClick={() => setIsNewColModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="p-5 space-y-4">
              {colError && (
                <div className="p-3 bg-rose-500/10 text-rose-455 text-xs rounded-xl flex items-center gap-2 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{colError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Mata Pelajaran</label>
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-indigo-400 font-extrabold">
                  {selectedSubject}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Judul / Nama Penilaian <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tugas 1, Ulangan Harian 1, PTS, PAS"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Jenis Asesmen (Kurikulum Merdeka)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewColType('formatif')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                      newColType === 'formatif'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Formatif (Proses)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewColType('sumatif')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                      newColType === 'sumatif'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-sm'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Sumatif (Akhir)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  required
                  value={newColDate}
                  onChange={(e) => setNewColDate(e.target.value)}
                  className="w-full bg-slate-900/40 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewColModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Buat Kolom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface XProps {
  className?: string;
  onClick?: () => void;
}

function X({ className, onClick }: XProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      onClick={onClick}
    >
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

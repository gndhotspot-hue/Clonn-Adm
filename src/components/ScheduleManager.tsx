import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  User, 
  BookOpen, 
  Calendar, 
  X, 
  AlertCircle, 
  Printer, 
  LayoutGrid
} from 'lucide-react';
import { ScheduleItem } from '../types';

interface ScheduleManagerProps {
  schedules: ScheduleItem[];
  onAddSchedule: (item: ScheduleItem) => void;
  onUpdateSchedule: (item: ScheduleItem) => void;
  onDeleteSchedule: (id: string) => void;
}

const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

const POPULAR_SUBJECTS = [
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

export default function ScheduleManager({
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule
}: ScheduleManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | typeof DAYS_OF_WEEK[number]>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formError, setFormError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    day: 'Senin' as typeof DAYS_OF_WEEK[number],
    subject: '',
    startTime: '07:30',
    endTime: '09:00',
    teacher: ''
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      day: activeTab === 'all' ? 'Senin' : activeTab,
      subject: '',
      startTime: '07:30',
      endTime: '09:00',
      teacher: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      subject: item.subject,
      startTime: item.startTime,
      endTime: item.endTime,
      teacher: item.teacher
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { subject, startTime, endTime, teacher, day } = formData;

    if (!subject.trim()) {
      setFormError('Nama mata pelajaran wajib diisi.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Jam mulai dan jam selesai wajib diisi.');
      return;
    }
    if (startTime >= endTime) {
      setFormError('Jam mulai harus lebih awal dari jam selesai.');
      return;
    }
    if (!teacher.trim()) {
      setFormError('Nama guru pengampu wajib diisi.');
      return;
    }

    if (editingItem) {
      onUpdateSchedule({
        ...editingItem,
        day,
        subject: subject.trim(),
        startTime,
        endTime,
        teacher: teacher.trim()
      });
    } else {
      onAddSchedule({
        id: 'sch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        day,
        subject: subject.trim(),
        startTime,
        endTime,
        teacher: teacher.trim()
      });
    }

    setIsModalOpen(false);
  };

  const handlePrintSchedule = () => {
    const printContent = document.getElementById('print-area-schedule');
    if (!printContent) return;

    const originalHTML = document.body.innerHTML;
    const printHTML = printContent.innerHTML;

    // Open clean print output
    document.body.innerHTML = `
      <html>
        <head>
          <title>Jadwal Pelajaran Kelas</title>
          <style>
            body { font-family: sans-serif; color: #111; padding: 30px; background: white; }
            h1, h2 { text-align: center; margin-bottom: 5px; }
            h3 { text-align: center; color: #555; font-weight: normal; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .day-header { background-color: #eaeaea; font-weight: bold; font-size: 14px; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #888; }
          </style>
        </head>
        <body>
          <h2>Jadwal Pelajaran Mingguan Kelas</h2>
          <h3>SD Negeri Nusantara Merdeka</h3>
          ${printHTML}
          <div class="footer">Dicetak otomatis dari Sistem Administrasi Kelas pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </body>
      </html>
    `;

    window.print();
    // Restore page
    document.body.innerHTML = originalHTML;
    window.location.reload(); // Quick refresh to re-init React state neatly
  };

  // Group schedules by day
  const getSchedulesForDay = (day: typeof DAYS_OF_WEEK[number]) => {
    return schedules
      .filter(s => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-6" id="schedule-manager">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Jadwal Pelajaran Kelas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Atur dan pantau jadwal pelajaran harian dan mingguan serta guru pengampu mata pelajaran</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintSchedule}
            disabled={schedules.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" /> Cetak Jadwal
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 bg-[#161B22] p-3 rounded-2xl border border-slate-800/80 shadow-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'all' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Mingguan (Semua)
        </button>

        {DAYS_OF_WEEK.map((day) => {
          const count = schedules.filter(s => s.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveTab(day)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === day 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {day} <span className="text-[10px] opacity-70 ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Schedule display area */}
      {activeTab === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            return (
              <div key={day} className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden flex flex-col hover:border-slate-700 transition duration-200">
                <div className="p-4 bg-[#10141A] border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                    <h3 className="text-sm font-bold text-white">{day}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold rounded-full text-[10px]">
                    {daySchedules.length} Sesi
                  </span>
                </div>

                <div className="p-4 flex-1 space-y-3">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/60 rounded-xl transition group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-white leading-snug">{item.subject}</h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition"
                                title="Edit Jadwal"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus jadwal ${item.subject} di hari ${item.day}?`)) {
                                    onDeleteSchedule(item.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-450 rounded-md hover:bg-slate-800 transition"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{item.startTime} - {item.endTime} WIB</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate">Guru: {item.teacher}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                      <BookOpen className="w-6 h-6 text-slate-600 mb-2" />
                      <p className="text-xs font-semibold text-slate-500">Tidak ada pelajaran</p>
                      <p className="text-[10px] text-slate-500">Hari tenang atau bebas KBM</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Daily View */
        <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
          <div className="p-5 bg-[#10141A] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-sm font-bold text-white">Jadwal Pelajaran Hari {activeTab}</h3>
            </div>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold rounded-full text-xs">
              {getSchedulesForDay(activeTab).length} Sesi Terjadwal
            </span>
          </div>

          <div className="p-6">
            {getSchedulesForDay(activeTab).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-4">Waktu</th>
                      <th className="pb-3 px-4">Mata Pelajaran</th>
                      <th className="pb-3 px-4">Guru Pengampu</th>
                      <th className="pb-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {getSchedulesForDay(activeTab).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-4 px-4 font-bold text-indigo-400 font-mono">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 shrink-0" /> {item.startTime} - {item.endTime} WIB
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-white text-sm">
                          {item.subject}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" /> {item.teacher}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus jadwal ${item.subject} di hari ${item.day}?`)) {
                                  onDeleteSchedule(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-slate-800 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">Tidak ada jadwal di hari {activeTab}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Belum ada pelajaran yang ditambahkan untuk hari ini. Silakan tambahkan jadwal sesi pelajaran menggunakan tombol "Tambah Jadwal".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden layout for Print rendering */}
      <div id="print-area-schedule" className="hidden">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          if (daySchedules.length === 0) return null;
          return (
            <div key={day} style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '2px solid #333', paddingBottom: '4px', marginBottom: '8px' }}>
                Hari {day}
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Waktu</th>
                    <th>Mata Pelajaran</th>
                    <th>Guru Pengampu</th>
                  </tr>
                </thead>
                <tbody>
                  {daySchedules.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.startTime} - {item.endTime} WIB</td>
                      <td style={{ fontWeight: 'bold' }}>{item.subject}</td>
                      <td>{item.teacher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Schedule Form Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-850">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Edit Sesi Pelajaran' : 'Tambah Jadwal Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 text-rose-450 text-xs rounded-xl flex items-center gap-2 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Day */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Hari <span className="text-rose-500">*</span></label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value as typeof DAYS_OF_WEEK[number] })}
                  className="w-full bg-[#10141A] text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Mata Pelajaran <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Matematika, Bahasa Indonesia"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    list="subjects-datalist"
                  />
                  <datalist id="subjects-datalist">
                    {POPULAR_SUBJECTS.map(sub => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Waktu Mulai <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-900/40 text-white border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Waktu Selesai <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-900/40 text-white border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Teacher */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Nama Guru Pengampu <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. Bambang Supriadi"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Actions */}
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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

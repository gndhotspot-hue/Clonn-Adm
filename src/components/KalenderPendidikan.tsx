import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Tag, 
  Clock, 
  MapPin, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'libur' | 'kegiatan' | 'ujian' | 'rapat';
  description?: string;
}

interface KalenderPendidikanProps {
  isAdmin: boolean;
}

const DEFAULT_EVENTS: CalendarEvent[] = [
  { id: 'ev_1', title: 'Hari Pertama Masuk Sekolah (HPMS) & MPLS', date: '2026-07-13', type: 'kegiatan', description: 'Masa Pengenalan Lingkungan Sekolah bagi siswa baru' },
  { id: 'ev_2', title: 'HUT Kemerdekaan RI ke-81', date: '2026-08-17', type: 'libur', description: 'Upacara bendera & Libur Nasional' },
  { id: 'ev_3', title: 'Penilaian Tengah Semester (PTS) Ganjil', date: '2026-09-14', type: 'ujian', description: 'Penilaian Tengah Semester Ganjil TA 2026/2027' },
  { id: 'ev_4', title: 'Maulid Nabi Muhammad SAW', date: '2026-09-28', type: 'libur', description: 'Libur Nasional Keagamaan' },
  { id: 'ev_5', title: 'Rapat Koordinasi Wali Murid & Komite Sekolah', date: '2026-10-10', type: 'rapat', description: 'Pembahasan program sekolah semester ganjil' },
  { id: 'ev_6', title: 'Penilaian Akhir Semester (PAS) Ganjil', date: '2026-12-14', type: 'ujian', description: 'Penilaian Akhir Semester Ganjil' },
  { id: 'ev_7', title: 'Pembagian Rapor Semester Ganjil', date: '2026-12-18', type: 'kegiatan', description: 'Pengambilan rapor oleh orang tua/wali murid' },
  { id: 'ev_8', title: 'Hari Raya Natal & Libur Cuti Bersama', date: '2026-12-25', type: 'libur', description: 'Libur Nasional Natal' },
  { id: 'ev_9', title: 'Hari Pertama Masuk Sekolah Semester Genap', date: '2027-01-11', type: 'kegiatan', description: 'Awal KBM Semester Genap TA 2026/2027' },
  { id: 'ev_10', title: 'Isra Mi\'raj Nabi Muhammad SAW', date: '2027-02-08', type: 'libur', description: 'Libur Nasional Keagamaan' },
  { id: 'ev_11', title: 'Penilaian Tengah Semester (PTS) Genap', date: '2027-03-15', type: 'ujian', description: 'Penilaian Tengah Semester Genap' },
  { id: 'ev_12', title: 'Libur Sekitar Idul Fitri 1448 H', date: '2027-04-05', type: 'libur', description: 'Libur keagamaan Idul Fitri' },
  { id: 'ev_13', title: 'Penilaian Akhir Tahun (PAT) / Asesmen Akhir', date: '2027-05-24', type: 'ujian', description: 'Ujian Akhir Tahun Kenaikan Kelas' },
  { id: 'ev_14', title: 'Pembagian Rapor Semester Genap & Kenaikan Kelas', date: '2027-06-18', type: 'kegiatan', description: 'Pembagian rapor kenaikan kelas' },
];

export default function KalenderPendidikan({ isAdmin }: KalenderPendidikanProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('school_calendar_events');
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });

  // Calendar dates states
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Start at July 2026
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    type: 'kegiatan' as 'libur' | 'kegiatan' | 'ujian' | 'rapat',
    description: ''
  });

  const monthsID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Generate calendar days for current display month
  const getDaysInMonth = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust Sunday from 0 to 6 (so Monday is first day)
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const calendarCells: { dateString: string; dayNum: number; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateString = prevDate.toISOString().split('T')[0];
      calendarCells.push({
        dateString,
        dayNum,
        isCurrentMonth: false,
        events: events.filter(e => e.date === dateString)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const currentMonthDate = new Date(currentYear, currentMonth, i + 1); // add 1 to safe format timezone offsets
      const dateString = currentMonthDate.toISOString().split('T')[0];
      calendarCells.push({
        dateString,
        dayNum: i,
        isCurrentMonth: true,
        events: events.filter(e => e.date === dateString)
      });
    }

    // Next month padding to fill grid (usually 42 cells)
    const totalCells = 42;
    const nextPadding = totalCells - calendarCells.length;
    for (let i = 1; i <= nextPadding; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateString = nextDate.toISOString().split('T')[0];
      calendarCells.push({
        dateString,
        dayNum: i,
        isCurrentMonth: false,
        events: events.filter(e => e.date === dateString)
      });
    }

    return calendarCells;
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    const eventToAdd: CalendarEvent = {
      id: 'ev_' + Date.now(),
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type,
      description: newEvent.description
    };

    const updatedEvents = [...events, eventToAdd].sort((a, b) => a.date.localeCompare(b.date));
    setEvents(updatedEvents);
    localStorage.setItem('school_calendar_events', JSON.stringify(updatedEvents));
    setIsModalOpen(false);
    setNewEvent({ title: '', date: '', type: 'kegiatan', description: '' });
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kegiatan kalender ini?')) {
      const updatedEvents = events.filter(e => e.id !== id);
      setEvents(updatedEvents);
      localStorage.setItem('school_calendar_events', JSON.stringify(updatedEvents));
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'libur':
        return { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' };
      case 'ujian':
        return { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' };
      case 'rapat':
        return { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dot: 'bg-sky-500' };
      default:
        return { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' };
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 animate-fade-in" id="kalender-pendidikan-container">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161B22] p-6 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">Kalender Pendidikan</h1>
            <p className="text-xs text-slate-400">Kalender Kegiatan Belajar Mengajar, Ujian, Libur Nasional, dan Agenda Akademik SDN Cimandirasa</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center gap-1.5 align-self-start md:align-self-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Agenda Kalender
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Monthly Grid */}
        <div className="lg:col-span-2 bg-[#161B22] border border-slate-800 rounded-2xl p-6 space-y-4">
          
          {/* Header Month Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              {monthsID[currentMonth]} {currentYear}
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={prevMonth}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div>Sab</div>
            <div className="text-rose-400">Min</div>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((cell, idx) => {
              const isSunday = idx % 7 === 6;
              const hasEvents = cell.events.length > 0;
              return (
                <div
                  key={idx}
                  className={`min-h-[70px] p-1.5 border rounded-lg flex flex-col justify-between transition ${
                    cell.isCurrentMonth
                      ? 'bg-slate-900 border-slate-800 text-slate-200'
                      : 'bg-slate-950/40 border-transparent text-slate-600'
                  } ${isSunday ? 'bg-rose-950/10 border-rose-950/20' : ''}`}
                >
                  <span className={`text-[11px] font-bold ${
                    cell.isCurrentMonth 
                      ? isSunday ? 'text-rose-400' : 'text-slate-200'
                      : 'text-slate-600'
                  }`}>
                    {cell.dayNum}
                  </span>

                  {/* Render dot indicators */}
                  <div className="space-y-1">
                    {cell.events.map(ev => {
                      const colors = getTypeStyle(ev.type);
                      return (
                        <div
                          key={ev.id}
                          className="text-[8px] font-bold leading-tight px-1 py-0.5 rounded border overflow-hidden truncate whitespace-nowrap block"
                          style={{
                            backgroundColor: ev.type === 'libur' ? 'rgba(239, 68, 68, 0.1)' : ev.type === 'ujian' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: ev.type === 'libur' ? '#f87171' : ev.type === 'ujian' ? '#fbbf24' : '#34d399',
                            borderColor: ev.type === 'libur' ? 'rgba(239, 68, 68, 0.2)' : ev.type === 'ujian' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                          }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Event list */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-sm font-extrabold text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            Agenda &amp; Kegiatan Akademik
          </h2>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[420px] pr-2">
            {sortedEvents.map(ev => {
              const styles = getTypeStyle(ev.type);
              const eventDate = new Date(ev.date);
              const formattedDate = eventDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              return (
                <div key={ev.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl relative group hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-md ${styles.badge}`}>
                      {ev.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formattedDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white pr-6">{ev.title}</h4>
                  {ev.description && (
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{ev.description}</p>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="absolute top-4 right-4 p-1.5 bg-slate-800/80 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200"
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Info className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">Belum ada agenda akademik terdaftar.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Add Event */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900/30 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                Tambah Kegiatan Akademik
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Judul Kegiatan / Libur</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Contoh: Rapat Wali Murid, Libur Semester"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="kegiatan">Kegiatan / MPLS</option>
                    <option value="libur">Libur Nasional</option>
                    <option value="ujian">Ujian / PTS / PAS</option>
                    <option value="rapat">Rapat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi Tambahan</label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Opsional: Keterangan waktu, peserta, dsb."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-lg transition shadow-md"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

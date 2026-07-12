import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  BookOpen, 
  Megaphone, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import { AgendaItem } from '../types';

interface AgendaManagerProps {
  agendas: AgendaItem[];
  onAddAgenda: (item: AgendaItem) => void;
  onDeleteAgenda: (id: string) => void;
}

export default function AgendaManager({
  agendas,
  onAddAgenda,
  onDeleteAgenda,
}: AgendaManagerProps) {
  const [filterType, setFilterType] = useState<'all' | 'tugas' | 'pengumuman' | 'kegiatan'>('all');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'tugas' as 'tugas' | 'pengumuman' | 'kegiatan',
    dueDate: '',
  });
  const [formError, setFormError] = useState('');

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Judul agenda harus diisi');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Isi atau deskripsi agenda harus diisi');
      return;
    }
    if (formData.type === 'tugas' && !formData.dueDate) {
      setFormError('Tanggal tenggat waktu pengumpulan (due date) wajib diisi untuk jenis tugas');
      return;
    }

    const payload: AgendaItem = {
      id: 'agenda_' + Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      dueDate: formData.type === 'tugas' ? formData.dueDate : undefined,
    };

    onAddAgenda(payload);
    setIsModalOpen(false);
    // Reset Form
    setFormData({
      title: '',
      content: '',
      type: 'tugas',
      dueDate: '',
    });
    setFormError('');
  };

  const filteredAgendas = agendas.filter(item => {
    return filterType === 'all' || item.type === filterType;
  }).sort((a, b) => b.date.localeCompare(a.date)); // Date descending

  // Check if a task is overdue
  const isOverdue = (dueDateStr?: string) => {
    if (!dueDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    return dueDate < today;
  };

  return (
    <div className="space-y-6" id="agenda-manager">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white">Agenda, Tugas &amp; Pengumuman</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola penugasan Pekerjaan Rumah (PR), pengumuman sekolah, serta agenda piknik harian</p>
        </div>
        
        <button
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start"
          id="add-agenda-btn"
        >
          <Plus className="w-4 h-4" /> Buat Agenda Baru
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-2 bg-[#161B22] p-3 rounded-2xl border border-slate-800/80 shadow-sm">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Semua ({agendas.length})
        </button>
        <button
          onClick={() => setFilterType('tugas')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === 'tugas' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Tugas / PR ({agendas.filter(a => a.type === 'tugas').length})
        </button>
        <button
          onClick={() => setFilterType('pengumuman')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === 'pengumuman' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" /> Pengumuman ({agendas.filter(a => a.type === 'pengumuman').length})
        </button>
        <button
          onClick={() => setFilterType('kegiatan')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterType === 'kegiatan' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Kegiatan Kelas ({agendas.filter(a => a.type === 'kegiatan').length})
        </button>
      </div>

      {/* Agenda Card Grid */}
      {filteredAgendas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgendas.map(item => {
            const overdue = isOverdue(item.dueDate);
            return (
              <div 
                key={item.id} 
                className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-700/80 hover:shadow-md transition relative group"
              >
                {/* Visual Category Stripe */}
                <div className={`h-1.5 w-full ${
                  item.type === 'tugas' ? 'bg-rose-500' :
                  item.type === 'pengumuman' ? 'bg-amber-500' : 'bg-indigo-500'
                }`} />

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Badge and Delete trigger */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        item.type === 'tugas' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        item.type === 'pengumuman' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {item.type}
                      </span>
                      
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus agenda ini?`)) {
                            onDeleteAgenda(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-450 hover:bg-slate-800 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-extrabold text-white leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-350 mt-2 whitespace-pre-line leading-relaxed">{item.content}</p>
                  </div>

                  {/* Metadata bottom row */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Diunggah: {item.date}
                    </span>
                    
                    {item.dueDate && (
                      <div className="flex items-center gap-1">
                        {overdue ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded font-bold border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" /> Lewat: {item.dueDate}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-bold border border-emerald-500/20">
                            Tenggat: {item.dueDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Tidak ada agenda atau tugas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Gunakan tombol "Buat Agenda Baru" untuk menambahkan pengumuman kelas atau tugas PR harian untuk para siswa.
          </p>
        </div>
      )}

      {/* Modal Popup creation form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-850">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Buat Agenda / Tugas Baru</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 text-rose-455 text-xs rounded-xl flex items-center gap-2 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Category Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Kategori Agenda <span className="text-rose-500">*</span></label>
                <div className="flex bg-[#10141A] p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'tugas' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      formData.type === 'tugas' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tugas / PR
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'pengumuman' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      formData.type === 'pengumuman' 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/35 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pengumuman
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'kegiatan' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      formData.type === 'kegiatan' 
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kegiatan
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Judul Agenda / Nama Tugas <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tugas PR Matematika Halaman 45"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Content / Deskripsi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Deskripsi / Detail Keterangan <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan detail instruksi tugas atau pesan pengumuman kelas di sini..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
                />
              </div>

              {/* Due Date (Optional or required for tugas) */}
              {formData.type === 'tugas' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Tenggat Waktu Pengumpulan (Due Date) <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-900/40 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
                  />
                </div>
              )}

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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  id="save-agenda-submit-btn"
                >
                  Buat Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

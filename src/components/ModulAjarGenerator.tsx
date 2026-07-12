import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Download, 
  Printer, 
  Check, 
  Edit3, 
  Eye, 
  ArrowRight,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface ModulAjarGeneratorProps {
  currentTeacherClass?: string;
}

export default function ModulAjarGenerator({ currentTeacherClass }: ModulAjarGeneratorProps) {
  // Config state
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Form input states
  const [formData, setFormData] = useState({
    subject: '',
    grade: currentTeacherClass || 'Kelas 6A',
    topic: '',
    duration: '2 JP x 35 Menit',
    targetAudience: 'Reguler / Umum',
    teachingModel: 'Problem Based Learning (PBL)'
  });

  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedResult, setGeneratedResult] = useState('');
  const [editedResult, setEditedResult] = useState('');
  const [editMode, setEditMode] = useState(true); // default true so they can edit directly
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto load configurations from Admin settings
  useEffect(() => {
    // 1. Subjects
    const savedSubjects = localStorage.getItem('school_subjects_registry');
    if (savedSubjects) {
      const parsed = JSON.parse(savedSubjects);
      setSubjects(parsed);
      if (parsed.length > 0) {
        setFormData(prev => ({ ...prev, subject: parsed[0] }));
      }
    } else {
      const defaultSubjects = [
        'Matematika',
        'Ilmu Pengetahuan Alam (IPA)',
        'Ilmu Pengetahuan Sosial (IPS)',
        'Bahasa Indonesia',
        'Bahasa Inggris',
        'Pendidikan Pancasila (PPKn)'
      ];
      setSubjects(defaultSubjects);
      setFormData(prev => ({ ...prev, subject: defaultSubjects[0] }));
    }

    // 2. Classes
    const savedClasses = localStorage.getItem('school_classes_registry');
    if (savedClasses) {
      setClasses(JSON.parse(savedClasses));
    } else {
      setClasses(['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6A', 'Kelas 6B']);
    }
  }, []);

  // Loading steps animation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      timer = setInterval(() => {
        setGenerationStep(prev => (prev + 1) % 4);
      }, 3500);
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const LOADING_MESSAGES = [
    'Menganalisis Kompetensi Dasar & CP Kurikulum Merdeka...',
    'Menyusun Rencana Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)...',
    'Merancang Pertanyaan Pemantik & Asesmen Diagnostik...',
    'Membuat Lembar Kerja Peserta Didik (LKPD) & Rubrik Penilaian...'
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.topic.trim()) {
      setErrorMsg('Harap lengkapi mata pelajaran dan topik bahasan!');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setGeneratedResult('');
    setEditedResult('');

    try {
      const response = await fetch('/api/generate-modul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal menghasilkan modul ajar otomatis.');
      }

      setGeneratedResult(data.result);
      setEditedResult(data.result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Koneksi ke server AI terganggu. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([editedResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modul_Ajar_${formData.subject.replace(/\s+/g, '_')}_${formData.grade.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Modul Ajar Kurikulum Merdeka</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 24px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { font-size: 18px; border-bottom: 1px solid #666; padding-bottom: 5px; margin-top: 25px; }
            h3 { font-size: 14px; margin-top: 15px; }
            p, li { font-size: 12px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 11px; white-space: pre-wrap; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 11px; text-align: left; }
            th { background: #f2f2f2; font-weight: bold; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;">MODUL AJAR KURIKULUM MERDEKA</h1>
          <div style="white-space: pre-line;">${editedResult}</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="modul-ajar-generator-container">
      {/* Banner */}
      <div className="flex items-center gap-3 bg-[#161B22] p-6 border border-slate-800 rounded-2xl">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-white">AI Generator Modul Ajar</h1>
          <p className="text-xs text-slate-400">Hasilkan draf Modul Ajar Kurikulum Merdeka secara otomatis berbasis kecerdasan buatan, siap disesuaikan oleh guru</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters panel */}
        <div className="lg:col-span-4 bg-[#161B22] border border-slate-800 rounded-2xl p-6 h-fit space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-800">Parameter Modul Ajar</h2>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Mata Pelajaran</label>
              <select
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Kelas / Grade</label>
              <select
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Materi / Topik Pembelajaran</label>
              <input
                type="text"
                value={formData.topic}
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Contoh: Energi Alternatif, Pecahan Senilai"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Alokasi Waktu</label>
              <input
                type="text"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Contoh: 2 JP x 35 Menit"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Target Peserta Didik</label>
              <select
                value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Reguler / Umum">Reguler / Umum</option>
                <option value="Lambat Belajar (Slow Learner)">Lambat Belajar (Slow Learner)</option>
                <option value="Berpencapaian Tinggi / Cerdas Istimewa">Berpencapaian Tinggi</option>
                <option value="Inklusi">Inklusi (Kebutuhan Khusus)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Model Pembelajaran</label>
              <select
                value={formData.teachingModel}
                onChange={e => setFormData({ ...formData, teachingModel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                <option value="Discovery / Inquiry Learning">Discovery / Inquiry Learning</option>
                <option value="Ceramah Interaktif & Demonstrasi">Ceramah Interaktif</option>
                <option value="Cooperative Learning">Cooperative Learning</option>
              </select>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className={`w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {isGenerating ? 'Menghasilkan Modul...' : 'Buat Modul Ajar otomatis'}
            </button>
          </form>
        </div>

        {/* Output Workspace panel */}
        <div className="lg:col-span-8 bg-[#161B22] border border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Header Controls */}
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Workspace Editor Modul Ajar
            </h2>

            {editedResult && !isGenerating && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    editMode 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                      : 'bg-slate-800/80 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {editMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  {editMode ? 'Pratinjau' : 'Sunting / Edit'}
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-850 border border-transparent hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  title="Salin ke Clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-850 border border-transparent hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  title="Unduh file Markdown (.md)"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh .MD
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-850 border border-transparent hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  title="Cetak Rapi"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak
                </button>
              </div>
            )}
          </div>

          {/* Editor/View/Intro area */}
          <div className="p-6 flex-1 flex flex-col justify-center">
            
            {/* 1. INTRO / WELCOME (NO MODULE YET) */}
            {!editedResult && !isGenerating && (
              <div className="text-center max-w-md mx-auto py-12 space-y-4">
                <div className="w-16 h-16 bg-indigo-500/5 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/10 mx-auto">
                  <Sparkles className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-white">Siap membuat Modul Ajar otomatis?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sistem asisten AI akan menyusun modul ajar lengkap Kurikulum Merdeka yang mencakup tujuan, profil Pancasila, langkah KBM, asesmen, hingga lampiran LKPD khusus sesuai materi pilihan Anda.
                  </p>
                </div>
                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    Bisa diedit dan diunduh langsung setelah jadi.
                  </div>
                </div>
              </div>
            )}

            {/* 2. LOADING STATE */}
            {isGenerating && (
              <div className="text-center max-w-md mx-auto py-12 space-y-6">
                <div className="relative w-16 h-16 mx-auto">
                  {/* Rotating radial loading */}
                  <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                </div>
                <div className="space-y-2 animate-pulse">
                  <h3 className="text-sm font-extrabold text-indigo-400">Sedang Merancang Modul Ajar...</h3>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
                    {LOADING_MESSAGES[generationStep]}
                  </p>
                </div>
              </div>
            )}

            {/* 3. GENERATED RESULT VIEW / EDITOR */}
            {editedResult && !isGenerating && (
              <div className="flex-1 flex flex-col h-full">
                {editMode ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span>Ketik/Ubah isi teks di bawah langsung untuk menyesuaikan modul</span>
                      <span className="text-indigo-400">Mode Sunting Aktif</span>
                    </div>
                    <textarea
                      value={editedResult}
                      onChange={e => setEditedResult(e.target.value)}
                      className="w-full flex-1 min-h-[450px] bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                    />
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 overflow-y-auto max-h-[500px] text-xs leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
                    {/* Simplified markdown preview */}
                    {editedResult}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Check, 
  Users, 
  BarChart2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  History,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  QrCode,
  Camera,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Student, AttendanceDay, AttendanceStatus } from '../types';
import { Html5Qrcode } from 'html5-qrcode';

interface AttendanceManagerProps {
  students: Student[];
  attendance: AttendanceDay[];
  onSaveAttendance: (date: string, records: { [studentId: string]: AttendanceStatus }) => void;
}

export default function AttendanceManager({
  students,
  attendance,
  onSaveAttendance,
}: AttendanceManagerProps) {
  const activeStudents = students.filter(s => s.status === 'aktif');

  // Today in local YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [activeSubTab, setActiveSubTab] = useState<'harian' | 'laporan'>('harian');

  // Find or initialize records for selectedDate
  const currentDayRecord = attendance.find(a => a.date === selectedDate);
  
  // Local state for the selected date's working records
  const [workingRecords, setWorkingRecords] = useState<{ [studentId: string]: AttendanceStatus }>(() => {
    const records: { [studentId: string]: AttendanceStatus } = {};
    activeStudents.forEach(s => {
      records[s.id] = 'H'; // Default to Hadir
    });
    if (currentDayRecord) {
      Object.assign(records, currentDayRecord.records);
    }
    return records;
  });

  // QR Code Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedLogs, setScannedLogs] = useState<{ id: string; name: string; time: string; status: string }[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Auto clean up scanning on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(err => console.error("Scanner cleanup failed", err));
      }
    };
  }, []);

  const handleQrCodeScanned = (studentId: string) => {
    const student = activeStudents.find(s => s.id === studentId);
    if (student) {
      // Mark student as "Hadir" (H)
      setWorkingRecords(prev => {
        const updated = { ...prev, [student.id]: 'H' as AttendanceStatus };
        onSaveAttendance(selectedDate, updated);
        return updated;
      });

      // Play programmatic confirmation audio chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // high A
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.12);
      } catch (e) {
        // Browser block fallback
      }

      // Add to scanned logs with duplicate debounce
      setScannedLogs(prev => {
        const lastLog = prev[0];
        if (lastLog && lastLog.id === student.id) {
          return prev;
        }
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setSuccessMessage(`Berhasil: ${student.name} hadir!`);
        setTimeout(() => setSuccessMessage(null), 3500);
        
        return [{
          id: student.id,
          name: student.name,
          time: timeStr,
          status: 'Hadir'
        }, ...prev];
      });
    } else {
      setScanError("QR Code tidak cocok dengan siswa aktif kelas ini.");
      setTimeout(() => setScanError(null), 4000);
    }
  };

  const startScanning = async () => {
    setScanError(null);
    setSuccessMessage(null);
    setIsScanning(true);
    
    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode("qr-scanner-element");
        qrScannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            handleQrCodeScanned(decodedText);
          },
          () => {
            // Quiet scan
          }
        );
      } catch (err: any) {
        console.error("Camera access failed", err);
        setScanError("Gagal mengakses kamera. Mohon izinkan akses kamera pada peramban Anda.");
        setIsScanning(false);
      }
    }, 400);
  };

  const stopScanning = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    qrScannerRef.current = null;
    setIsScanning(false);
  };

  // Sync working records when selected date changes or underlying data updates
  useEffect(() => {
    const records: { [studentId: string]: AttendanceStatus } = {};
    activeStudents.forEach(s => {
      records[s.id] = 'H';
    });
    
    const dayRecord = attendance.find(a => a.date === selectedDate);
    if (dayRecord) {
      Object.assign(records, dayRecord.records);
    }
    
    setWorkingRecords(records);
  }, [selectedDate, attendance, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const updated = { ...workingRecords, [studentId]: status };
    setWorkingRecords(updated);
    onSaveAttendance(selectedDate, updated);
  };

  const handleMarkAllPresent = () => {
    const updated: { [studentId: string]: AttendanceStatus } = {};
    activeStudents.forEach(s => {
      updated[s.id] = 'H';
    });
    setWorkingRecords(updated);
    onSaveAttendance(selectedDate, updated);
  };

  // Stats for the active day
  const totalActive = activeStudents.length;
  const statsToday = () => {
    const vals = activeStudents.map(s => workingRecords[s.id] || 'H');
    const H = vals.filter(v => v === 'H').length;
    const S = vals.filter(v => v === 'S').length;
    const I = vals.filter(v => v === 'I').length;
    const A = vals.filter(v => v === 'A').length;
    const percentHadir = totalActive > 0 ? Math.round((H / totalActive) * 100) : 0;
    return { H, S, I, A, percentHadir };
  };

  const dayStats = statsToday();

  // Historical calculations for laporan
  const getHistoricalStats = () => {
    const summary: {
      [studentId: string]: {
        name: string;
        H: number;
        S: number;
        I: number;
        A: number;
        total: number;
        rate: number;
      };
    } = {};

    activeStudents.forEach(s => {
      summary[s.id] = { name: s.name, H: 0, S: 0, I: 0, A: 0, total: 0, rate: 0 };
    });

    attendance.forEach(day => {
      Object.entries(day.records).forEach(([studentId, status]) => {
        if (summary[studentId]) {
          summary[studentId][status]++;
          summary[studentId].total++;
        }
      });
    });

    return Object.entries(summary).map(([id, s]) => {
      const rate = s.total > 0 ? Math.round((s.H / s.total) * 100) : 100;
      return { id, ...s, rate };
    });
  };

  const studentStats = getHistoricalStats().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6" id="attendance-manager">
      {/* Tab Switcher and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white">Presensi &amp; Absensi Kelas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Catat kehadiran murid setiap hari serta pantau rekap statistik bulanan</p>
        </div>

        <div className="inline-flex rounded-xl bg-[#10141A] border border-slate-800 p-1 self-start">
          <button
            onClick={() => setActiveSubTab('harian')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'harian' ? 'bg-indigo-500/20 text-indigo-450 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Absensi Harian
          </button>
          <button
            onClick={() => setActiveSubTab('laporan')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'laporan' ? 'bg-indigo-500/20 text-indigo-450 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Rekap &amp; Laporan
          </button>
        </div>
      </div>

      {activeSubTab === 'harian' ? (
        <div className="space-y-6">
          {/* QR Scanner live viewport panel */}
          {isScanning && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Left col: camera feed (span 2) */}
              <div className="md:col-span-2 bg-[#161B22] rounded-2xl border border-slate-800 p-5 flex flex-col space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-xs font-bold text-slate-250 uppercase tracking-wider">Kamera Pindai QR Aktif</h3>
                  </div>
                  <button
                    onClick={stopScanning}
                    className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Video canvas container */}
                <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <div id="qr-scanner-element" className="w-full h-full max-w-md [&_video]:object-cover" />
                  
                  {/* Visual alignment box overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-52 h-52 border-2 border-dashed border-indigo-550 rounded-2xl relative">
                      {/* Pulsing corners */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br" />
                    </div>
                  </div>
                </div>

                {/* Warnings or success messages */}
                {scanError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-bounce">
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}
              </div>

              {/* Right col: real-time scanned feed logs */}
              <div className="bg-[#161B22] rounded-2xl border border-slate-800 p-5 flex flex-col h-full min-h-[250px]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Log Absen Instan</h3>
                
                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[280px] pr-1">
                  {scannedLogs.length > 0 ? (
                    scannedLogs.map((log, i) => (
                      <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center justify-between transition animate-fade-in">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-200">{log.name}</p>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" /> {log.time}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          {log.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                      <QrCode className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-xs font-medium text-slate-550">Belum ada scan masuk</p>
                      <p className="text-[9.5px] text-slate-600 mt-0.5">Dekatkan QR Code kartu murid ke kamera</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Grid Left: Student Attendance List */}
            <div className="lg:col-span-2 bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
              {/* Control Bar */}
              <div className="p-5 border-b border-slate-800 bg-[#10141A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-450 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-900/60 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isScanning ? (
                    <button
                      onClick={stopScanning}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
                      id="stop-scan-btn"
                    >
                      <X className="w-4 h-4" /> Tutup Scanner
                    </button>
                  ) : (
                    <button
                      onClick={startScanning}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold transition"
                      id="start-scan-btn"
                    >
                      <Camera className="w-4 h-4" /> Pindai QR Absensi
                    </button>
                  )}

                  {totalActive > 0 && (
                    <button
                      onClick={handleMarkAllPresent}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                      id="mark-all-present-btn"
                    >
                      <Check className="w-4 h-4" /> Hadirkan Semua
                    </button>
                  )}
                </div>
              </div>

            {/* Attendance Entries Table */}
            <div className="overflow-x-auto">
              {activeStudents.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#10141A] border-b border-slate-800">
                      <th className="py-3 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-12 text-center">No</th>
                      <th className="py-3 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Siswa</th>
                      <th className="py-3 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-64">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeStudents.map((student, idx) => {
                      const status = workingRecords[student.id] || 'H';
                      return (
                        <tr key={student.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-5 text-xs text-slate-500 text-center font-medium">{idx + 1}</td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${
                                status === 'H' ? 'bg-emerald-500' :
                                status === 'S' ? 'bg-amber-500' :
                                status === 'I' ? 'bg-sky-500' : 'bg-rose-500'
                              }`} />
                              <span className="text-xs font-bold text-slate-200">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-5">
                            {/* Segmented Radio Options */}
                            <div className="flex justify-center bg-[#10141A] p-1 rounded-xl w-full max-w-[240px] mx-auto border border-slate-850">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'H')}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                                  status === 'H' 
                                    ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 shadow-sm' 
                                    : 'text-slate-400 hover:text-white'
                                  }`}
                              >
                                H
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'S')}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                                  status === 'S' 
                                    ? 'bg-amber-500/25 text-amber-400 border border-amber-500/20 shadow-sm' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                S
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'I')}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                                  status === 'I' 
                                    ? 'bg-sky-500/25 text-sky-400 border border-sky-500/20 shadow-sm' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                I
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'A')}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                                  status === 'A' 
                                    ? 'bg-rose-500/25 text-rose-400 border border-rose-500/20 shadow-sm' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                A
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">Tidak ada siswa aktif</p>
                  <p className="text-[10px] text-slate-500">Tambahkan siswa di tab "Siswa" terlebih dahulu</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Today's Summary & Legend */}
          <div className="space-y-6">
            {/* Stats Circular Widget */}
            <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm p-6 text-center">
              <h3 className="text-sm font-bold text-white mb-6">Ringkasan Hari Ini</h3>

              {/* Attendance percentage indicator */}
              <div className="relative inline-flex items-center justify-center mb-6">
                {/* SVG Ring */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#202530"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#4f46e5"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * dayStats.percentHadir) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-white">{dayStats.percentHadir}%</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hadir</p>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Hadir</span>
                  <span className="text-lg font-extrabold text-emerald-300">{dayStats.H}</span>
                </div>
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <span className="text-[10px] text-amber-400 font-semibold uppercase block">Sakit</span>
                  <span className="text-lg font-extrabold text-amber-300">{dayStats.S}</span>
                </div>
                <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10">
                  <span className="text-[10px] text-sky-400 font-semibold uppercase block">Izin</span>
                  <span className="text-lg font-extrabold text-sky-300">{dayStats.I}</span>
                </div>
                <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                  <span className="text-[10px] text-rose-400 font-semibold uppercase block">Alpa</span>
                  <span className="text-lg font-extrabold text-rose-300">{dayStats.A}</span>
                </div>
              </div>
            </div>

            {/* Guide Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Panduan Kode Presensi</h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">H</span>
                  <span><strong>Hadir</strong> (Siswa hadir di sekolah)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">S</span>
                  <span><strong>Sakit</strong> (Izin sakit dengan surat/bukti)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-sky-500/20 border border-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px]">I</span>
                  <span><strong>Izin</strong> (Izin keperluan keluarga penting)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-rose-600/20 border border-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">A</span>
                  <span><strong>Alpa</strong> (Absen tanpa keterangan resmi)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* REPORT VIEW */
        <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-[#10141A] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Rekapitulasi Absensi Individual</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total presensi yang tercatat dari semua tanggal harian</p>
            </div>
            
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>{attendance.length} Hari Terarsip</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {studentStats.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#10141A] border-b border-slate-800">
                    <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-12 text-center">No</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</th>
                    <th className="py-3 px-6 text-xs font-bold text-emerald-400 uppercase tracking-wider text-center w-24">Hadir</th>
                    <th className="py-3 px-6 text-xs font-bold text-amber-400 uppercase tracking-wider text-center w-24">Sakit</th>
                    <th className="py-3 px-6 text-xs font-bold text-sky-400 uppercase tracking-wider text-center w-24">Izin</th>
                    <th className="py-3 px-6 text-xs font-bold text-rose-400 uppercase tracking-wider text-center w-24">Alpa</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-32">Rasio Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentStats.map((stat, idx) => (
                    <tr key={stat.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-6 text-xs text-slate-500 text-center font-medium">{idx + 1}</td>
                      <td className="py-3 px-6 text-xs font-bold text-slate-200">{stat.name}</td>
                      <td className="py-3 px-6 text-xs text-emerald-400 font-bold text-center bg-emerald-500/5">{stat.H}</td>
                      <td className="py-3 px-6 text-xs text-amber-400 font-bold text-center bg-amber-500/5">{stat.S}</td>
                      <td className="py-3 px-6 text-xs text-sky-400 font-bold text-center bg-sky-500/5">{stat.I}</td>
                      <td className="py-3 px-6 text-xs text-rose-400 font-bold text-center bg-rose-500/5">{stat.A}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-900/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                stat.rate >= 90 ? 'bg-emerald-500' :
                                stat.rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${stat.rate}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${
                            stat.rate >= 90 ? 'text-emerald-400' :
                            stat.rate >= 75 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {stat.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Belum ada data rekap</p>
                <p className="text-[10px] text-slate-500">Simpan absensi harian agar rekap otomatis terisi</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

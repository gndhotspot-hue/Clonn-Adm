import React, { useState } from 'react';
import { 
  Calendar, 
  UserPlus, 
  X, 
  Sparkles, 
  HelpCircle, 
  Check, 
  Trash2, 
  User, 
  Users 
} from 'lucide-react';
import { Student, PiketGroup } from '../types';

interface PiketManagerProps {
  students: Student[];
  piket: PiketGroup[];
  onUpdatePiket: (newPiket: PiketGroup[]) => void;
}

export default function PiketManager({
  students,
  piket,
  onUpdatePiket,
}: PiketManagerProps) {
  const activeStudents = students.filter(s => s.status === 'aktif');
  
  // Day Options
  const days: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  ];

  // Selected Day for adding students
  const [activeDay, setActiveDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | null>(null);

  // Auto distribute/shuffle active students across Mon-Fri or Mon-Sat
  const handleAutoDistribute = () => {
    if (activeStudents.length === 0) {
      alert('Tambahkan siswa aktif terlebih dahulu untuk membagi jadwal piket!');
      return;
    }

    if (confirm('Bagi piket otomatis akan mengacak seluruh siswa aktif dan menimpa jadwal piket saat ini. Lanjutkan?')) {
      // Shuffle students array
      const shuffled = [...activeStudents].sort(() => Math.random() - 0.5);
      
      // Initialize empty groups
      const newGroups: PiketGroup[] = days.map(day => ({
        day,
        studentIds: []
      }));

      // Distribute evenly
      shuffled.forEach((student, index) => {
        const targetGroupIndex = index % days.length;
        newGroups[targetGroupIndex].studentIds.push(student.id);
      });

      onUpdatePiket(newGroups);
    }
  };

  // Remove a student from a specific day
  const handleRemoveFromDay = (day: string, studentId: string) => {
    const updated = piket.map(group => {
      if (group.day === day) {
        return {
          ...group,
          studentIds: group.studentIds.filter(id => id !== studentId)
        };
      }
      return group;
    });
    onUpdatePiket(updated);
  };

  // Add multiple selected students to a specific day
  const handleAddStudentsToDay = (studentIdsToAdd: string[]) => {
    if (!activeDay) return;
    
    const updated = piket.map(group => {
      if (group.day === activeDay) {
        // Prevent duplicates
        const mergedIds = Array.from(new Set([...group.studentIds, ...studentIdsToAdd]));
        return {
          ...group,
          studentIds: mergedIds
        };
      }
      return group;
    });

    onUpdatePiket(updated);
    setActiveDay(null);
  };

  // Clear all duty rosters
  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan semua jadwal piket kelas?')) {
      const cleared = days.map(day => ({
        day,
        studentIds: []
      }));
      onUpdatePiket(cleared);
    }
  };

  return (
    <div className="space-y-6" id="piket-manager">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white">Jadwal Piket Kebersihan Kelas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola giliran piket harian siswa untuk menjaga kebersihan dan kerapian ruang kelas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAll}
            disabled={piket.every(g => g.studentIds.length === 0)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Kosongkan Jadwal
          </button>
          
          <button
            onClick={handleAutoDistribute}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            id="auto-distribute-piket-btn"
          >
            <Sparkles className="w-4 h-4" /> Bagi Piket Otomatis
          </button>
        </div>
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map(day => {
          const group = piket.find(g => g.day === day) || { day, studentIds: [] };
          const groupStudents = students.filter(s => group.studentIds.includes(s.id));
          
          return (
            <div key={day} className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden flex flex-col min-h-[220px] hover:border-slate-700 transition duration-200">
              {/* Card Day Header */}
              <div className="p-4 bg-[#10141A] border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                  <h3 className="text-sm font-bold text-white">Hari {day}</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold rounded-full text-[10px]">
                  {groupStudents.length} Siswa
                </span>
              </div>

              {/* Day Piket List */}
              <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[180px]">
                {groupStudents.length > 0 ? (
                  groupStudents.map(student => (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-2.5 bg-slate-900/40 hover:bg-slate-800/50 rounded-xl border border-slate-800/60 transition group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          student.gender === 'L' ? 'bg-indigo-400' : 'bg-pink-400'
                        }`} />
                        <span className="text-xs font-semibold text-slate-200 truncate">{student.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium font-mono shrink-0">({student.gender})</span>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveFromDay(day, student.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        title="Keluarkan dari Piket"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                    <Users className="w-7 h-7 text-slate-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-500">Jadwal piket kosong</p>
                    <p className="text-[10px] text-slate-500">Belum ada siswa bertugas</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-[#10141A]/50 border-t border-slate-800/60 flex items-center justify-center">
                <button
                  onClick={() => setActiveDay(day)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-350 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Tambah Anggota
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Students Picker Modal Overlay */}
      {activeDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-800 flex flex-col h-[450px]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Atur Anggota Piket - {activeDay}</h3>
                <p className="text-[11px] text-slate-400">Pilih beberapa siswa untuk bertugas di hari {activeDay}</p>
              </div>
              <button 
                onClick={() => setActiveDay(null)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of students check list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#10141A]/40">
              {activeStudents.length > 0 ? (
                (() => {
                  const dayGroup = piket.find(g => g.day === activeDay);
                  const currentPiketIds = dayGroup ? dayGroup.studentIds : [];
                  
                  return activeStudents.map(student => {
                    const isAlreadyInDay = currentPiketIds.includes(student.id);
                    return (
                      <label 
                        key={student.id} 
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isAlreadyInDay 
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-white font-semibold' 
                            : 'bg-[#161B22] border-slate-800/80 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isAlreadyInDay}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleAddStudentsToDay([student.id]);
                              } else {
                                handleRemoveFromDay(activeDay, student.id);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-700"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              student.gender === 'L' ? 'bg-indigo-400' : 'bg-pink-400'
                            }`} />
                            <span className="text-xs">{student.name}</span>
                          </div>
                        </div>
                        
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          {isAlreadyInDay ? 'Bertugas' : 'Kosong'}
                        </span>
                      </label>
                    );
                  });
                })()
              ) : (
                <div className="text-center py-12">
                  <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Tidak ada murid aktif</p>
                </div>
              )}
            </div>

            {/* Done CTA */}
            <div className="p-4 border-t border-slate-800 bg-[#161B22]">
              <button
                onClick={() => setActiveDay(null)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Selesai Mengatur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

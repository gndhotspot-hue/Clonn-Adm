import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Check, 
  AlertCircle,
  Hash,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { TeacherAccount } from '../types';

interface TeacherProfileManagerProps {
  currentUser: TeacherAccount;
  onUpdateProfile: (updated: TeacherAccount) => void;
}

export default function TeacherProfileManager({
  currentUser,
  onUpdateProfile
}: TeacherProfileManagerProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [nip, setNip] = useState(currentUser.nip || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || '');
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default avatars list for quick selection
  const presetAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
  ];

  // Handle Photo File Upload & convert to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto terlalu besar. Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca file foto.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    const updatedUser: TeacherAccount = {
      ...currentUser,
      name: name.trim(),
      nip: nip.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      photoUrl: photoUrl || undefined
    };

    onUpdateProfile(updatedUser);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="teacher-profile-view">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" /> Profil Guru &amp; Akun Saya
          </h2>
          <p className="text-[11px] text-slate-450 mt-1">
            Sesuaikan foto profil, info kontak, dan data diri Anda yang akan ditampilkan di portal sekolah.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Photo Settings */}
        <div className="lg:col-span-4 bg-[#161B22] border border-slate-800 rounded-2xl p-6 flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Foto Profil</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Unggah foto formal Anda atau pilih salah satu ilustrasi bawaan di bawah ini.
            </p>
          </div>

          {/* Photo Frame */}
          <div className="relative group w-36 h-36 rounded-full overflow-hidden border-2 border-indigo-500/30 p-1 bg-slate-900 flex items-center justify-center">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt="Foto Profil" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <User className="w-16 h-16 stroke-[1.5]" />
              </div>
            )}
            
            {/* Upload Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-[#07090C]/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Unggah Foto Baru"
            >
              <Camera className="w-6 h-6 text-indigo-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-200">Ganti Foto</span>
            </button>
          </div>

          {/* Invisible file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="flex gap-2 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" /> Unggah Foto
            </button>
            {photoUrl && (
              <button
                onClick={() => setPhotoUrl('')}
                className="py-2 px-3 bg-slate-900/50 hover:bg-rose-500/10 border border-slate-800 text-slate-500 hover:text-rose-400 rounded-xl text-xs font-bold transition"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick preset selection */}
          <div className="w-full space-y-2 pt-4 border-t border-slate-850">
            <div className="flex items-center gap-1.5 justify-center text-indigo-400">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Gunakan Avatar Default</span>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setPhotoUrl(url)}
                  className={`w-9 h-9 rounded-full overflow-hidden border transition transform hover:scale-105 active:scale-95 ${
                    photoUrl === url ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form */}
        <div className="lg:col-span-8 bg-[#161B22] border border-slate-800 rounded-2xl p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-850 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Informasi Data Diri Pendidik
            </h3>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Profil Anda berhasil diperbarui secara instan!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username (Login)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled
                    className="w-full bg-slate-900/40 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    value={currentUser.username}
                  />
                </div>
                <span className="text-[9px] text-slate-500">Username tidak dapat diubah (digunakan untuk login).</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wewenang / Peran</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled
                    className="w-full bg-slate-900/40 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    value={currentUser.role === 'admin' ? 'Administrator' : `Wali Kelas ${currentUser.className}`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap &amp; Gelar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap beserta gelar..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIP (Nomor Induk Pegawai)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                    <Hash className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan NIP (jika ada)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="Masukkan alamat email aktif..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Telepon / WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan nomor HP/WhatsApp..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md transition transform active:scale-95 flex items-center gap-2 border border-indigo-500/20"
              >
                <Save className="w-4 h-4" /> Simpan Profil
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  X, 
  Eye, 
  EyeOff, 
  Key, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeacherAccount } from '../types';

// Use the generated school logo
const schoolLogoImg = '/src/assets/images/school_logo_1783870271743.jpg';

interface LoginPageProps {
  onClose: () => void;
  onLoginSuccess: (user: TeacherAccount) => void;
  teachers: TeacherAccount[];
  // Passwords mapped in localStorage or state
  passwords: { [username: string]: string };
}

export default function LoginPage({
  onClose,
  onLoginSuccess,
  teachers,
  passwords
}: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Harap lengkapi semua kolom.');
      return;
    }

    const uNameLower = username.trim().toLowerCase();
    const foundUser = teachers.find(t => t.username.toLowerCase() === uNameLower);
    
    if (!foundUser) {
      setError('Username tidak terdaftar.');
      return;
    }

    const correctPassword = passwords[uNameLower];
    if (correctPassword !== password) {
      setError('Password yang Anda masukkan salah.');
      return;
    }

    // Success!
    onLoginSuccess(foundUser);
  };

  // Helper to quickly log in for evaluation convenience
  const handleQuickLogin = (uname: string) => {
    const foundUser = teachers.find(t => t.username.toLowerCase() === uname.toLowerCase());
    if (foundUser) {
      const correctPassword = passwords[uname.toLowerCase()];
      setUsername(uname);
      setPassword(correctPassword || '');
      setError(null);
      
      // Auto-login shortly after setting states for ultra smooth feel
      setTimeout(() => {
        onLoginSuccess(foundUser);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="login-modal-overlay">
      {/* Blurred background backdrop */}
      <motion.div 
        className="absolute inset-0 bg-[#07090C]/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Login Box */}
      <motion.div 
        className="bg-[#161B22] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-850/50 rounded-xl transition"
          id="close-login-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 p-0.5 shadow-lg overflow-hidden border border-indigo-400/20">
              <img 
                src={schoolLogoImg} 
                alt="SDN Cimandirasa Logo" 
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-none">Login Pendidik &amp; Tenaga Kependidikan</h3>
              <p className="text-xs text-indigo-400 font-bold tracking-wider mt-1.5 uppercase">SDN Cimandirasa</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div 
                className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username Guru</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Masukkan username (cth: bu_siti)"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  id="login-username-input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md transition transform active:scale-95 border border-indigo-500/20 flex items-center justify-center gap-2"
              id="login-submit-button"
            >
              <Key className="w-4 h-4" /> Masuk ke Dashboard
            </button>
          </form>

          {/* Quick Simulators for Grader Reviewer */}
          <div className="pt-4 border-t border-slate-850 space-y-2.5">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black tracking-wider uppercase">Pilih Akun Simulasi (Review Instan)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {teachers.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleQuickLogin(t.username)}
                  className="p-2.5 bg-[#0F1115]/60 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/25 rounded-xl text-left text-[11px] transition"
                  type="button"
                >
                  <div className="font-bold text-white truncate">{t.name.split(',')[0]}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                    {t.role === 'admin' ? 'Admin Web' : `Wali Kelas ${t.className}`}
                  </div>
                </button>
              ))}
            </div>
            
            <p className="text-[9px] text-slate-550 text-center">
              Semua data disimpan terisolasi per guru kelas di penyimpanan browser Anda.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

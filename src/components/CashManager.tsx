import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  DollarSign, 
  X, 
  PlusCircle, 
  AlertCircle 
} from 'lucide-react';
import { CashRecord } from '../types';

interface CashManagerProps {
  cash: CashRecord[];
  onAddTransaction: (record: CashRecord) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function CashManager({
  cash,
  onAddTransaction,
  onDeleteTransaction,
}: CashManagerProps) {
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'masuk' as 'masuk' | 'keluar',
    amount: '',
    description: '',
    category: 'Uang Kas Mingguan',
    date: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState('');

  // Categories
  const categories = [
    'Uang Kas Mingguan',
    'Sosial & Santunan',
    'Keperluan Kelas',
    'Cetak & ATK',
    'Kegiatan & Acara',
    'Lain-lain'
  ];

  // Calculations
  const totalIncome = cash
    .filter(r => r.type === 'masuk')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = cash
    .filter(r => r.type === 'keluar')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  // Handles Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount.trim()) {
      setFormError('Jumlah uang harus diisi');
      return;
    }
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Jumlah uang harus berupa angka positif');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Keterangan transaksi harus diisi');
      return;
    }

    const payload: CashRecord = {
      id: 'cash_' + Date.now().toString(),
      date: formData.date,
      type: formData.type,
      amount: parsedAmount,
      description: formData.description.trim(),
      category: formData.category,
    };

    onAddTransaction(payload);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      type: 'masuk',
      amount: '',
      description: '',
      category: 'Uang Kas Mingguan',
      date: new Date().toISOString().split('T')[0],
    });
    setFormError('');
  };

  // Filter & Search Logic
  const filteredRecords = cash.filter(record => {
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesCategory = filterCategory === 'all' || record.category === filterCategory;
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  }).sort((a, b) => b.date.localeCompare(a.date)); // Date descending

  // Print Report Helper
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="cash-manager">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white">Buku Kas &amp; Keuangan Kelas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Catat iuran mingguan, kas masuk, pengeluaran sosial, dan log pembelian perlengkapan</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            disabled={cash.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
          
          <button
            onClick={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            id="add-transaction-btn"
          >
            <Plus className="w-4 h-4" /> Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Stats Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Saldo */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-md text-white border border-indigo-500/10 relative overflow-hidden">
          <div className="absolute right-4 bottom-4 opacity-10">
            <Wallet className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Sisa Saldo Kas Kelas</p>
          <h3 className="text-3xl font-extrabold mt-2">
            Rp {currentBalance.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-indigo-250 mt-2">Selisih total pemasukan dan pengeluaran</p>
        </div>

        {/* Pemasukan */}
        <div className="bg-[#161B22] rounded-2xl p-5 border border-slate-800/80 shadow-sm flex items-center gap-4 hover:shadow-md transition animate-fade-in">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
            <h3 className="text-xl font-extrabold text-white mt-1">
              Rp {totalIncome.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Uang Kas Masuk</p>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-[#161B22] rounded-2xl p-5 border border-slate-800/80 shadow-sm flex items-center gap-4 hover:shadow-md transition animate-fade-in">
          <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
            <h3 className="text-xl font-extrabold text-white mt-1">
              Rp {totalExpense.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-rose-450 font-semibold mt-0.5">Pengeluaran Logistik</p>
          </div>
        </div>
      </div>

      {/* Filter and Ledger Table */}
      <div className="bg-[#161B22] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
        {/* Ledger Filters */}
        <div className="p-4 bg-[#10141A] border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search ledger */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari keterangan atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter:</span>
            </div>

            {/* Segmented type buttons */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-[#10141A] p-0.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  filterType === 'all' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('masuk')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  filterType === 'masuk' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setFilterType('keluar')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  filterType === 'keluar' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Keluar
              </button>
            </div>

            {/* Category selection dropdown */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 text-slate-200 px-3 py-1 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Kategori: Semua</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {filteredRecords.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#10141A] border-b border-slate-800">
                  <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis</th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Jumlah</th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-6 text-xs font-mono text-slate-400">{record.date}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-900/50 text-slate-350 border border-slate-800 rounded-lg text-[10px] font-bold">
                        {record.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs font-semibold text-slate-200">{record.description}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        record.type === 'masuk' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                      }`}>
                        {record.type === 'masuk' ? (
                          <>
                            <TrendingUp className="w-3 h-3" /> Pemasukan
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" /> Pengeluaran
                          </>
                        )}
                      </span>
                    </td>
                    <td className={`py-3.5 px-6 text-xs font-extrabold text-right font-mono ${
                      record.type === 'masuk' ? 'text-emerald-400' : 'text-rose-450'
                    }`}>
                      {record.type === 'masuk' ? '+' : '-'} Rp {record.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus transaksi "${record.description}"?`)) {
                            onDeleteTransaction(record.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-450 hover:bg-slate-800 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 px-4">
              <Wallet className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Belum ada transaksi</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan tambah transaksi pertama untuk iuran kas kelas mingguan atau pengeluaran pembelian barang kelas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-850">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tambah Transaksi Baru</h3>
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

              {/* Transaction Type Radio Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Jenis Aliran Keuangan <span className="text-rose-500">*</span></label>
                <div className="flex bg-[#10141A] p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'masuk' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      formData.type === 'masuk' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Kas Masuk (Pemasukan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'keluar' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      formData.type === 'keluar' 
                        ? 'bg-rose-500/20 text-rose-455 border border-rose-500/35 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Kas Keluar (Pengeluaran)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Jumlah Uang (Rupiah) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 10000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Kategori Transaksi</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#10141A] text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Keterangan Singkat <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Iuran kas kelas minggu ke-1 atau Beli sapu ijuk"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900/40 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Tanggal Pencatatan</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900/40 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  id="save-transaction-submit-btn"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

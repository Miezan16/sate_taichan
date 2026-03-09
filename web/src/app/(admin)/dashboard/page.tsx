"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChefHat, Users, LogOut, Loader2, Plus, Pencil, Trash2,
    AlertTriangle, Package, ShieldCheck, KeyRound, History,
    Activity, Search, RefreshCw, TrendingUp, ArrowUpDown,
    BarChart3, Building2, Download, FileSpreadsheet, FileText, ClipboardList,
    Wallet, Printer, X
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { MenuItem, UserRecord, ActivityLogEntry, CabangInfo } from "@/lib/types";

// ── Import MenuModal dinonaktifkan karena komponennya sudah disatukan di file ini
// import { MenuModal } from "@/components/admin/MenuModal";
import { UserModal } from "@/components/admin/UserModal";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

// ==========================================
// HELPERS & TYPES
// ==========================================
type Tab = "overview" | "history" | "menu" | "users" | "log";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

interface AnalyticsData {
    peakHours: { hour: string; count: number }[];
    bestSellers: { name: string; sold: number }[];
}

interface TransactionRecord {
    id: number;
    tanggal: string;
    nama_pelanggan: string;
    nomor_meja: string;
    kasir_nama: string;
    total_harga: number;
    metode_pembayaran: string;
    status: string;
    cabang_id?: number;
    cabang?: { nama_cabang: string };
}

// ==========================================
// MENU MODAL (UPLOAD IMAGE & TAMBAH DESKRIPSI)
// ==========================================
function MenuModal({ menu, onClose, onSave }: { menu: Partial<MenuItem>; onClose: () => void; onSave: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nama: menu.nama || "",
        deskripsi: menu.deskripsi || "", // <-- Field deskripsi ditambahkan
        kategori: menu.kategori || "",
        protein: menu.protein || "",
        stok: menu.stok || 0,
        harga: menu.harga || 0,
        tersedia: menu.tersedia !== undefined ? menu.tersedia : true,
        image: menu.image || "", 
    });

    // Mengubah file gambar menjadi Base64 agar tidak ngelag
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = menu.id ? `/api/admin/menu/${menu.id}` : "/api/admin/menu";
            const method = menu.id ? "PUT" : "POST";

            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            onSave();
        } catch (error) {
            console.error("Gagal menyimpan menu:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
                    <h2 className="text-lg font-bold text-white">
                        {menu.id ? "Edit Menu" : "Tambah Menu Baru"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                    {/* BAGIAN UPLOAD FOTO */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Foto Menu (Upload Gambar)</label>
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-xl transition-all hover:bg-white/10">
                            {formData.image ? (
                                <img 
                                    src={formData.image} 
                                    alt="Preview" 
                                    className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-white/10"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-black/40 border border-dashed border-white/20 flex items-center justify-center text-gray-500">
                                    <Package size={20} />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-500/20 file:text-violet-400 hover:file:bg-violet-500/30 cursor-pointer transition-all"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Sistem otomatis menyimpan gambar</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Nama Menu</label>
                        <input
                            type="text"
                            required
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                        />
                    </div>

                    {/* INPUT DESKRIPSI DITAMBAHKAN DI SINI */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Deskripsi Menu</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.deskripsi}
                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors resize-none"
                            placeholder="Contoh: Sate ayam full daging dengan sambal yang ekstra pedas."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Kategori</label>
                            <input
                                type="text"
                                required
                                value={formData.kategori}
                                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Jenis Protein</label>
                            <input
                                type="text"
                                value={formData.protein}
                                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Stok</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.stok}
                                onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">Harga (Rp)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.harga}
                                onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl mt-2">
                        <div>
                            <p className="text-sm font-bold text-white">Status Menu</p>
                            <p className="text-xs text-gray-500">Tampilkan menu ini di kasir / pelanggan</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.tersedia}
                                onChange={(e) => setFormData({ ...formData, tersedia: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl mt-4 hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                        {loading ? "Menyimpan..." : "Simpan Menu"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// ==========================================
// OVERVIEW TAB (GRAFIK, LIST BEST SELLER, & 3 KARTU PENDAPATAN)
// ==========================================
function OverviewTab({ analyticsData, selectedBranch, transactions }: { analyticsData: AnalyticsData | null, selectedBranch: string, transactions: TransactionRecord[] }) {
    if (!analyticsData) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Loader2 size={40} className="mb-3 animate-spin opacity-50 text-violet-400" />
                <p className="text-sm font-bold">Memuat data analitik...</p>
            </div>
        );
    }

    // --- KALKULASI TOTAL PENDAPATAN ---
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).getTime();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    const revenueToday = transactions
        .filter(t => new Date(t.tanggal).getTime() >= startOfToday)
        .reduce((sum, t) => sum + t.total_harga, 0);

    const revenueWeek = transactions
        .filter(t => new Date(t.tanggal).getTime() >= startOfWeek)
        .reduce((sum, t) => sum + t.total_harga, 0);

    const revenueMonth = transactions
        .filter(t => new Date(t.tanggal).getTime() >= startOfMonth)
        .reduce((sum, t) => sum + t.total_harga, 0);

    // --- KALKULASI GRAFIK TREN PENDAPATAN (7 HARI TERAKHIR) ---
    const dailyData = useMemo(() => {
        const trend: Record<string, number> = {};
        // Buat array 7 hari terakhir (kosong/0) agar grafik tetap terbentuk walau tidak ada transaksi di hari tertentu
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
            trend[dateStr] = 0;
        }

        // Isi dengan total_harga dari transaksi
        transactions.forEach(t => {
            const d = new Date(t.tanggal);
            const dateStr = d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
            if (trend[dateStr] !== undefined) {
                trend[dateStr] += t.total_harga;
            }
        });

        return Object.keys(trend).map(date => ({ date, total: trend[date] }));
    }, [transactions]);

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 pr-2">
            
            {/* HEADER OVERVIEW */}
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div>
                    <h2 className="text-lg font-bold text-white">Business Intelligence</h2>
                    <p className="text-xs text-gray-500">Pantau performa pendapatan dan penjualan menu secara live</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all">
                        <FileSpreadsheet size={16} /> Export Laporan Excel
                    </button>
                </div>
            </div>

            {/* --- 3 KARTU STATISTIK PENDAPATAN --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Wallet size={18} /></div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pendapatan Harian</h3>
                    </div>
                    <p className="text-2xl font-black text-white relative z-10">{formatRp(revenueToday)}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg"><Activity size={18} /></div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pendapatan Mingguan</h3>
                    </div>
                    <p className="text-2xl font-black text-white relative z-10">{formatRp(revenueWeek)}</p>
                </div>

                <div className="bg-gradient-to-br from-violet-500/10 to-purple-900/20 border border-violet-500/20 p-5 rounded-2xl relative overflow-hidden group hover:bg-violet-500/10 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl group-hover:bg-violet-500/30 transition-colors" />
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="p-2 bg-violet-500/20 text-violet-400 rounded-lg"><BarChart3 size={18} /></div>
                        <h3 className="text-violet-400/80 text-xs font-bold uppercase tracking-wider">Pendapatan Bulanan</h3>
                    </div>
                    <p className="text-2xl font-black text-violet-300 relative z-10">{formatRp(revenueMonth)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* KIRI: GRAFIK TREN 7 HARI TERAKHIR */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col h-full">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-violet-400" /> Grafik Tren Pendapatan (7 Hari Terakhir)
                    </h3>
                    <div className="flex-1 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="date" stroke="#ffffff50" tick={{fill: '#ffffff50'}} />
                                <YAxis 
                                    stroke="#ffffff50" 
                                    tick={{fill: '#ffffff50'}} 
                                    tickFormatter={(value) => value >= 1000 ? `Rp${value / 1000}k` : `Rp${value}`} 
                                    width={80}
                                />
                                <Tooltip 
                                    formatter={(value: number) => [formatRp(value), "Pendapatan"]}
                                    labelStyle={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '4px' }}
                                    contentStyle={{backgroundColor: '#0a0a0a', borderColor: '#ffffff10', borderRadius: '8px', color: '#fff'}} 
                                />
                                <Line type="monotone" dataKey="total" name="Pendapatan" stroke="#a78bfa" strokeWidth={4} dot={{ r: 5, fill: '#a78bfa' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KANAN: LIST MENU TERLARIS */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col h-full">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-400" /> Peringkat Penjualan Menu
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
                        {analyticsData.bestSellers.length > 0 ? (
                            analyticsData.bestSellers.map((item, index) => (
                                <div key={item.name} className="flex justify-between items-center p-3 bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-bold text-sm text-white">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                                        {item.sold}x Dibeli
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 text-sm mt-10">Belum ada data penjualan</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// HISTORY TAB (RIWAYAT TRANSAKSI KASIR + PDF EXPORT)
// ==========================================
function HistoryTab({ transactions, branches }: { transactions: TransactionRecord[], branches: CabangInfo[] }) {
    // --- FUNGSI EXPORT PDF ---
    const handlePrintHistory = () => {
        const printWindow = window.open("", "_blank", "width=1000,height=700");
        if (!printWindow) return alert("Izinkan popup untuk mencetak PDF");

        const grandTotal = transactions.reduce((sum, o) => sum + o.total_harga, 0);
        const dateStr = new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const rowsHtml = transactions.map(h => {
            const branchName = h.cabang?.nama_cabang || branches.find(b => b.id === h.cabang_id)?.nama_cabang || '-';
            return `
            <tr>
                <td class="center">#${h.id}</td>
                <td>${new Date(h.tanggal).toLocaleString("id-ID")}</td>
                <td>${h.nama_pelanggan}</td>
                <td class="center">${h.nomor_meja}</td>
                <td>${h.kasir_nama || "-"}</td>
                <td class="center">${branchName}</td>
                <td class="center">${h.metode_pembayaran}</td>
                <td class="right">Rp ${h.total_harga.toLocaleString("id-ID")}</td>
            </tr>
        `}).join("");

        const htmlContent = `
        <html>
            <head>
            <title>Laporan Transaksi - ${dateStr}</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .header h1 { margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; }
                .header p { margin: 0; color: #666; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                th, td { border: 1px solid #ddd; padding: 12px; }
                th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .total-row { background-color: #f8f9fa; }
                .total-row td { font-size: 16px; font-weight: bold; border-top: 2px solid #333; }
                .footer { text-align: center; font-size: 12px; color: #888; margin-top: 50px; }
            </style>
            </head>
            <body>
            <div class="header">
                <h1>Laporan Riwayat Transaksi</h1>
                <p>Sate Sadjodo | Tanggal Cetak: ${dateStr}</p>
            </div>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Tanggal & Waktu</th>
                    <th>Pelanggan</th>
                    <th>Meja</th>
                    <th>Kasir</th>
                    <th>Cabang</th>
                    <th>Metode</th>
                    <th class="right">Total</th>
                </tr>
                </thead>
                <tbody>
                ${rowsHtml}
                <tr class="total-row">
                    <td colspan="7" class="right">TOTAL PENDAPATAN</td>
                    <td class="right">Rp ${grandTotal.toLocaleString("id-ID")}</td>
                </tr>
                </tbody>
            </table>
            <div class="footer">
                <p>Dokumen ini dicetak otomatis oleh Sistem Kasir Sate Sadjodo.</p>
            </div>
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
            </body>
        </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><History className="text-cyan-400" /> Riwayat Transaksi Kasir</h2>
                <button
                    onClick={handlePrintHistory}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                    <Download size={16} /> Export PDF
                </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                        <tr>
                            <th className="p-4 font-bold">Waktu</th>
                            <th className="p-4 font-bold">Pelanggan / Meja</th>
                            <th className="p-4 font-bold">Kasir</th>
                            <th className="p-4 font-bold">Cabang</th>
                            <th className="p-4 font-bold">Metode</th>
                            <th className="p-4 font-bold text-right">Total Tagihan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.map((t) => {
                            const branchName = t.cabang?.nama_cabang || branches.find(b => b.id === t.cabang_id)?.nama_cabang || '-';

                            return (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="text-cyan-400 font-bold text-xs">#{t.id}</div>
                                        <div className="text-gray-500 text-[10px]">{new Date(t.tanggal).toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-white text-xs">{t.nama_pelanggan}</span>
                                        <span className="ml-2 bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400">Meja {t.nomor_meja}</span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-xs">{t.kasir_nama || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-medium text-xs">{branchName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.metode_pembayaran === 'CASH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {t.metode_pembayaran || 'CASH'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-white text-sm">{formatRp(t.total_harga)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                        <ClipboardList size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-bold">Belum ada transaksi selesai</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// MENU TAB 
// ==========================================
function MenuTab({ menus, onRefresh }: { menus: MenuItem[]; onRefresh: () => void }) {
    const [modalMenu, setModalMenu] = useState<Partial<MenuItem> | null>(null);
    const [confirm, setConfirm] = useState<MenuItem | null>(null);
    const [search, setSearch] = useState("");
    const [sortStok, setSortStok] = useState(false);

    const filtered = menus
        .filter((m) => m.nama.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => sortStok ? a.stok - b.stok : 0);

    const handleDelete = async (menu: MenuItem) => {
        await fetch(`/api/admin/menu/${menu.id}`, { method: "DELETE" });
        onRefresh();
        setConfirm(null);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                        <Search size={16} className="text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari menu..."
                            className="bg-transparent outline-none text-sm text-white w-40 placeholder:text-gray-600"
                        />
                    </div>
                    <button
                        onClick={() => setSortStok((p) => !p)}
                        title={sortStok ? "Reset urutan" : "Urutkan stok terendah"}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${sortStok
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        <ArrowUpDown size={14} />
                        Stok {sortStok ? "Terendah ▲" : "Terendah"}
                    </button>
                </div>
                <button
                    onClick={() => setModalMenu({})}
                    className="flex items-center gap-2 bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                    <Plus size={16} /> Tambah Menu
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                        <tr>
                            <th className="p-4 font-bold">Menu</th>
                            <th className="p-4 font-bold text-center">Stok</th>
                            <th className="p-4 font-bold text-right">Harga</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence>
                            {filtered.map((m) => (
                                <motion.tr
                                    key={m.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {m.image && (
                                                <img
                                                    src={m.image}
                                                    alt={m.nama}
                                                    className="w-10 h-10 rounded-xl object-cover bg-white/5"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                            )}
                                            <div>
                                                <p className="font-bold text-white text-sm">{m.nama}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    {m.kategori} · {m.protein}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${m.is_low_stock
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                : "bg-white/5 border-white/10 text-gray-300"
                                                }`}
                                        >
                                            {m.is_low_stock && (
                                                <AlertTriangle size={10} className="inline mr-1" />
                                            )}
                                            {m.stok}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-white">
                                        {formatRp(m.harga)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${m.tersedia
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-gray-500/10 text-gray-500"
                                                }`}
                                        >
                                            {m.tersedia ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => setModalMenu(m)}
                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirm(m)}
                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                                title="Hapus"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                        <Package size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-bold">Tidak ada menu ditemukan</p>
                    </div>
                )}
            </div>

            {modalMenu !== null && (
                <MenuModal
                    menu={modalMenu}
                    onClose={() => setModalMenu(null)}
                    onSave={() => { setModalMenu(null); onRefresh(); }}
                />
            )}
            {confirm && (
                <ConfirmModal
                    message={`Hapus menu "${confirm.nama}"? Menu tidak akan muncul di daftar pelanggan, tetapi data tetap tersimpan.`}
                    onConfirm={() => handleDelete(confirm)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
}

// ==========================================
// USERS TAB 
// ==========================================
function UsersTab({
    users,
    branches,
    onRefresh,
}: {
    users: UserRecord[];
    branches: CabangInfo[];
    onRefresh: () => void;
}) {
    const [modalUser, setModalUser] = useState<Partial<UserRecord> | null>(null);
    const [confirm, setConfirm] = useState<UserRecord | null>(null);

    const handleDelete = async (user: UserRecord) => {
        await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
        onRefresh();
        setConfirm(null);
    };

    const roleBadge = (role: string) =>
        role === "admin" ? (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center gap-1">
                <ShieldCheck size={10} /> Admin
            </span>
        ) : (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center gap-1">
                <KeyRound size={10} /> Kasir
            </span>
        );

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setModalUser({})}
                    className="flex items-center gap-2 bg-linear-to-r from-violet-500 to-purple-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                >
                    <Plus size={16} /> Tambah User
                </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                        <tr>
                            <th className="p-4 font-bold">User</th>
                            <th className="p-4 font-bold text-center">Role</th>
                            <th className="p-4 font-bold">Cabang</th>
                            <th className="p-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-white">{u.username}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">{roleBadge(u.role)}</div>
                                </td>
                                <td className="p-4 text-gray-400 text-xs">
                                    {u.cabang?.nama_cabang ?? (
                                        <span className="text-gray-600 italic">Tidak ada</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => setModalUser(u)}
                                            className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => setConfirm(u)}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {modalUser !== null && (
                <UserModal
                    user={modalUser}
                    branches={branches}
                    onClose={() => setModalUser(null)}
                    onSave={() => { setModalUser(null); onRefresh(); }}
                />
            )}
            {confirm && (
                <ConfirmModal
                    message={`Hapus user "${confirm.username}"? Tindakan ini tidak bisa dibatalkan.`}
                    onConfirm={() => handleDelete(confirm)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
}

// ==========================================
// LOG TAB
// ==========================================
function LogTab({ logs }: { logs: ActivityLogEntry[] }) {
    const actionColor: Record<string, string> = {
        CREATE_MENU: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        DELETE_MENU: "text-red-400 bg-red-500/10 border-red-500/30",
        UPDATE_PRICE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        UPDATE_STOCK: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    };
    return (
        <div className="h-full overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
            <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                    <tr>
                        <th className="p-4 font-bold">Waktu</th>
                        <th className="p-4 font-bold">Aksi</th>
                        <th className="p-4 font-bold">Entity</th>
                        <th className="p-4 font-bold">Old Value</th>
                        <th className="p-4 font-bold">New Value</th>
                        <th className="p-4 font-bold">User</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString("id-ID")}
                            </td>
                            <td className="p-4">
                                <span
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${actionColor[log.action] ?? "text-gray-400 bg-white/5 border-white/10"
                                        }`}
                                >
                                    {log.action}
                                </span>
                            </td>
                            <td className="p-4 text-gray-300 text-xs">
                                {log.entity} #{log.entity_id}
                            </td>
                            <td className="p-4 text-gray-500 text-xs font-mono max-w-[140px] truncate">
                                {log.old_value ?? "—"}
                            </td>
                            <td className="p-4 text-gray-300 text-xs font-mono max-w-[140px] truncate">
                                {log.new_value ?? "—"}
                            </td>
                            <td className="p-4 text-gray-400 text-xs">
                                {log.user?.username ?? (log.user_id ? `User #${log.user_id}` : "—")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                    <Activity size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold">Belum ada log aktivitas</p>
                </div>
            )}
        </div>
    );
}

// ==========================================
// MAIN DASHBOARD
// ==========================================
export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview"); 
    
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [branches, setBranches] = useState<CabangInfo[]>([]);
    const [adminName, setAdminName] = useState("");
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [selectedBranch, setSelectedBranch] = useState<string>(""); 
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            const branchQuery = selectedBranch ? `?cabang_id=${selectedBranch}` : '';
            
            const [menuRes, userRes, logRes, branchRes, meRes, analyticsRes, transRes] = await Promise.all([
                fetch(`/api/admin/menu${branchQuery}`),
                fetch(`/api/admin/users${branchQuery}`),
                fetch(`/api/admin/log${branchQuery}`),
                fetch("/api/cabang"),
                fetch("/api/auth/me"),
                fetch(`/api/admin/analytics${branchQuery}`).catch(() => ({ ok: false, json: () => null })),
                fetch(`/api/transaksi${branchQuery}`).catch(() => ({ ok: false, json: () => null }))
            ]);
            
            if (!meRes.ok) { router.push("/login"); return; }
            const meData = await meRes.json();
            setAdminName(meData.username);
            
            if (menuRes.ok) setMenus(await menuRes.json());
            if (userRes.ok) setUsers(await userRes.json());
            if (logRes.ok) setLogs(await logRes.json());
            if (branchRes.ok) {
                const b = await branchRes.json();
                setBranches(Array.isArray(b) ? b : [b]);
            }
            if (analyticsRes.ok) {
                const analytics = await analyticsRes.json();
                if (analytics) setAnalyticsData(analytics);
            }
            if (transRes.ok) {
                const tData = await transRes.json();
                if (Array.isArray(tData)) {
                    setTransactions(tData.filter((t: any) => t.status === "COMPLETED"));
                }
            }
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    }, [router, selectedBranch]); 

    useEffect(() => { 
        fetchAll(); 
        const interval = setInterval(fetchAll, 5000); 
        return () => clearInterval(interval);
    }, [fetchAll]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "overview", label: "Overview", icon: BarChart3 }, 
        { id: "history", label: "Riwayat", icon: History },
        { id: "menu", label: "Menu", icon: ChefHat },
        { id: "users", label: "Users", icon: Users },
        { id: "log", label: "Log", icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505]">
            <aside className="w-20 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 z-40 shadow-2xl sticky top-0 h-screen">
                
                {/* LOGO AREA SATE SADJODO (Sidebar Admin) */}
                <div className="mb-8 flex flex-col items-center gap-2 group">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-600/20 rounded-full blur-[15px] group-hover:bg-red-600/40 transition-all duration-500"></div>
                        <img 
                            src="/logo-sadjodo.png" 
                            alt="Logo Sate Sadjodo" 
                            className="relative w-full h-full object-contain opacity-90 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                </div>

                <nav className="flex flex-col gap-4 w-full px-3 flex-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? "bg-white/10 text-white border border-white/10" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                        >
                            <tab.icon size={20} className={`transition-transform ${activeTab === tab.id ? "scale-110 text-violet-400" : "group-hover:scale-110"}`} />
                            <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                            {activeTab === tab.id && <motion.div layoutId="adminActiveTab" className="absolute left-0 w-1 h-8 bg-violet-400 rounded-full" style={{ top: "50%", transform: "translateY(-50%)" }} />}
                        </button>
                    ))}
                </nav>
                <div className="w-full px-3 mt-auto">
                    <button onClick={handleLogout} disabled={isLoggingOut} className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300">
                        {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                        <span className="text-[9px] font-bold">Keluar</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="px-8 py-5 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-sm z-10">
                    <div>
                        {/* TEXT LOGO HEADER ADMIN */}
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            SATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">SADJODO</span>
                        </h1>
                        <p className="text-gray-500 text-[11px] mt-0.5">Admin Panel - Pantau keseluruhan sistem dan data restoran</p>
                    </div>
                    
                    <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                            <Building2 size={16} className="text-gray-400" />
                            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer [&>option]:bg-zinc-900">
                                <option value="">Bandung</option>
                                {branches.map((b) => <option key={b.id} value={b.id}>{b.nama_cabang}</option>)}
                            </select>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-hidden">
                    {loading && menus.length === 0 ? (
                         <div className="h-full flex items-center justify-center">
                            <Loader2 size={40} className="animate-spin text-violet-400" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
                                {activeTab === "overview" && <OverviewTab analyticsData={analyticsData} selectedBranch={selectedBranch} transactions={transactions} />}
                                {activeTab === "history" && <HistoryTab transactions={transactions} branches={branches} />}
                                {activeTab === "menu" && <MenuTab menus={menus} onRefresh={fetchAll} />}
                                {activeTab === "users" && <UsersTab users={users} branches={branches} onRefresh={fetchAll} />}
                                {activeTab === "log" && <LogTab logs={logs} />}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
}
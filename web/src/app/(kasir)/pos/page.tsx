"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Flame, X, Banknote, CreditCard, LayoutGrid, 
  History, Loader2, Clock, ChevronRight, Wallet, Printer, CheckCircle2,
  Receipt, Download, Package, ChefHat, Search, SlidersHorizontal,
  Users, Calendar, CalendarDays, LineChart, Activity, TrendingUp
} from "lucide-react";

// --- TYPES ---
type StatusPesanan = "PENDING" | "PROCESSING" | "UNPAID" | "COMPLETED";
type MetodePembayaran = "CASH" | "EWALLET";

interface MenuItem { nama: string; }
interface OrderItem { id: number; menu: MenuItem; jumlah: number; harga_satuan: number; }
interface Order {
  id: number; nama_pelanggan: string; nomor_meja: string; status: StatusPesanan;
  total_harga: number; tanggal: string; kasir_nama?: string; metode_pembayaran?: MetodePembayaran;
  items: OrderItem[];
}

const COLUMNS = [
  { id: "PENDING", label: "Pesanan Masuk", icon: ClipboardList, accent: "from-amber-400 to-orange-500", shadow: "shadow-orange-500/20", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { id: "PROCESSING", label: "Sedang Dimasak", icon: Flame, accent: "from-rose-500 to-red-600", shadow: "shadow-red-500/20", text: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" },
  { id: "UNPAID", label: "Siap Disajikan / Bayar", icon: Wallet, accent: "from-cyan-400 to-blue-500", shadow: "shadow-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
];

export default function CashierDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "board" | "history" | "stock">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [cashierName, setCashierName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<MetodePembayaran>("CASH");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/transaksi", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data.filter((o: Order) => o.status !== "COMPLETED"));
        setHistoryOrders(data.filter((o: Order) => o.status === "COMPLETED"));
      }
    } catch (error) { console.error("Fetch Error:", error); }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- STATISTIK KALKULASI ---
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).getTime();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  const todayCompleted = historyOrders.filter(o => new Date(o.tanggal).getTime() >= startOfToday);
  const weekCompleted = historyOrders.filter(o => new Date(o.tanggal).getTime() >= startOfWeek);
  const monthCompleted = historyOrders.filter(o => new Date(o.tanggal).getTime() >= startOfMonth);

  const revenueToday = todayCompleted.reduce((sum, o) => sum + o.total_harga, 0);
  const revenueMonth = monthCompleted.reduce((sum, o) => sum + o.total_harga, 0);

  const handleNextStatus = async (order: Order) => {
    let nextStatus: StatusPesanan | null = null;
    if (order.status === "PENDING") nextStatus = "PROCESSING";
    else if (order.status === "PROCESSING") nextStatus = "UNPAID";
    
    if (order.status === "UNPAID") { setSelectedOrder(order); setIsModalOpen(true); return; }
    if (!nextStatus) return;

    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o));
    setLoadingOrderId(order.id);
    try {
      const res = await fetch(`/api/transaksi/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error();
      await fetchOrders();
    } catch (err) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
    } finally { setLoadingOrderId(null); }
  };

  const handleFinalSubmit = async () => {
    if (!cashierName.trim() || !selectedOrder) return alert("Nama kasir wajib diisi!");
    try {
      const res = await fetch(`/api/transaksi/${selectedOrder.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", kasir_nama: cashierName, metode_pembayaran: paymentMethod })
      });
      if (res.ok) { 
        setSelectedOrder(prev => prev ? {...prev, kasir_nama: cashierName, metode_pembayaran: paymentMethod} : null);
        setShowReceipt(true); 
        await fetchOrders(); 
      }
    } catch (err) { alert("Gagal memproses pembayaran"); }
  };

  const closeModal = () => {
    setIsModalOpen(false); setShowReceipt(false); setCashierName(""); setPaymentMethod("CASH"); setSelectedOrder(null);
  };

  // --- PRINT EXPORT PDF (LAPORAN TRANSAKSI) ---
  const handlePrintHistory = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) return alert('Izinkan popup untuk mencetak PDF');

    const grandTotal = historyOrders.reduce((sum, o) => sum + o.total_harga, 0);
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = historyOrders.map(h => `
      <tr>
        <td class="center">#${h.id}</td>
        <td>${new Date(h.tanggal).toLocaleString('id-ID')}</td>
        <td>${h.nama_pelanggan}</td>
        <td class="center">${h.nomor_meja}</td>
        <td>${h.kasir_nama || '-'}</td>
        <td class="center">${h.metode_pembayaran}</td>
        <td class="right">Rp ${h.total_harga.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

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
            <p>Sate Taichan Premium | Tanggal Cetak: ${dateStr}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tanggal & Waktu</th>
                <th>Pelanggan</th>
                <th>Meja</th>
                <th>Kasir</th>
                <th>Metode</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="6" class="right">TOTAL PENDAPATAN</td>
                <td class="right">Rp ${grandTotal.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Dokumen ini dicetak otomatis oleh Sistem Kasir KitchenFlow.</p>
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

  // --- PRINT STRUK ALA ALFAMART (THERMAL PRINTER) ---
  const handlePrintReceipt = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return alert('Izinkan popup untuk mencetak struk');

    const dateStr = new Date(selectedOrder.tanggal).toLocaleString('id-ID');
    
    const itemsHtml = selectedOrder.items.map(item => `
      <div class="item">
        <div class="item-name">${item.menu.nama}</div>
        <div class="flex">
          <span>${item.jumlah} x ${item.harga_satuan.toLocaleString('id-ID')}</span>
          <span>${(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</span>
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Struk #${selectedOrder.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px; /* Ukuran printer thermal 58mm/80mm */
              margin: 20px auto; 
              color: #000; 
              font-size: 12px; 
              background: #fff;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .left { text-align: left; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .dashed-line { border-bottom: 1px dashed #000; margin: 8px 0; }
            h2 { margin: 0 0 5px 0; font-size: 18px; }
            p { margin: 2px 0; }
            .item { margin-bottom: 6px; }
            .item-name { margin-bottom: 2px; }
            .total-section { margin-top: 10px; font-size: 14px; }
            .footer { margin-top: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>SATE TAICHAN PREMIUM</h2>
            <p>Jl. Kuliner No. 99, Bandung</p>
            <p>Telp: 0812-3456-7890</p>
          </div>
          
          <div class="dashed-line"></div>
          
          <p>Waktu : ${dateStr}</p>
          <p>Kasir : ${selectedOrder.kasir_nama || '-'}</p>
          <p>Meja  : ${selectedOrder.nomor_meja}</p>
          <p>Order : #${selectedOrder.id} - ${selectedOrder.nama_pelanggan}</p>
          
          <div class="dashed-line"></div>
          
          ${itemsHtml}
          
          <div class="dashed-line"></div>
          
          <div class="total-section">
            <div class="flex bold">
              <span>TOTAL</span>
              <span>Rp ${selectedOrder.total_harga.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex mt-1">
              <span>METODE</span>
              <span>${selectedOrder.metode_pembayaran}</span>
            </div>
          </div>
          
          <div class="dashed-line"></div>
          
          <div class="center footer">
            <p class="bold">TERIMA KASIH</p>
            <p>Selamat Menikmati Hidangan Kami</p>
            <p>*** KitchenFlow POS ***</p>
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

  // --- MODERN ORDER CARD ---
  const OrderCard = ({ order, col }: { order: Order, col: any }) => {
    const isLoading = loadingOrderId === order.id;
    const isLastStatus = order.status === "UNPAID";

    return (
      <motion.div 
        layout layoutId={`order-${order.id}`}
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 shadow-xl overflow-hidden"
      >
        <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${col.accent} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-gradient-to-r ${col.accent} text-white shadow-sm`}>#{order.id}</span>
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                <Clock size={10} /> {new Date(order.tanggal).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
              </span>
            </div>
            <h3 className="font-bold text-sm text-white truncate max-w-[150px]">{order.nama_pelanggan}</h3>
          </div>
          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${col.bg} border ${col.border} ${col.shadow}`}>
            <span className="text-[10px] text-gray-400 font-medium -mb-1">Meja</span>
            <span className={`text-lg font-black ${col.text}`}>{order.nomor_meja}</span>
          </div>
        </div>
        
        <div className="space-y-2 mb-4 relative z-10">
          {order.items?.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs">
              <div className="flex gap-2">
                <span className={`font-bold ${col.text}`}>{item.jumlah}x</span>
                <span className="text-gray-300 leading-tight pr-2">{item.menu?.nama}</span>
              </div>
            </div>
          ))}
          {order.items?.length > 3 && (
            <div className="text-[10px] text-gray-500 font-medium italic">+ {order.items.length - 3} item lainnya...</div>
          )}
        </div>
        
        <div className="flex items-end justify-between pt-3 border-t border-white/10 relative z-10">
          <div>
            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Total</p>
            <p className="text-sm font-bold text-white tracking-tight">Rp {order.total_harga.toLocaleString('id-ID')}</p>
          </div>
          <button 
            onClick={() => handleNextStatus(order)} disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${
              isLoading ? "bg-white/5 text-gray-500 cursor-not-allowed" : `bg-gradient-to-r ${col.accent} text-white hover:shadow-xl ${col.shadow}`
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : isLastStatus ? <>Bayar <Wallet size={14} /></> : <>Proses <ChevronRight size={14} /></>}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505]">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-20 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 z-40 shadow-2xl">
        <div className="mb-8 p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-red-500/20">
          <ChefHat className="text-white" size={24} />
        </div>
        
        <nav className="flex flex-col gap-4 w-full px-3">
          {[
            { id: "overview", icon: LineChart, label: "Stats" },
            { id: "board", icon: LayoutGrid, label: "Board" },
            { id: "stock", icon: Package, label: "Stok" },
            { id: "history", icon: History, label: "Riwayat" }
          ].map((menu) => (
            <button 
              key={menu.id} onClick={() => setActiveTab(menu.id as any)} 
              className={`group relative w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-300 ${
                activeTab === menu.id ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <menu.icon size={20} className={`transition-transform ${activeTab === menu.id ? 'scale-110 text-cyan-400' : 'group-hover:scale-110'}`} />
              <span className="text-[9px] font-bold tracking-wide">{menu.label}</span>
              {activeTab === menu.id && (
                <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-full" style={{ top: "50%", transform: "translateY(-50%)" }} />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* --- GLOBAL HEADER (Pendapatan Live) --- */}
        <header className="px-8 py-6 flex justify-between items-center z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              KITCHEN<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">FLOW</span>
            </h1>
            <p className="text-gray-400 font-medium text-[11px] mt-1 tracking-wide flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sistem Kasir Aktif
            </p>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Indikator Pendapatan Hari Ini */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 px-5 py-2.5 rounded-2xl flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400"><TrendingUp size={18} /></div>
              <div>
                <p className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest mb-0.5">Pendapatan Hari Ini</p>
                <p className="text-lg font-black text-emerald-400 leading-none tracking-tight">Rp {revenueToday.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Cari ID / Meja..." className="bg-transparent border-none outline-none text-sm text-white w-32 placeholder:text-gray-600" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-hidden z-10">
          
          {/* --- VIEW: OVERVIEW / DASHBOARD --- */}
          {activeTab === "overview" && (
            <div className="h-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Overview Restoran</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1: Pelanggan Hari Ini */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl"><Users size={24} /></div>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pelanggan Hari Ini</h3>
                  <p className="text-4xl font-black text-white">{todayCompleted.length} <span className="text-sm font-medium text-gray-500">orang</span></p>
                </div>

                {/* Card 2: Pelanggan Minggu Ini */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Calendar size={24} /></div>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pelanggan Minggu Ini</h3>
                  <p className="text-4xl font-black text-white">{weekCompleted.length} <span className="text-sm font-medium text-gray-500">orang</span></p>
                </div>

                {/* Card 3: Pelanggan Bulan Ini */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl"><CalendarDays size={24} /></div>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pelanggan Bulan Ini</h3>
                  <p className="text-4xl font-black text-white">{monthCompleted.length} <span className="text-sm font-medium text-gray-500">orang</span></p>
                </div>

                {/* Card 4: Total Pendapatan Bulan Ini */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-900/40 border border-emerald-500/20 p-6 rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Wallet size={24} /></div>
                  </div>
                  <h3 className="text-emerald-500/80 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Pendapatan Bulan Ini</h3>
                  <p className="text-3xl font-black text-emerald-400 relative z-10">Rp {revenueMonth.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: DASHBOARD KANBAN --- */}
          {activeTab === "board" && (
            <div className="flex gap-6 h-full overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {COLUMNS.map((col) => {
                const colOrders = orders.filter(o => o.status === col.id);
                return (
                  <div key={col.id} className="min-w-[340px] max-w-[340px] flex flex-col h-full snap-center bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${col.accent} shadow-lg ${col.shadow}`}>
                          <col.icon className="text-white" size={16} />
                        </div>
                        <h2 className="font-bold text-sm text-white tracking-wide">{col.label}</h2>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${col.bg} ${col.text} border ${col.border}`}>{colOrders.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                      <AnimatePresence>
                        {colOrders.length === 0 ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-32 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600">
                            <col.icon className="mb-2 opacity-20" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Kosong</span>
                          </motion.div>
                        ) : (
                          colOrders.map(o => <OrderCard key={`order-${o.id}`} order={o} col={col} />)
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- VIEW: STOCK --- */}
          {activeTab === "stock" && (
            <div className="h-full bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
              <Package size={64} className="text-cyan-400 mb-6 opacity-80" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold text-white mb-2">Manajemen Stok Bahan</h2>
              <p className="text-gray-400 max-w-md text-sm">Modul ini sedang dalam tahap pengembangan. Nantinya Anda dapat memantau stok secara real-time di sini.</p>
            </div>
          )}

          {/* --- VIEW: HISTORY --- */}
          {activeTab === "history" && (
            <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="font-bold text-lg text-white flex items-center gap-2"><History className="text-cyan-400" size={20} /> Riwayat Transaksi</h2>
                </div>
                <button onClick={handlePrintHistory} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                  <Download size={16} /> Export PDF
                </button>
              </div>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                    <tr>
                      <th className="p-5 font-bold tracking-wider">ID / Waktu</th>
                      <th className="p-5 font-bold tracking-wider">Pelanggan</th>
                      <th className="p-5 font-bold tracking-wider text-center">Meja</th>
                      <th className="p-5 font-bold tracking-wider">Kasir</th>
                      <th className="p-5 font-bold tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyOrders.map((h) => (
                      <tr key={h.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-5"><div className="text-cyan-400 font-bold text-xs mb-1">#{h.id}</div><div className="text-gray-500 text-[10px]">{new Date(h.tanggal).toLocaleString('id-ID')}</div></td>
                        <td className="p-5 font-bold text-white text-xs">{h.nama_pelanggan}</td>
                        <td className="p-5 text-center"><span className="bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-xs font-bold text-gray-300">{h.nomor_meja}</span></td>
                        <td className="p-5 text-gray-400 text-xs">{h.kasir_nama || '-'}</td>
                        <td className="p-5 text-right font-black text-white text-sm">Rp {h.total_harga.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL CHECKOUT TETAP SAMA --- */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className={`w-full ${showReceipt ? 'max-w-md' : 'max-w-4xl'} bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative`}>
              {!showReceipt && <button onClick={closeModal} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-red-500/20 text-white rounded-full transition-all z-20"><X size={20} /></button>}
              {!showReceipt ? (
                <div className="flex flex-col lg:flex-row h-[500px]">
                  {/* ... Kode Modal Checkout (tidak diubah) ... */}
                  <div className="lg:w-1/2 bg-white/5 p-8 flex flex-col border-r border-white/10 relative">
                    <h2 className="text-xl font-bold text-white mb-6">Ringkasan Pesanan</h2>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 flex justify-between items-center">
                      <div><p className="text-xs text-gray-400 mb-1">Pelanggan</p><p className="font-bold text-white">{selectedOrder.nama_pelanggan}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-400 mb-1">Meja</p><p className="font-bold text-cyan-400 text-lg">{selectedOrder.nomor_meja}</p></div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm"><span className="text-gray-300"><span className="text-cyan-400 font-bold mr-2">{item.jumlah}x</span>{item.menu.nama}</span><span className="font-bold text-white">Rp{(item.jumlah * item.harga_satuan).toLocaleString()}</span></div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-white/10 mt-4">
                      <p className="text-xs text-gray-400 mb-1">Total Tagihan</p>
                      <p className="text-3xl font-black text-white">Rp {selectedOrder.total_harga.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="lg:w-1/2 p-8 flex flex-col justify-center">
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['CASH', 'EWALLET'] as const).map((method) => (
                            <button key={method} onClick={() => setPaymentMethod(method)} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === method ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                              {method === 'CASH' ? <Banknote size={24} /> : <CreditCard size={24} />}<span className="font-bold text-xs">{method === 'CASH' ? 'Tunai' : 'E-Wallet'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Nama Kasir</label>
                        <input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="Masukkan nama Anda..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-cyan-500 outline-none transition-all" />
                      </div>
                      <button onClick={handleFinalSubmit} disabled={!cashierName.trim()} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold uppercase disabled:opacity-50 mt-4">
                        Selesaikan Pembayaran
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                  <h2 className="text-xl font-bold text-white mb-2">Pembayaran Berhasil!</h2>
                  <p className="text-gray-400 text-sm mb-8">Pesanan #{selectedOrder.id} atas nama {selectedOrder.nama_pelanggan} telah selesai.</p>
                  <div className="flex gap-3">
                    <button onClick={handlePrintReceipt} className="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-cyan-500/30"><Printer size={18} /> Cetak Struk</button>
                    <button onClick={closeModal} className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20">Selesai</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
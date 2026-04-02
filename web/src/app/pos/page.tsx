"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Flame,
  X,
  Banknote,
  CreditCard,
  LayoutGrid,
  History,
  Loader2,
  Clock,
  ChevronRight,
  Wallet,
  Printer,
  CheckCircle2,
  Receipt,
  Download,
  Package,
  ChefHat,
  Search,
  SlidersHorizontal,
  Users,
  Calendar,
  CalendarDays,
  LineChart,
  Activity,
  TrendingUp,
  LogOut,
  Building2,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Utensils,
} from "lucide-react";

// --- TYPES ---
type StatusPesanan = "PENDING" | "PROCESSING" | "UNPAID" | "COMPLETED";
type MetodePembayaran = "CASH" | "EWALLET";

interface MenuItem {
  id: number;
  nama: string;
  deskripsi: string;
  harga: number;
  image: string;
  kategori: string;
  stok: number;
}

interface OrderItem {
  id: number;
  menu: MenuItem;
  jumlah: number;
  harga_satuan: number;
  level_pedas?: number | null;
  catatan?: string | null;
}

interface Order {
  id: number;
  nama_pelanggan: string;
  nomor_meja: string;
  status: StatusPesanan;
  total_harga: number;
  tanggal: string;
  kasir_nama?: string;
  metode_pembayaran?: MetodePembayaran;
  uang_bayar?: number;
  kembalian?: number;
  items: OrderItem[];
}

interface CabangInfo {
  id: number;
  nama_cabang: string;
  alamat: string;
  telepon?: string | null;
  link_maps?: string | null;
}

interface StockItem {
  id: number;
  nama: string;
  kategori: string;
  stok: number;
  harga: number;
  image: string;
}

const COLUMNS = [
  {
    id: "PENDING",
    label: "Pesanan Masuk",
    icon: ClipboardList,
    accent: "from-amber-400 to-orange-500",
    shadow: "shadow-orange-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  {
    id: "PROCESSING",
    label: "Sedang Dimasak",
    icon: Flame,
    accent: "from-rose-500 to-red-600",
    shadow: "shadow-red-500/20",
    text: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
  },
  {
    id: "UNPAID",
    label: "Siap Disajikan / Bayar",
    icon: Wallet,
    accent: "from-cyan-400 to-blue-500",
    shadow: "shadow-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
];

export default function CashierDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "board" | "history" | "stock"
  >("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [cashierName, setCashierName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [uangDiterima, setUangDiterima] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- STATE CABANG BARU ---
  const [branches, setBranches] = useState<CabangInfo[]>([]);
  const [selectedCabangId, setSelectedCabangId] = useState<number | "">("");

  // --- STATE STOCK BARU ---
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockCategoryFilter, setStockCategoryFilter] = useState("All");
  const stockCategories = ["All", "Sate", "Karbo", "Camilan", "Minuman"];

  // Kembalian dihitung secara real-time
  const kembalian =
    paymentMethod === "CASH" && uangDiterima
      ? Math.max(0, Number(uangDiterima) - (selectedOrder?.total_harga ?? 0))
      : 0;

  const isCashValid =
    paymentMethod !== "CASH" ||
    Number(uangDiterima) >= (selectedOrder?.total_harga ?? 0);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/transaksi", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data.filter((o: Order) => o.status !== "COMPLETED"));
        setHistoryOrders(data.filter((o: Order) => o.status === "COMPLETED"));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  // --- FETCH STOCK DATA (MENU) ---
  const fetchStock = async () => {
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStockItems(
          data.map((item: any) => ({
            id: item.id,
            nama: item.nama,
            kategori: item.kategori,
            stok: item.stok ?? 0,
            harga: item.harga,
            image: item.image,
          })),
        );
      }
    } catch (error) {
      console.error("Stock Fetch Error:", error);
    } finally {
      setIsLoadingStock(false);
    }
  };

  // --- UPDATE STOCK AFTER ORDER ---
  const updateStockAfterOrder = async (orderItems: OrderItem[]) => {
    try {
      for (const item of orderItems) {
        await fetch(`/api/menu/${item.menu.id}/stock`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stok: Math.max(0, item.menu.stok - item.jumlah),
          }),
        });
      }
      fetchStock(); // Refresh stock data
    } catch (error) {
      console.error("Stock Update Error:", error);
    }
  };

  // Ambil nama kasir dari session & data cabang saat pertama load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setCashierName(data.username);
      } catch {
        router.push("/login");
      }
    };

    // FETCH LIST CABANG
    const fetchCabang = async () => {
      try {
        const res = await fetch("/api/cabang");
        if (res.ok) {
          const data = await res.json();
          const branchList = Array.isArray(data) ? data : [data];
          setBranches(branchList);
          // Auto select cabang pertama jika ada
          if (branchList.length > 0) {
            setSelectedCabangId(branchList[0].id);
          }
        }
      } catch {
        /* Cabang info optional */
      }
    };

    fetchUser();
    fetchCabang();
    fetchStock();
  }, [router]);

  // --- AUTO REFRESH ORDERS & STOCK EVERY 5 SECONDS ---
  useEffect(() => {
    fetchOrders();
    fetchStock(); // Refresh stock/menu data to sync with admin deletions

    const interval = setInterval(() => {
      fetchOrders();
      fetchStock(); // Auto refresh stock/menu every 5 seconds
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // --- STATISTIK KALKULASI ---
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const startOfWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay(),
  ).getTime();
  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  ).getTime();

  const todayCompleted = historyOrders.filter(
    (o) => new Date(o.tanggal).getTime() >= startOfToday,
  );
  const weekCompleted = historyOrders.filter(
    (o) => new Date(o.tanggal).getTime() >= startOfWeek,
  );
  const monthCompleted = historyOrders.filter(
    (o) => new Date(o.tanggal).getTime() >= startOfMonth,
  );

  const revenueToday = todayCompleted.reduce(
    (sum, o) => sum + o.total_harga,
    0,
  );
  const revenueMonth = monthCompleted.reduce(
    (sum, o) => sum + o.total_harga,
    0,
  );

  const handleNextStatus = async (order: Order) => {
    let nextStatus: StatusPesanan | null = null;
    if (order.status === "PENDING") nextStatus = "PROCESSING";
    else if (order.status === "PROCESSING") nextStatus = "UNPAID";

    if (order.status === "UNPAID") {
      setSelectedOrder(order);
      setIsModalOpen(true);
      return;
    }

    if (!nextStatus) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)),
    );
    setLoadingOrderId(order.id);

    try {
      const res = await fetch(`/api/transaksi/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      await fetchOrders();
    } catch (err) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: order.status } : o,
        ),
      );
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedOrder) return;
    const uangBayarVal =
      paymentMethod === "CASH"
        ? Number(uangDiterima)
        : selectedOrder.total_harga;
    const kembalianVal = paymentMethod === "CASH" ? kembalian : 0;

    try {
      const res = await fetch(`/api/transaksi/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          metode_pembayaran: paymentMethod,
          uang_bayar: uangBayarVal,
          kembalian: kembalianVal,
          kasir_nama: cashierName,
          cabang_id: selectedCabangId || null,
        }),
      });
      if (res.ok) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                kasir_nama: cashierName,
                // Tambahkan "as any" di sini untuk membungkam error TypeScript
                metode_pembayaran: paymentMethod as any,
                uang_bayar: uangBayarVal,
                kembalian: kembalianVal,
              }
            : null,
        );
        setShowReceipt(true);
        await fetchOrders();
        // --- UPDATE STOCK SETELAH PEMBAYARAN BERHASIL ---
        await updateStockAfterOrder(selectedOrder.items);
      }
    } catch (err) {
      alert("Gagal memproses pembayaran");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowReceipt(false);
    setPaymentMethod("CASH");
    setUangDiterima("");
    setSelectedOrder(null);
  };

  const handlePrintHistory = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) return alert("Izinkan popup untuk mencetak PDF");
    const grandTotal = historyOrders.reduce((sum, o) => sum + o.total_harga, 0);
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const rowsHtml = historyOrders
      .map(
        (h) => `
         <tr>
           <td class="center">#${h.id}</td>
           <td>${new Date(h.tanggal).toLocaleString("id-ID")}</td>
           <td>${h.nama_pelanggan}</td>
           <td class="center">${h.nomor_meja}</td>
           <td>${h.kasir_nama || "-"}</td>
           <td class="center">${h.metode_pembayaran}</td>
           <td class="right">Rp ${h.total_harga.toLocaleString("id-ID")}</td>
         </tr>
      `,
      )
      .join("");

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
                 <th>Metode</th>
                 <th class="right">Total</th>
               </tr>
             </thead>
             <tbody>
              ${rowsHtml}
               <tr class="total-row">
                 <td colspan="6" class="right">TOTAL PENDAPATAN</td>
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

  const handlePrintReceipt = () => {
    if (!selectedOrder) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return alert("Izinkan popup untuk mencetak struk");
    const activeCabang =
      branches.find((b) => b.id === selectedCabangId) || branches[0];
    const dateStr = new Date(selectedOrder.tanggal).toLocaleString("id-ID");

    const itemsHtml = selectedOrder.items
      .map(
        (item) => `
         <div class="item">
           <div class="item-name">${item.menu.nama}</div>
           <div class="flex">
             <span>${item.jumlah} x ${item.harga_satuan.toLocaleString("id-ID")}</span>
             <span>${(item.jumlah * item.harga_satuan).toLocaleString("id-ID")}</span>
           </div>
         </div>
      `,
      )
      .join("");

    const htmlContent = `
       <html>
         <head>
           <title>Struk #${selectedOrder.id}</title>
           <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px;
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
             <h2>${activeCabang?.nama_cabang ?? "SATE SADJODO"}</h2>
             <p>${activeCabang?.alamat ?? "Jl. Kuliner No. 99, Bandung"}</p>
            ${
              activeCabang?.telepon
                ? `<p>Telp: ${activeCabang.telepon}</p>`
                : "<p>Telp: 0812-3456-7890</p>"
            }
           </div>
          
           <div class="dashed-line"></div>
          
           <p>Waktu : ${dateStr}</p>
           <p>Kasir : ${selectedOrder.kasir_nama || "-"}</p>
           <p>Meja  : ${selectedOrder.nomor_meja}</p>
           <p>Order : #${selectedOrder.id} - ${selectedOrder.nama_pelanggan}</p>
          
           <div class="dashed-line"></div>
          
          ${itemsHtml}
          
           <div class="dashed-line"></div>
          
           <div class="total-section">
             <div class="flex bold">
               <span>TOTAL</span>
               <span>Rp ${selectedOrder.total_harga.toLocaleString("id-ID")}</span>
             </div>
             <div class="flex mt-1">
               <span>METODE</span>
               <span>${selectedOrder.metode_pembayaran}</span>
             </div>
            ${
              selectedOrder.metode_pembayaran === "CASH"
                ? `
             <div class="flex mt-1">
               <span>BAYAR</span>
               <span>Rp ${(selectedOrder.uang_bayar ?? 0).toLocaleString("id-ID")}</span>
             </div>
             <div class="flex mt-1 bold">
               <span>KEMBALI</span>
               <span>Rp ${(selectedOrder.kembalian ?? 0).toLocaleString("id-ID")}</span>
             </div>`
                : ""
            }
           </div>
          
           <div class="dashed-line"></div>
          
           <div class="center footer">
             <p class="bold">TERIMA KASIH</p>
             <p>Selamat Menikmati Hidangan Kami</p>
             <p>*** Sate Sadjodo POS ***</p>
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

  const OrderCard = ({ order, col }: { order: Order; col: any }) => {
    const isLoading = loadingOrderId === order.id;
    const isLastStatus = order.status === "UNPAID";

    return (
      <motion.div
        layout
        layoutId={`order-${order.id}`}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 shadow-xl overflow-hidden"
      >
        <div
          className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${col.accent} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`}
        />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded bg-gradient-to-r ${col.accent} text-white shadow-sm`}
              >
                #{order.id}
              </span>
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                <Clock size={10} />{" "}
                {new Date(order.tanggal).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-[150px]">
              {order.nama_pelanggan}
            </h3>
          </div>
          <div
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${col.bg} border ${col.border} ${col.shadow}`}
          >
            <span className="text-[10px] text-gray-400 font-medium -mb-1">
              Meja
            </span>
            <span className={`text-lg font-black ${col.text}`}>
              {order.nomor_meja}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 relative z-10">
          {order.items?.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 text-xs"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <span className={`font-bold ${col.text}`}>{item.jumlah}x</span>
                  <span className="text-gray-300 leading-tight pr-2">
                    {item.menu?.nama}
                  </span>
                </div>
              </div>
              {/* --- TAMPILAN LEVEL PEDAS & CATATAN PADA KARTU PESANAN --- */}
              {((item.level_pedas !== null && item.level_pedas !== undefined) || item.catatan) && (
                <div className="flex flex-wrap gap-1 ml-6 mb-1">
                  {item.level_pedas !== null && item.level_pedas !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 w-max ${item.level_pedas === 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.level_pedas > 0 ? <><Flame size={8} /> Level {item.level_pedas}</> : "Pisah Sambal"}
                    </span>
                  )}
                  {item.catatan && (
                    <span className="text-[9px] text-gray-400 italic bg-white/5 px-1.5 py-0.5 rounded border border-white/5 line-clamp-1 break-all max-w-[150px]">
                      "{item.catatan}"
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          {order.items?.length > 3 && (
            <div className="text-[10px] text-gray-500 font-medium italic mt-1">
              + {order.items.length - 3} item lainnya...
            </div>
          )}
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-white/10 relative z-10">
          <div>
            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
              Total
            </p>
            <p className="text-sm font-bold text-white tracking-tight">
              Rp {order.total_harga.toLocaleString("id-ID")}
            </p>
          </div>

          <button
            onClick={() => handleNextStatus(order)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${
              isLoading
                ? "bg-white/5 text-gray-500 cursor-not-allowed"
                : `bg-gradient-to-r ${col.accent} text-white hover:scale-105`
            }`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : isLastStatus ? (
              <>
                <Banknote size={14} /> Bayar
              </>
            ) : (
              <>
                Proses <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  const filteredStockItems = stockItems.filter((item) => {
    const matchesSearch = item.nama
      .toLowerCase()
      .includes(stockSearchQuery.toLowerCase());
    const matchesCategory =
      stockCategoryFilter === "All" || item.kategori === stockCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-20 lg:w-24 bg-[#0a0a0a] border-r border-white/10 py-6 flex flex-col items-center z-20">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(6,182,212,0.4)] relative">
          <ChefHat size={24} className="text-white relative z-10" />
        </div>

        <nav className="flex flex-col gap-4 w-full px-3">
          {[
            { id: "overview", icon: Activity, label: "Statistik" },
            { id: "board", icon: LayoutGrid, label: "Pesanan" },
            { id: "history", icon: History, label: "Riwayat" },
            { id: "stock", icon: Package, label: "Stok Menu" },
          ].map((menu) => (
            <button
              key={menu.id}
              onClick={() => setActiveTab(menu.id as any)}
              className={`w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-300 relative group ${
                activeTab === menu.id
                  ? "bg-white/10 text-white shadow-lg border border-white/10"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <menu.icon
                size={20}
                className={`transition-transform ${
                  activeTab === menu.id
                    ? "scale-110 text-cyan-400"
                    : "group-hover:scale-110"
                }`}
              />
              <span className="text-[9px] font-bold tracking-wide">
                {menu.label}
              </span>
              {activeTab === menu.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-full"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Kasir info + Logout */}
        <div className="w-full px-3 mt-auto">
          <div className="flex flex-col items-center gap-1 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
              {cashierName ? cashierName[0].toUpperCase() : "?"}
            </div>
            <span className="text-[9px] text-gray-500 font-medium text-center truncate w-full text-center">
              {cashierName || "..."}
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
            className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
          >
            {isLoggingOut ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            <span className="text-[9px] font-bold tracking-wide">Keluar</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {/* HEADER */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl z-10 sticky top-0">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              SISTEM KASIR{" "}
              <span className="text-cyan-400">SATE SADJODO</span>
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Dashboard Manajemen Pesanan
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* DROPDOWN PILIH CABANG */}
            {branches.length > 0 && (
              <div className="relative group flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                <Building2 size={16} className="text-cyan-400" />
                <select
                  value={selectedCabangId}
                  onChange={(e) => setSelectedCabangId(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer appearance-none pr-4"
                >
                  {branches.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      className="bg-zinc-900 text-white"
                    >
                      {b.nama_cabang}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="text-gray-400 absolute right-3 pointer-events-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <CalendarDays size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-gray-300">
                {today.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Online</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {/* --- VIEW: OVERVIEW / STATISTIK --- */}
          {activeTab === "overview" && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Pelanggan Hari Ini */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
                      <Users size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Pelanggan Hari Ini
                  </h3>
                  <p className="text-4xl font-black text-white">
                    {todayCompleted.length}{" "}
                    <span className="text-sm font-medium text-gray-500">
                      orang
                    </span>
                  </p>
                </div>

                {/* Card 2: Pelanggan Minggu Ini */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                      <Calendar size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Pelanggan Minggu Ini
                  </h3>
                  <p className="text-4xl font-black text-white">
                    {weekCompleted.length}{" "}
                    <span className="text-sm font-medium text-gray-500">
                      orang
                    </span>
                  </p>
                </div>

                {/* Card 3: Pelanggan Bulan Ini */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <CalendarDays size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Pelanggan Bulan Ini
                  </h3>
                  <p className="text-4xl font-black text-white">
                    {monthCompleted.length}{" "}
                    <span className="text-sm font-medium text-gray-500">
                      orang
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 p-8 rounded-[2rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400">
                      <LineChart size={28} />
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                        Pendapatan Hari Ini
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        Total omzet harian
                      </p>
                    </div>
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter relative z-10">
                    Rp {revenueToday.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 p-8 rounded-[2rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400">
                      <TrendingUp size={28} />
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                        Pendapatan Bulan Ini
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        Total omzet bulanan
                      </p>
                    </div>
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter relative z-10">
                    Rp {revenueMonth.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: KANBAN BOARD --- */}
          {activeTab === "board" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[600px]">
              {COLUMNS.map((col) => {
                const colOrders = orders.filter((o) => o.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col bg-[#0a0a0a]/50 border border-white/5 rounded-[2rem] overflow-hidden"
                  >
                    <div
                      className={`p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r ${col.bg} to-transparent`}
                    >
                      <div className="flex items-center gap-3">
                        <col.icon className={col.text} size={20} />
                        <h2 className="font-bold text-white tracking-wide text-sm">
                          {col.label}
                        </h2>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${col.bg} ${col.text} border ${col.border}`}
                      >
                        {colOrders.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                      <AnimatePresence>
                        {colOrders.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-32 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600"
                          >
                            <col.icon className="mb-2 opacity-20" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              Kosong
                            </span>
                          </motion.div>
                        ) : (
                          colOrders.map((o) => (
                            <OrderCard
                              key={`order-${o.id}`}
                              order={o}
                              col={col}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- VIEW: STOCK (UPDATED WITH REAL DATA - SMALLER BADGES) --- */}
          {activeTab === "stock" && (
            <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md">
              {/* Stock Header - LEBIH KOMPAK */}
              <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
                <div>
                  <h2 className="font-bold text-lg text-white flex items-center gap-2">
                    <Package className="text-cyan-400" size={20} /> Manajemen
                    Stok
                  </h2>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Pantau sisa bahan dan menu secara real-time
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-48">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Cari menu..."
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    onClick={fetchStock}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Refresh Stok"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Kategori Filter - LEBIH KECIL */}
              <div className="px-6 py-3 border-b border-white/10 flex gap-2 overflow-x-auto scrollbar-hide bg-black/20">
                {stockCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStockCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${
                      stockCategoryFilter === cat
                        ? "bg-cyan-500 text-black"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Table List - REAL DATA */}
              <div className="flex-1 overflow-auto custom-scrollbar p-6">
                {isLoadingStock ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-3">
                    <Loader2 size={32} className="animate-spin text-cyan-500" />
                    <p className="text-sm font-medium">Memuat data stok...</p>
                  </div>
                ) : filteredStockItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-3">
                    <Package size={40} className="opacity-20" />
                    <p className="text-sm font-medium">
                      Tidak ada menu ditemukan
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] text-gray-500 uppercase border-b border-white/10">
                        <th className="pb-3 font-bold tracking-wider">
                          Nama Menu
                        </th>
                        <th className="pb-3 font-bold tracking-wider text-center">
                          Kategori
                        </th>
                        <th className="pb-3 font-bold tracking-wider text-center">
                          Sisa Stok
                        </th>
                        <th className="pb-3 font-bold tracking-wider text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStockItems.map((item) => {
                        const isLowStock = item.stok <= 10;
                        const isOutOfStock = item.stok === 0;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.nama}
                                    className="w-8 h-8 rounded-md object-cover border border-white/10"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center">
                                    <Utensils
                                      size={14}
                                      className="text-gray-500"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-white text-xs">
                                    {item.nama}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    Rp {item.harga.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                {item.kategori}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`font-black text-sm ${
                                  isOutOfStock
                                    ? "text-red-500"
                                    : isLowStock
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {item.stok}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold">
                                  <AlertTriangle size={10} /> HABIS
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                  <AlertTriangle size={10} /> MENIPIS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                  <CheckCircle2 size={10} /> AMAN
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* --- VIEW: HISTORY --- */}
          {activeTab === "history" && (
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full max-w-6xl mx-auto shadow-2xl">
              <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <History className="text-cyan-400" size={24} /> Riwayat
                    Transaksi
                  </h2>
                  <p className="text-gray-400 text-xs mt-1 font-medium">
                    Semua pesanan yang telah selesai dan dibayar.
                  </p>
                </div>
                <button
                  onClick={handlePrintHistory}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/10 text-sm"
                >
                  <Printer size={16} /> Cetak Laporan
                </button>
              </div>

              <div className="flex-1 overflow-x-auto custom-scrollbar p-6 md:p-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-white/10 bg-white/[0.01]">
                      <th className="p-5 font-bold tracking-wider rounded-tl-2xl">
                        ID
                      </th>
                      <th className="p-5 font-bold tracking-wider">
                        Tanggal & Waktu
                      </th>
                      <th className="p-5 font-bold tracking-wider">
                        Pelanggan
                      </th>
                      <th className="p-5 font-bold tracking-wider text-center">
                        Meja
                      </th>
                      <th className="p-5 font-bold tracking-wider">Kasir</th>
                      <th className="p-5 font-bold tracking-wider text-right rounded-tr-2xl">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyOrders.map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="p-5">
                          <span className="font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg text-xs border border-cyan-500/20">
                            #{h.id}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="text-white font-bold text-sm">
                            {new Date(h.tanggal).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            {new Date(h.tanggal).toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="p-5 font-bold text-white text-xs">
                          {h.nama_pelanggan}
                        </td>
                        <td className="p-5 text-center">
                          <span className="bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-xs font-bold text-gray-300">
                            {h.nomor_meja}
                          </span>
                        </td>
                        <td className="p-5 text-gray-400 text-xs">
                          {h.kasir_nama || "-"}
                        </td>
                        <td className="p-5 text-right font-black text-white text-sm">
                          Rp {h.total_harga.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL CHECKOUT --- */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full ${
                showReceipt ? "max-w-md" : "max-w-4xl"
              } bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative`}
            >
              {!showReceipt && (
                <button
                  onClick={closeModal}
                  className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-red-500/20 text-white rounded-full transition-all z-20"
                >
                  <X size={20} />
                </button>
              )}

              {!showReceipt ? (
                <div className="flex flex-col lg:flex-row h-[550px]">
                  <div className="lg:w-1/2 p-8 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col bg-[#0a0a0a]">
                    <div className="mb-6">
                      <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
                        <Receipt className="text-cyan-400" /> Detail Pesanan
                      </h2>
                      <p className="text-sm text-gray-400 font-medium">
                        Order #{selectedOrder.id} • {selectedOrder.nama_pelanggan} • Meja {selectedOrder.nomor_meja}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="space-y-4 pr-2">
                        {selectedOrder.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start"
                          >
                            <div>
                              <p className="font-bold text-sm text-white flex items-center gap-2">
                                <span>{item.jumlah}x</span> {item.menu.nama}
                              </p>
                              {/* --- LEVEL PEDAS & CATATAN PADA MODAL --- */}
                              {((item.level_pedas !== null && item.level_pedas !== undefined) || item.catatan) && (
                                <div className="flex flex-wrap gap-1 mt-1 ml-6 mb-1">
                                  {item.level_pedas !== null && item.level_pedas !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 w-max ${item.level_pedas === 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {item.level_pedas > 0 ? <><Flame size={10} /> Level {item.level_pedas}</> : "Pisah Sambal"}
                                    </span>
                                  )}
                                  {item.catatan && (
                                    <span className="text-[10px] text-gray-400 italic break-all max-w-[200px] line-clamp-2">
                                      "{item.catatan}"
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 ml-6">
                                @ Rp {item.harga_satuan.toLocaleString("id-ID")}
                              </p>
                            </div>
                            <p className="font-bold text-sm text-white mt-1">
                              Rp{" "}
                              {(item.jumlah * item.harga_satuan).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">Subtotal</span>
                        <span className="font-bold text-gray-300">
                          Rp {selectedOrder.total_harga.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="h-px bg-white/10 w-full" />
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Total Pembayaran</span>
                        <span className="text-2xl font-black text-cyan-400 tracking-tight">
                          Rp {selectedOrder.total_harga.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-1/2 p-8 flex flex-col bg-zinc-950">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <CreditCard size={20} className="text-cyan-400" /> Proses Pembayaran
                    </h3>

                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">
                          Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setPaymentMethod("CASH");
                              setUangDiterima("");
                            }}
                            className={`py-4 rounded-xl font-bold border flex flex-col items-center justify-center gap-2 transition-all ${
                              paymentMethod === "CASH"
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            <Banknote size={24} /> Uang Tunai
                          </button>
                          <button
                            onClick={() => {
                              setPaymentMethod("EWALLET");
                              setUangDiterima("");
                            }}
                            className={`py-4 rounded-xl font-bold border flex flex-col items-center justify-center gap-2 transition-all ${
                              paymentMethod === "EWALLET"
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            <LayoutGrid size={24} /> E-Wallet / QRIS
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {paymentMethod === "CASH" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-4"
                          >
                            <div>
                              <label className="text-xs font-bold text-gray-400 uppercase mb-3 block mt-2">
                                Uang Diterima
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={uangDiterima}
                                  onChange={(e) => setUangDiterima(e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white font-bold text-lg outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                                {[50000, 100000, 150000, 200000].map((amount) => (
                                  <button
                                    key={amount}
                                    onClick={() => setUangDiterima(amount.toString())}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 whitespace-nowrap transition-colors"
                                  >
                                    {amount.toLocaleString("id-ID")}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setUangDiterima(selectedOrder.total_harga.toString())}
                                  className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs font-bold text-cyan-400 whitespace-nowrap transition-colors"
                                >
                                  Uang Pas
                                </button>
                              </div>
                            </div>

                            <div
                              className={`p-5 rounded-2xl border transition-all ${
                                uangDiterima && !isCashValid
                                  ? "bg-red-500/10 border-red-500/30"
                                  : uangDiterima
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-white/5 border-white/10"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-400">Kembalian</span>
                                {!isCashValid && uangDiterima && (
                                  <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                                    Uang Kurang!
                                  </span>
                                )}
                              </div>
                              <p className={`text-3xl font-black ${uangDiterima && !isCashValid ? "text-red-400" : uangDiterima ? "text-emerald-400" : "text-gray-500"}`}>
                                Rp {kembalian.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {paymentMethod === "EWALLET" && (
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-4 text-gray-400">
                          <div className="p-3 bg-white/10 rounded-xl">
                            <LayoutGrid size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">Pembayaran Non-Tunai</p>
                            <p className="text-xs mt-1">Pastikan pelanggan sudah melakukan scan QRIS atau transfer sebelum menyelesaikan pesanan.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleFinalSubmit}
                      disabled={!isCashValid}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm mt-6 flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 ${
                        isCashValid
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
                          : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
                      }`}
                    >
                      <CheckCircle2 size={20} /> Selesaikan Pembayaran
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 md:p-12 text-center bg-zinc-950 flex flex-col items-center">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-50" />
                    <CheckCircle2 size={48} className="text-emerald-400 relative z-10" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">
                    Pembayaran Berhasil!
                  </h2>
                  <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
                    Pesanan #{selectedOrder.id} atas nama {selectedOrder.nama_pelanggan} telah selesai.
                  </p>

                  <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 mb-8 w-full max-w-sm text-left">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-400">Total Tagihan</span>
                      <span className="font-bold text-white">
                        Rp {selectedOrder.total_harga.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Metode</span>
                      <span className="font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded text-xs">
                        {selectedOrder.metode_pembayaran}
                      </span>
                    </div>
                    {selectedOrder.metode_pembayaran === "CASH" && (
                      <>
                        <div className="flex justify-between text-sm mt-3 pt-3 border-t border-white/10 mb-1">
                          <span className="text-gray-400">Uang Diterima</span>
                          <span className="font-bold text-white">
                            Rp{" "}
                            {(selectedOrder.uang_bayar ?? 0).toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t border-white/10">
                          <span className="text-gray-400">Kembalian</span>
                          <span className="font-black text-emerald-400 text-base">
                            Rp{" "}
                            {(selectedOrder.kembalian ?? 0).toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 w-full max-w-sm">
                    <button
                      onClick={handlePrintReceipt}
                      className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-cyan-500/20 transition-colors"
                    >
                      <Printer size={18} /> Cetak Struk
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                    >
                      Tutup
                    </button>
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
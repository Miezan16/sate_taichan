"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Utensils,
  Search,
  Flame,
  X,
  Plus,
  Trash2,
  Minus,
  ShoppingCart,
  ArrowRight,
  Loader2,
  Star,
  MapPin,
  Info,
  ChevronRight,
  Clock,
  ChefHat,
  Map,
  Instagram,
  PhoneCall,
  CheckCircle2,
  Quote,
  HeartPulse,
  Award,
} from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

// --- 1. DEFINISI TIPE DATA ---
interface MenuItem {
  id: number;
  nama: string;
  deskripsi: string;
  harga: number;
  image: string;
  kategori: string;
}

interface CartItem extends MenuItem {
  qty: number;
}

// --- 2. KONSTANTA ---
const CATEGORIES = ["All", "Sate", "Karbo", "Camilan", "Minuman"];
const AVAILABLE_TABLES = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString(),
);

// --- SUB-COMPONENTS ---
const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? "bg-gradient-to-br from-[#C1121F] to-red-800 text-white shadow-[0_0_20px_rgba(193,18,31,0.5)] scale-110" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
    title={label}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="absolute left-16 bg-[#1a1a1a] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all border border-white/10 whitespace-nowrap z-50 shadow-xl font-medium translate-x-[-10px] group-hover:translate-x-0">
      {label}
    </span>
  </button>
);

export default function CustomerOrderPage() {
  const [activeTab, setActiveTab] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // --- STATE MENU DARI DATABASE ---
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // --- STATE CART & POPUP ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMenuToAdd, setSelectedMenuToAdd] = useState<MenuItem | null>(
    null,
  );
  const [addQty, setAddQty] = useState(1);

  // --- CHECKOUT STATES ---
  const [checkoutStep, setCheckoutStep] = useState<
    "cart" | "form" | "waiting" | "success"
  >("cart");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);

  const cartTotal = cart.reduce(
    (total, item) => total + item.harga * item.qty,
    0,
  );
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);

  // --- FETCH DATA MENU DARI API ---
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error("Gagal mengambil data menu");
        const data = await res.json();
        setMenus(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenus();
  }, []);

  // --- LOGIKA PESANAN & CART ---
  const confirmAddToCart = () => {
    if (!selectedMenuToAdd) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === selectedMenuToAdd.id);
      if (existing)
        return prev.map((item) =>
          item.id === selectedMenuToAdd.id
            ? { ...item, qty: item.qty + addQty }
            : item,
        );
      return [...prev, { ...selectedMenuToAdd, qty: addQty }];
    });
    setSelectedMenuToAdd(null);
    setAddQty(1);
  };

  const removeFromCart = (menuId: number) =>
    setCart((prev) => prev.filter((item) => item.id !== menuId));

  const submitOrder = async () => {
    if (!customerName.trim() || !tableNumber.trim())
      return alert("Harap isi Nama dan pilih Nomor Meja!");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_pelanggan: customerName,
          nomor_meja: tableNumber,
          total_harga: cartTotal,
          items: cart.map((item) => ({
            menu_id: item.id,
            jumlah: item.qty,
            harga_satuan: item.harga,
          })),
        }),
      });

      if (!response.ok) throw new Error("Gagal");
      const data = await response.json();
      if (data && data.id) setSubmittedOrderId(data.id);

      setCheckoutStep("waiting");
      setCart([]);
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EFEK POLLING STATUS PESANAN ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkoutStep === "waiting" && submittedOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/transaksi", { cache: "no-store" });
          const data = await res.json();
          const myOrder = data.find((o: any) => o.id === submittedOrderId);
          if (myOrder && myOrder.status !== "PENDING") {
            setCheckoutStep("success");
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Gagal mengecek status:", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [checkoutStep, submittedOrderId]);

  const handleCloseModal = () => {
    setIsCartOpen(false);
    if (checkoutStep === "success") {
      setCheckoutStep("cart");
      setCustomerName("");
      setTableNumber("");
      setSubmittedOrderId(null);
    }
  };

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || menu.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- VIEW RENDERERS ---

  const renderHome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden min-h-[450px] group flex items-end p-8 md:p-12 shadow-[0_20px_50px_rgba(193,18,31,0.15)] border border-white/5">
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6 border border-white/20 shadow-lg"
            >
              <Star className="text-yellow-400 fill-yellow-400" size={16} />
              <span className="text-white text-xs font-bold tracking-widest uppercase">
                The Best Taichan in Town
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl"
            >
              Sate Taichan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] to-red-500">
                Premium.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed"
            >
              Sensasi gurih, pedas, dan perasan jeruk nipis segar yang menggugah
              selera. Dibakar sempurna di atas arang batok kelapa khusus
              untukmu.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setActiveTab("Menu")}
              className="bg-gradient-to-r from-[#C1121F] to-red-700 hover:from-red-600 hover:to-red-800 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(193,18,31,0.4)] flex items-center gap-3 group/btn"
            >
              Lihat Menu{" "}
              <ArrowRight
                size={20}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-[#C1121F]/50 transition-colors group shadow-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-[#C1121F]/20 to-transparent rounded-2xl flex items-center justify-center text-[#C1121F] group-hover:scale-110 transition-transform">
            <Flame size={26} />
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">100% Daging Segar</h4>
            <p className="text-sm text-gray-400">
              Kualitas premium setiap hari
            </p>
          </div>
        </div>
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-[#C1121F]/50 transition-colors group shadow-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-[#C1121F]/20 to-transparent rounded-2xl flex items-center justify-center text-[#C1121F] group-hover:scale-110 transition-transform">
            <Clock size={26} />
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">Buka Tiap Hari</h4>
            <p className="text-sm text-gray-400">16.00 WIB - 23.00 WIB</p>
          </div>
        </div>
        <div
          className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-[#C1121F]/50 transition-colors cursor-pointer group shadow-lg"
          onClick={() => setActiveTab("Location")}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-[#C1121F]/20 to-transparent rounded-2xl flex items-center justify-center text-[#C1121F] group-hover:scale-110 transition-transform">
            <MapPin size={26} />
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">Lokasi Kami</h4>
            <p className="text-sm text-[#C1121F] font-semibold flex items-center gap-1">
              Lihat Peta <ChevronRight size={14} />
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Header Menu */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 bg-gradient-to-br from-[#0a0a0a] to-[#111] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-[#C1121F]/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">
            Menu
          </h2>
          <p className="text-gray-400 font-medium">
            Pilih hidangan favoritmu, kami antarkan ke meja.
          </p>
        </div>
        <div className="relative w-full lg:w-96 z-10">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari sate, minuman, dll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-[#C1121F] focus:ring-1 focus:ring-[#C1121F] transition-all placeholder:text-gray-500 shadow-inner"
          />
        </div>
      </div>

      {/* Filter & Cart Header */}
      <div className="flex justify-between items-center gap-4 sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl py-4 -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-white/5 lg:border-none">
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 w-full mask-linear-fade">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all border whitespace-nowrap ${selectedCategory === cat ? "bg-[#C1121F] text-white border-[#C1121F] shadow-[0_4px_15px_rgba(193,18,31,0.3)]" : "bg-[#111] text-gray-400 border-white/5 hover:border-white/20 hover:text-white"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex-shrink-0 w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-[#C1121F]/50 rounded-full text-white transition-all group shadow-lg"
        >
          <ShoppingCart
            size={22}
            className="mx-auto group-hover:scale-110 transition-transform"
          />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#C1121F] text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#050505] shadow-lg">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Loading & Menu Grid */}
      {isLoadingMenu ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#C1121F] mb-4" size={40} />
          <p className="text-gray-400">Menata menu estetik di meja Anda...</p>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Utensils size={64} className="mb-4 text-gray-600" />
          <p className="text-gray-400">Menu tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          {filteredMenus.map((menu) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={menu.id}
              className="bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/5 group hover:border-[#C1121F]/50 transition-all flex flex-col relative shadow-xl hover:shadow-[#C1121F]/20"
            >
              <div className="h-56 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                <img
                  src={
                    menu.image ||
                    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000"
                  }
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={menu.nama}
                />
                <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                  <span className="text-white font-black text-sm tracking-widest">
                    Rp{menu.harga.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1 relative z-20 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent -mt-10 pt-10">
                <h4 className="font-black text-white text-xl mb-2 leading-tight tracking-tight">
                  {menu.nama}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-2 mb-6 leading-relaxed">
                  {menu.deskripsi}
                </p>
                <button
                  onClick={() => {
                    setSelectedMenuToAdd(menu);
                    setAddQty(1);
                  }}
                  className="mt-auto w-full bg-white/5 hover:bg-gradient-to-r hover:from-[#C1121F] hover:to-red-700 border border-white/10 hover:border-transparent text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 group/add shadow-lg"
                >
                  <Plus
                    size={18}
                    className="group-hover/add:rotate-90 transition-transform"
                  />{" "}
                  Tambah
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderLocation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
          Lokasi <span className="text-[#C1121F]">Kami</span>
        </h2>
        <p className="text-gray-400">
          Temukan kedai kami dan nikmati sate langsung dari pemanggang.
        </p>
      </div>
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="h-[400px] bg-[#111] relative flex items-center justify-center border-b border-white/5">
          <Map className="text-gray-600 absolute opacity-20" size={150} />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="relative z-10 bg-black/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 text-center max-w-sm shadow-2xl">
            <div className="w-16 h-16 bg-[#C1121F] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(193,18,31,0.5)]">
              <MapPin className="text-white" size={32} />
            </div>
            <h3 className="text-white font-black text-xl mb-2 tracking-tight">
              Taichan Premium Pusat
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Jl. Sate Taichan No. 99, Jakarta Selatan, Indonesia
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4 text-gray-300">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <Clock className="text-[#C1121F]" size={24} />
              </div>
              <div>
                <p className="font-bold text-white text-lg tracking-tight">
                  Jam Operasional
                </p>
                <p className="text-sm mt-1 text-gray-400">
                  Senin - Minggu: 16.00 - 23.00 WIB
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-gray-300">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <PhoneCall className="text-[#C1121F]" size={24} />
              </div>
              <div>
                <p className="font-bold text-white text-lg tracking-tight">
                  Telepon / Reservasi
                </p>
                <p className="text-sm mt-1 text-gray-400">+62 812 3456 7890</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 flex flex-col justify-center">
            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-black tracking-widest uppercase transition-all flex justify-center items-center gap-3 shadow-lg hover:shadow-white/5">
              <MapPin size={18} /> Google Maps
            </button>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white py-4 rounded-2xl font-black tracking-widest uppercase transition-all flex justify-center items-center gap-3 shadow-lg shadow-pink-500/20">
              <Instagram size={18} /> @taichanpremium
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAbout = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24"
    >
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4 drop-shadow-lg">
          The Taichan <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] to-red-500">
            Experience.
          </span>
        </h2>
        <p className="text-gray-400 font-medium text-lg max-w-2xl">
          Lebih dari sekadar sate. Ini adalah perpaduan rasa estetis, teknik
          pembakaran yang presisi, dan dedikasi penuh pada kualitas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="md:col-span-2 relative bg-[#0a0a0a] rounded-[3rem] p-10 md:p-12 border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group flex flex-col justify-end min-h-[400px]"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-[#C1121F] to-red-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-red-500/30">
              <Quote size={28} className="text-white fill-white" />
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Mendefinisikan <br />
              Ulang Makna Sate.
            </h3>
            <p className="text-gray-300 max-w-xl leading-relaxed text-base md:text-lg">
              Kami menghilangkan bumbu kacang yang berat, dan membiarkan
              kualitas daging ayam segar berbicara. Dipadukan dengan asamnya
              perasan jeruk nipis dan tamparan pedas sambal murni.
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="col-span-1 bg-gradient-to-b from-[#1a0505] to-[#0a0a0a] rounded-[3rem] p-10 border border-red-900/30 shadow-2xl flex flex-col relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C1121F]/20 blur-[60px] group-hover:bg-[#C1121F]/40 transition-colors" />
          <Flame
            className="text-[#C1121F] mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(193,18,31,0.5)]"
            size={40}
          />
          <h3 className="text-2xl font-black text-white mb-3 relative z-10 tracking-tight">
            100% Rawit Merah
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed relative z-10">
            Sambal iblis kami dibuat segar setiap hari. Tanpa saus kemasan,
            tanpa bubuk cabai buatan. Hanya rawit merah pilihan yang siap
            membakar lidah Anda dengan cara yang sangat nikmat.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="col-span-1 bg-gradient-to-b from-[#051a10] to-[#0a0a0a] rounded-[3rem] p-10 border border-emerald-900/30 shadow-2xl flex flex-col relative overflow-hidden group"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/10 blur-[60px] group-hover:bg-emerald-500/20 transition-colors" />
          <HeartPulse
            className="text-emerald-400 mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
            size={40}
          />
          <h3 className="text-2xl font-black text-white mb-3 relative z-10 tracking-tight">
            Protein Maksimal
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed relative z-10">
            Lebih sehat dan *clean* dari sate biasa. Dibakar murni tanpa baluran
            kecap tebal. Pilihan paling cerdas dan estetik untuk nutrisi harian
            otot Anda.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="md:col-span-2 bg-[#0a0a0a] rounded-[3rem] p-10 border border-white/5 shadow-2xl flex flex-col md:flex-row gap-10 items-center relative overflow-hidden group"
        >
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/5 blur-[100px]" />
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <Award className="text-yellow-500" size={28} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">
                Arang Batok Kelapa
              </h3>
            </div>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Rahasia aroma <span className="text-white font-bold italic">smokey</span> yang magis tidak datang dari pemanggang gas modern. Kami bertahan menggunakan 100% arang batok kelapa alami yang menyegel sari pati daging.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <CheckCircle2 size={20} className="text-[#C1121F] mb-2" />
                <p className="text-white font-bold text-sm">Panas 500°C</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <CheckCircle2 size={20} className="text-[#C1121F] mb-2" />
                <p className="text-white font-bold text-sm">Bebas Kimia</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-5/12 aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 relative shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              alt="Grilling"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] selection:bg-[#C1121F] selection:text-white font-sans overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C1121F]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex h-screen">
        <aside className="hidden lg:flex fixed left-6 top-6 bottom-6 w-24 bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] flex-col items-center py-8 gap-8 z-40 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#C1121F] to-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(193,18,31,0.5)]">
            <Flame size={28} className="text-white" />
          </div>
          <div className="flex flex-col gap-6 w-full px-2 flex-1 mt-4">
            <SidebarItem
              icon={Home}
              label="Beranda"
              active={activeTab === "Home"}
              onClick={() => setActiveTab("Home")}
            />
            <SidebarItem
              icon={Utensils}
              label="Menu"
              active={activeTab === "Menu"}
              onClick={() => setActiveTab("Menu")}
            />
            <div className="w-10 h-px bg-white/10 mx-auto my-2" />
            <SidebarItem
              icon={MapPin}
              label="Lokasi"
              active={activeTab === "Location"}
              onClick={() => setActiveTab("Location")}
            />
            <SidebarItem
              icon={Info}
              label="Tentang"
              active={activeTab === "About"}
              onClick={() => setActiveTab("About")}
            />
          </div>
        </aside>

        <div className="lg:hidden fixed bottom-6 left-6 right-6 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 z-40 flex justify-between shadow-2xl">
          <div className="flex justify-around flex-1">
            <SidebarItem
              icon={Home}
              label="Home"
              active={activeTab === "Home"}
              onClick={() => setActiveTab("Home")}
            />
            <SidebarItem
              icon={Utensils}
              label="Menu"
              active={activeTab === "Menu"}
              onClick={() => setActiveTab("Menu")}
            />
            <SidebarItem
              icon={MapPin}
              label="Lokasi"
              active={activeTab === "Location"}
              onClick={() => setActiveTab("Location")}
            />
            <SidebarItem
              icon={Info}
              label="About"
              active={activeTab === "About"}
              onClick={() => setActiveTab("About")}
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto lg:pl-40 lg:pr-12 px-5 pt-10 pb-32 w-full max-w-[1500px] mx-auto scrollbar-hide">
          {activeTab === "Home" && renderHome()}
          {activeTab === "Menu" && renderMenu()}
          {activeTab === "Location" && renderLocation()}
          {activeTab === "About" && renderAbout()}
        </main>
      </div>

      {/* --- MODAL POP-UP ADD QUANTITY --- */}
      <AnimatePresence>
        {selectedMenuToAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMenuToAdd(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[90] overflow-hidden flex flex-col"
            >
              <div className="relative h-48 w-full">
                <img
                  src={
                    selectedMenuToAdd.image ||
                    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80"
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                <button
                  onClick={() => setSelectedMenuToAdd(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-8 -mt-10 relative z-10 flex flex-col items-center text-center">
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                  {selectedMenuToAdd.nama}
                </h3>
                <p className="text-[#C1121F] font-black text-xl mb-8">
                  Rp {selectedMenuToAdd.harga.toLocaleString()}
                </p>

                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">
                  Atur Porsi
                </p>
                <div className="flex items-center gap-6 bg-[#111] p-2 rounded-full border border-white/10 mb-8">
                  <button
                    onClick={() => setAddQty(Math.max(1, addQty - 1))}
                    className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-black text-white w-8 text-center">
                    {addQty}
                  </span>
                  <button
                    onClick={() => setAddQty(addQty + 1)}
                    className="w-12 h-12 bg-gradient-to-br from-[#C1121F] to-red-800 rounded-full flex items-center justify-center hover:scale-105 text-white transition-all shadow-lg shadow-red-500/30"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <button
                  onClick={confirmAddToCart}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
                >
                  Selesai & Tambahkan - Rp{" "}
                  {(selectedMenuToAdd.harga * addQty).toLocaleString()}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MODAL CART & CHECKOUT --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={
                checkoutStep !== "waiting" ? handleCloseModal : undefined
              }
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/5 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">
                    {checkoutStep === "cart" && "Keranjang"}
                    {checkoutStep === "form" && "Detail Pemesan"}
                    {checkoutStep === "waiting" && "Memproses"}
                    {checkoutStep === "success" && "Selesai"}
                  </h3>
                  {checkoutStep !== "waiting" && (
                    <button
                      onClick={handleCloseModal}
                      className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/10 -z-10" />
                  {["cart", "form", "waiting"].map((step, idx) => {
                    const stepOrder = ["cart", "form", "waiting", "success"];
                    const currentIdx = stepOrder.indexOf(checkoutStep);
                    const isActive = currentIdx >= idx;
                    return (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${isActive ? "bg-[#C1121F] border-[#C1121F] text-white shadow-[0_0_15px_rgba(193,18,31,0.5)]" : "bg-[#111] border-white/20 text-gray-500"}`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {checkoutStep === "cart" && (
                  <div className="space-y-4">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full mt-32 opacity-50">
                        <ShoppingCart
                          size={64}
                          className="mb-4 text-gray-600"
                        />
                        <p className="text-gray-400 font-medium">
                          Keranjang masih kosong
                        </p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={item.id}
                          className="bg-white/5 border border-white/5 p-3 rounded-2xl flex gap-4 items-center group"
                        >
                          <img
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=100"
                            }
                            className="w-16 h-16 rounded-xl object-cover"
                            alt=""
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-sm mb-1">
                              {item.nama}
                            </h4>
                            <p className="text-[#C1121F] font-black text-sm">
                              Rp{item.harga.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 bg-[#050505] px-2 py-1.5 rounded-lg border border-white/10">
                            <span className="text-xs font-bold text-white px-2">
                              {item.qty}x
                            </span>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors mr-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {checkoutStep === "form" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Info size={14} className="text-[#C1121F]" /> Nama
                        Pemesan
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Budi Taichan"
                        className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-[#C1121F] focus:ring-1 focus:ring-[#C1121F] outline-none transition-all placeholder:font-normal placeholder:text-gray-600"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#C1121F]" /> Pilih
                          Meja
                        </span>
                        <span className="text-[#C1121F] bg-[#C1121F]/10 px-2 py-1 rounded-md">
                          {tableNumber ? `Meja ${tableNumber}` : "Wajib Diisi"}
                        </span>
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {AVAILABLE_TABLES.map((t) => (
                          <button
                            key={t}
                            onClick={() => setTableNumber(t)}
                            className={`py-4 rounded-2xl font-black text-center border transition-all duration-300 ${tableNumber === t ? "bg-gradient-to-br from-[#C1121F] to-red-700 border-[#C1121F] text-white shadow-[0_5px_20px_rgba(193,18,31,0.4)] scale-105" : "bg-[#111] border-white/5 text-gray-500 hover:border-white/20 hover:text-white hover:bg-white/5"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {checkoutStep === "waiting" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center space-y-8"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#C1121F] blur-[60px] opacity-30 rounded-full animate-pulse"></div>
                      <div className="w-24 h-24 bg-[#111] border border-white/10 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                        <Loader2
                          className="animate-spin text-[#C1121F]"
                          size={40}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white text-2xl font-black mb-3 uppercase tracking-wide">
                        Menunggu Kasir
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed px-6">
                        Pesanan dikirim ke sistem. Jangan tutup halaman ini
                        sampai status berubah.
                      </p>
                    </div>
                  </motion.div>
                )}

                {checkoutStep === "success" && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center space-y-8"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 blur-[60px] opacity-20 rounded-full"></div>
                      <div className="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 relative z-10">
                        <ChefHat className="text-green-400" size={56} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 text-3xl font-black mb-3 uppercase tracking-wide">
                        Diterima!
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed px-6 mb-8">
                        Koki kami sedang menyiapkan sate terenak untuk Anda.
                        Silakan duduk manis di{" "}
                        <span className="text-white font-black bg-white/10 px-2 py-1 rounded">
                          Meja {tableNumber}
                        </span>
                        .
                      </p>
                      <button
                        onClick={handleCloseModal}
                        className="w-full px-8 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                        Tutup Layar
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {cart.length > 0 &&
                checkoutStep !== "waiting" &&
                checkoutStep !== "success" && (
                  <div className="p-6 bg-[#050505] border-t border-white/5 space-y-5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Total Bayar
                      </span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] to-red-500">
                        Rp{cartTotal.toLocaleString()}
                      </span>
                    </div>

                    {checkoutStep === "cart" ? (
                      <button
                        onClick={() => setCheckoutStep("form")}
                        className="w-full bg-gradient-to-r from-[#C1121F] to-red-700 hover:from-red-600 hover:to-red-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(193,18,31,0.2)]"
                      >
                        Lanjut Pembayaran
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCheckoutStep("cart")}
                          className="w-16 h-16 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                        >
                          <ArrowRight size={22} className="rotate-180" />
                        </button>
                        <button
                          onClick={submitOrder}
                          disabled={
                            isSubmitting || !tableNumber || !customerName
                          }
                          className="flex-1 bg-white text-black hover:bg-gray-200 py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            "Kirim ke Kasir"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ChatWidget />
    </div>
  );
}
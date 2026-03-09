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
  stok: number;
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
    className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
      active
        ? "bg-gradient-to-br from-[#C1121F] to-red-800 text-white shadow-[0_0_20px_rgba(193,18,31,0.5)] scale-110"
        : "text-gray-400 hover:bg-white/10 hover:text-white"
    }`}
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

  // --- STATE MEJA TERISI ---
  const [occupiedTables, setOccupiedTables] = useState<string[]>([]);

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

  // --- HELPER: UPDATE STOCK ---
  const adjustStock = (id: number, delta: number) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, stok: Math.max(0, m.stok + delta) } : m,
      ),
    );
  };

  // --- FETCH DATA MENU DARI API ---
  const fetchMenus = async () => {
    try {
      // DITAMBAHKAN { cache: "no-store" } AGAR SELALU AMBIL DATA TERBARU DARI ADMIN
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data menu");
      const data = await res.json();
      setMenus(data.map((item: any) => ({ ...item, stok: item.stok ?? 99 })));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // --- FETCH STATUS MEJA YANG TERISI ---
  const fetchOccupiedTables = async () => {
    try {
      const res = await fetch("/api/transaksi", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const activeOrders = data.filter(
          (order: any) => order.status !== "COMPLETED",
        );
        const occupied = activeOrders.map((order: any) => order.nomor_meja);
        setOccupiedTables(occupied);
      }
    } catch (error) {
      console.error("Gagal menarik data status meja:", error);
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchOccupiedTables();

    const interval = setInterval(() => {
      fetchOccupiedTables();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // --- LOGIKA PESANAN & CART ---
  const confirmAddToCart = () => {
    if (!selectedMenuToAdd) return;
    if (selectedMenuToAdd.stok < addQty) {
      alert("Stok tidak mencukupi!");
      return;
    }

    adjustStock(selectedMenuToAdd.id, -addQty);

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

  const removeFromCart = (menuId: number) => {
    const item = cart.find((i) => i.id === menuId);
    if (item) {
      adjustStock(menuId, item.qty);
      setCart((prev) => prev.filter((item) => item.id !== menuId));
    }
  };

  const updateCartQty = (item: CartItem, delta: number) => {
    if (delta > 0) {
      const currentMenu = menus.find((m) => m.id === item.id);
      if (!currentMenu || currentMenu.stok < 1) {
        alert("Stok habis!");
        return;
      }
      adjustStock(item.id, -1);
    } else {
      adjustStock(item.id, 1);
    }

    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === item.id) {
            const newQty = i.qty + delta;
            return { ...i, qty: newQty };
          }
          return i;
        })
        .filter((i) => i.qty > 0),
    );
  };

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
      fetchOccupiedTables();
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim pesanan.");
      cart.forEach((item) => adjustStock(item.id, item.qty));
      setCart([]);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          console.error("Gagal mengecek status: ", error);
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
      <div className="relative rounded-[3rem] overflow-hidden h-[500px] flex items-center justify-center">
        {/* FOTO HERO: Sate Aesthetic dari Unsplash */}
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Sate Sadjodo Taichan"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/50 to-transparent" />
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between md:items-end gap-6 px-6">
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
              Sate Sadjodo <br />
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
            <h4 className="text-white font-bold text-lg">Penyajian Cepat</h4>
            <p className="text-sm text-gray-400">
              Dimasak langsung saat dipesan
            </p>
          </div>
        </div>
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-[#C1121F]/50 transition-colors group shadow-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-[#C1121F]/20 to-transparent rounded-2xl flex items-center justify-center text-[#C1121F] group-hover:scale-110 transition-transform">
            <HeartPulse size={26} />
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">Sambal Spesial</h4>
            <p className="text-sm text-gray-400">Resep rahasia pedas nendang</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] md:text-xs font-black text-[#C1121F] tracking-[0.2em] uppercase mb-2 block bg-red-500/10 w-fit px-3 py-1 rounded-md border border-red-500/20">
            Menu Spesial Sate Sadjodo
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            LIST MENU <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] to-red-800">SADJODO</span>
          </h2>
          <p className="text-gray-400 font-medium">
            Dari yang pedas membakar sampai yang manis menyegarkan.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-full px-5 py-3 shadow-lg w-full md:w-auto focus-within:border-white/20 transition-all">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Cari sate, minum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full md:w-48 placeholder:text-gray-600 font-medium"
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                : "bg-[#0a0a0a] border border-white/10 text-gray-400 hover:bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoadingMenu ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#C1121F] mb-4" size={40} />
          <p className="text-gray-400 font-medium">Memanaskan panggangan...</p>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Utensils size={48} className="mb-4 opacity-20" />
          <p className="font-bold">Menu tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          {filteredMenus.map((menu) => {
            const isOutOfStock = menu.stok <= 0;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={menu.id}
                className={`bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-white/10 transition-all shadow-xl flex flex-col ${
                  isOutOfStock ? "opacity-50 grayscale" : ""
                }`}
              >
                <div className="relative h-48 overflow-hidden bg-[#111]">
                  <img
                    src={
                      menu.image ||
                      "https://images.unsplash.com/photo-1628294895950-9805252327bc?q=80&w=1000"
                    }
                    alt={menu.nama}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Flame
                      size={14}
                      className={isOutOfStock ? "text-gray-500" : "text-[#C1121F]"}
                    />
                    <span
                      className={`text-xs font-black ${
                        isOutOfStock ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {isOutOfStock ? "HABIS" : `Sisa ${menu.stok}`}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg text-white leading-tight">
                      {menu.nama}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2 mb-6 flex-1">
                    {menu.deskripsi}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-xl font-black text-white">
                      <span className="text-sm text-gray-500 font-medium mr-1">
                        Rp
                      </span>
                      {menu.harga.toLocaleString("id-ID")}
                    </p>
                    <button
                      onClick={() =>
                        !isOutOfStock && setSelectedMenuToAdd(menu)
                      }
                      disabled={isOutOfStock}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                        isOutOfStock
                          ? "bg-white/5 text-gray-600 cursor-not-allowed"
                          : "bg-white text-black hover:bg-gray-200 shadow-white/10"
                      }`}
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const renderLocation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* KOLOM KIRI: ALAMAT CABANG & INFO KONTAK */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
            <div>
              <h2 className="text-4xl font-black text-white mb-3">Kunjungi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] to-red-500">Cabang Kami.</span></h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Pilih cabang terdekat dari lokasi Anda. Nikmati sate taichan otentik langsung dari pemanggang kami dalam suasana yang nyaman.
              </p>
            </div>

            <div className="space-y-4">
              {/* CABANG RANCAMANYAR - DENGAN LINK GOOGLE MAPS ASLI */}
              <a
                href="https://maps.app.goo.gl/Bg9c4Gz2S8m3qThX9"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/5 hover:border-red-500/30 transition-all duration-300 group cursor-pointer shadow-lg"
              >
                <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1 group-hover:text-red-400 transition-colors">
                    Cabang Rancamanyar
                  </h3>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Jl. Bojong Koneng, Rancamanyar, Kec. Baleendah, Kabupaten
                    Bandung, Jawa Barat 40375
                  </p>
                </div>
              </a>

              {/* CABANG GADING TUTUKA - DENGAN LINK GOOGLE MAPS ASLI */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sate+Sadjodo+Gading+Tutuka+Soreang" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/5 hover:border-red-500/30 transition-all duration-300 group cursor-pointer shadow-lg"
              >
                <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1 group-hover:text-red-400 transition-colors">
                    Cabang Gading Tutuka
                  </h3>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    XGHR+3Q7, Jl. Raya Gading Tutuka, Cingcin, Kec. Soreang,
                    Kabupaten Bandung, Jawa Barat
                  </p>
                </div>
              </a>
            </div>

            {/* MINI CARDS UNTUK IG & WA */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-[#C1121F]/10 to-[#0a0a0a] border border-[#C1121F]/20 p-4 rounded-2xl flex items-center gap-3 hover:border-[#C1121F]/50 transition-all shadow-lg group cursor-pointer"
              >
                <div className="w-10 h-10 bg-[#C1121F] rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] uppercase tracking-widest font-bold mb-0.5">Reservasi / WA</p>
                  <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors">Hubungi</h3>
                </div>
              </a>

              <a
                href="https://www.instagram.com/sate.sadjodo?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 border border-purple-500/20 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500/50 transition-all shadow-lg group cursor-pointer"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform">
                  <Instagram size={20} />
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] uppercase tracking-widest font-bold mb-0.5">Instagram</p>
                  <h3 className="text-sm font-black text-white group-hover:text-pink-300 transition-colors">@sate.sadjodo</h3>
                </div>
              </a>
            </div>
        </div>

        {/* KOLOM KANAN: GAMBAR RESTORAN / VIBE */}
        <div className="lg:col-span-3 bg-[#0a0a0a] rounded-[3rem] overflow-hidden border border-white/5 relative h-[400px] lg:h-full min-h-[400px] shadow-2xl group">
           <img 
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt="Suasana Sate Sadjodo" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent pointer-events-none" />
           <div className="absolute bottom-8 left-8 right-8 z-10">
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Buka Setiap Hari</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">Suasana Hangat & Nyaman</h3>
              <p className="text-gray-200 text-sm max-w-md drop-shadow-md leading-relaxed">Tempat yang pas untuk bersantai, berbincang, dan menikmati hidangan sate taichan otentik bersama keluarga atau teman terdekat Anda.</p>
           </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAbout = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16 pb-24"
    >
      {/* HERO ABOUT (MENGGUNAKAN GAMBAR LOKAL) */}
      <div className="text-center max-w-3xl mx-auto pt-10 px-4 relative overflow-hidden rounded-[3rem]">
        {/* FILE LOKAL: /taichan-sate.png */}
        <img src="/taichan-sate.png" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110" alt=""/>
        <div className="relative z-10 p-10">
          <span className="text-[#C1121F] font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Cerita Kami</span>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Rasa <span className="text-[#C1121F]">Sadjodo.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Berawal dari kecintaan pada kuliner pedas gurih, kami meracik resep
            taichan yang tidak hanya membakar lidah, tetapi juga meninggalkan
            kenangan. Setiap tusuk adalah dedikasi kami untuk kualitas dan kepuasan pelanggan.
          </p>
        </div>
      </div>

      {/* SECTION 1: PEMBAKARAN (MENGGUNAKAN GAMBAR LOKAL: taichan-sate.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-0">
        <div className="order-2 lg:order-1 space-y-6 lg:pr-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-2 border border-red-500/20 shadow-[0_0_15px_rgba(193,18,31,0.3)]">
             <Flame className="text-[#C1121F]" size={32} />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
             Seni Memanggang <br/> <span className="text-[#C1121F]">Arang Batok</span>
          </h3>
          <p className="text-gray-400 leading-relaxed text-base">
             Kami menggunakan 100% daging ayam segar pilihan yang dimarinasi
             dengan bumbu rempah rahasia. Proses pemanggangan menggunakan arang 
             batok kelapa khusus memastikan tingkat kematangan sempurna, <span className="text-white italic">juicy</span> 
             di dalam, dengan aroma <span className="text-white font-bold">smoky</span> yang khas Sate Sadjodo.
          </p>
        </div>
        <div className="relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group h-[400px] order-1 lg:order-2 border border-white/5">
          {/* FILE LOKAL: /taichan-sate.png */}
          <img 
            src="/taichan-sate.png" 
            alt="Grilling Sate Sadjodo Taichan" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#050505]/60 via-transparent to-transparent"></div>
        </div>
      </div>

      {/* SECTION 2: SAMBAL (MENGGUNAKAN GAMBAR LOKAL: taichan-sambal.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-0">
        <div className="relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group h-[400px] border border-white/5">
          {/* FILE LOKAL: /taichan-sambal.png */}
          <img 
            src="/taichan-sambal.png" 
            alt="Sambal Rawit Merah Sadjodo" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-tl from-[#C1121F]/40 via-transparent to-transparent"></div>
        </div>
        <div className="space-y-6 lg:pl-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-2 border border-red-500/20 shadow-[0_0_15px_rgba(193,18,31,0.3)]">
             <HeartPulse className="text-[#C1121F]" size={32} />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
             Sengatan Asli <br/> <span className="text-[#C1121F]">Tanpa Pengawet</span>
          </h3>
          <p className="text-gray-400 leading-relaxed text-base">
             Sambal andalan kami diulek segar setiap hari. Tanpa saus kemasan,
             dan tanpa bubuk cabai buatan. Hanya cabai rawit merah segar pilihan terbaik yang disiapkan
             untuk membakar lidah Anda dengan sensasi pedas gurih yang bikin nagih.
          </p>
        </div>
      </div>

      {/* AWARDS / STATS */}
      <div className="bg-gradient-to-r from-[#0a0a0a] to-[#111] border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-10 w-40 h-40 bg-yellow-500/10 blur-[50px]"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]">
            <Award className="text-white" size={40} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">Rasa Premium</h4>
            <p className="text-gray-400 text-sm">Pilihan Utama Pencinta Kuliner Taichan</p>
          </div>
        </div>
        <div className="text-center md:text-right relative z-10">
          <p className="text-4xl font-black text-white mb-1">Top <span className="text-[#C1121F]">Quality</span></p>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
            Bahan Baku & Pelayanan
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-[#C1121F]/30 flex relative">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex w-28 bg-[#0a0a0a]/80 backdrop-blur-3xl border-r border-white/5 flex-col items-center py-10 z-40 fixed h-full shadow-2xl">
        <div className="mb-12 flex flex-col items-center gap-2 group mt-2">
          {/* UKURAN LOGO DIPERBESAR */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-600/30 rounded-full blur-[20px] group-hover:bg-red-600/50 transition-all duration-500"></div>
            <img
              src="/logo-sadjodo.png"
              alt="Logo Sate Sadjodo"
              className="relative w-full h-full object-contain opacity-100 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full px-4">
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
            label="Tentang"
            active={activeTab === "About"}
            onClick={() => setActiveTab("About")}
          />
        </div>
      </aside>

      {/* --- MOBILE NAVBAR BOTTOM --- */}
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
            label="Tentang"
            active={activeTab === "About"}
            onClick={() => setActiveTab("About")}
          />
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 lg:ml-28 w-full max-h-screen overflow-y-auto relative scroll-smooth">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-gradient-to-b from-[#050505] via-[#050505]/90 to-transparent pt-8 pb-10 px-6 lg:px-12 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
             {/* Text Logo For Mobile */}
             <span className="lg:hidden text-xl font-black tracking-tight text-white flex items-center gap-2">
                SATE<span className="text-[#C1121F]">SADJODO</span>
             </span>
          </div>
          
          {/* KERANJANG HANYA MUNCUL DI TAB MENU */}
          <div className="pointer-events-auto flex items-center gap-4">
            {activeTab === "Menu" && (
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
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="px-6 lg:px-12 pb-32">
          {activeTab === "Home" && renderHome()}
          {activeTab === "Menu" && renderMenu()}
          {activeTab === "Location" && renderLocation()}
          {activeTab === "About" && renderAbout()}
        </div>
      </main>

      {/* --- MODAL ADD TO CART (POP UP PLUS MENU) --- */}
      <AnimatePresence>
        {selectedMenuToAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedMenuToAdd(null);
                setAddQty(1);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 z-[70] shadow-2xl flex flex-col items-center text-center"
            >
              <img
                src={
                  selectedMenuToAdd.image ||
                  "https://images.unsplash.com/photo-1628294895950-9805252327bc?q=80&w=1000"
                }
                className="w-32 h-32 rounded-full object-cover border-4 border-white/10 mb-6 shadow-xl"
                alt=""
              />
              <h3 className="text-2xl font-black text-white mb-2">
                {selectedMenuToAdd.nama}
              </h3>
              <p className="text-gray-400 text-sm mb-8">
                Atur jumlah pesanan untuk menu ini.
              </p>

              <div className="flex items-center gap-6 bg-white/5 rounded-full p-2 mb-8 border border-white/10">
                <button
                  onClick={() => setAddQty(Math.max(1, addQty - 1))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
                >
                  <Minus size={20} />
                </button>
                <span className="text-3xl font-black w-12 text-center">
                  {addQty}
                </span>
                <button
                  onClick={() => {
                     if (addQty >= selectedMenuToAdd.stok) {
                         alert("Mencapai batas stok!");
                         return;
                     }
                     setAddQty(addQty + 1);
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setSelectedMenuToAdd(null);
                    setAddQty(1);
                  }}
                  className="flex-1 py-4 rounded-full font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  Batal
                </button>
                
                <button
                  onClick={confirmAddToCart}
                  className="flex-[2] bg-gradient-to-r from-[#C1121F] to-red-700 hover:from-red-600 hover:to-red-800 text-white py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_10px_30px_rgba(193,18,31,0.3)] active:scale-95 flex items-center justify-center gap-2"
                >
                  Tambahkan <span className="opacity-50 font-normal">|</span> Rp {(selectedMenuToAdd.harga * addQty).toLocaleString("id-ID")}
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
              className="fixed top-0 right-0 w-full md:w-[450px] h-full bg-[#050505] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-[#0a0a0a]/50">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShoppingCart className="text-[#C1121F]" /> Keranjang Saya
                  </h2>
                  {checkoutStep === "cart" && (
                    <p className="text-gray-500 text-xs mt-1">
                      {totalItems} item siap dipesan
                    </p>
                  )}
                </div>
                {checkoutStep !== "waiting" && (
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {cart.length === 0 && checkoutStep === "cart" ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart size={40} className="text-gray-600" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">
                      Keranjang Kosong
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Belum ada sate yang dipilih. Yuk pesan sekarang!
                    </p>
                    <button
                      onClick={handleCloseModal}
                      className="mt-8 px-6 py-3 bg-white/10 rounded-full font-bold text-white hover:bg-white/20 transition-all"
                    >
                      Kembali ke Menu
                    </button>
                  </div>
                ) : checkoutStep === "cart" ? (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 rounded-3xl bg-[#0a0a0a] border border-white/5"
                      >
                        <img
                          src={item.image}
                          className="w-20 h-20 rounded-2xl object-cover"
                          alt={item.nama}
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {item.nama}
                            </h4>
                            <p className="text-[#C1121F] font-black text-sm mt-1">
                              Rp {item.harga.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-white/5 rounded-full px-2 py-1 border border-white/10">
                              <button
                                onClick={() => updateCartQty(item, -1)}
                                className="w-6 h-6 flex items-center justify-center text-white hover:text-[#C1121F] transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold text-white px-2 w-4 text-center">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateCartQty(item, 1)}
                                className="w-6 h-6 flex items-center justify-center text-white hover:text-[#C1121F] transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : checkoutStep === "form" ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 p-4 rounded-2xl flex items-start gap-3">
                      <Info
                        className="text-[#C1121F] shrink-0 mt-0.5"
                        size={20}
                      />
                      <p className="text-sm text-red-200">
                        Isi nama pemesan dan nomor meja Anda dengan benar agar
                        kami mudah mengantar pesanan. Meja yang redup merah menandakan sedang terisi.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                        Nama Pemesan
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Budi"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-600 focus:border-[#C1121F] focus:ring-1 focus:ring-[#C1121F] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                        Nomor Meja
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {AVAILABLE_TABLES.map((num) => {
                           const isOccupied = occupiedTables.includes(num);
                           return (
                             <button
                               key={num}
                               disabled={isOccupied}
                               onClick={() => !isOccupied && setTableNumber(num)}
                               className={`py-3 rounded-2xl font-black transition-all flex flex-col items-center justify-center ${
                                 tableNumber === num
                                   ? "bg-white text-black shadow-[0_5px_20px_rgba(255,255,255,0.2)] scale-105"
                                   : isOccupied
                                   ? "bg-[#C1121F]/10 text-red-500/40 border border-red-900/20 cursor-not-allowed"
                                   : "bg-[#0a0a0a] border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                               }`}
                             >
                               <span>{num}</span>
                               {isOccupied && (
                                  <span className="text-[9px] font-medium leading-tight mt-0.5">Terisi</span>
                               )}
                             </button>
                           );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : checkoutStep === "waiting" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-[#C1121F] rounded-full blur-2xl animate-pulse opacity-20" />
                      <div className="w-24 h-24 bg-[#0a0a0a] border border-white/10 rounded-full flex items-center justify-center relative z-10">
                        <Flame className="text-[#C1121F] animate-bounce" size={40} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">
                      Pesanan Diproses...
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                      Harap tunggu sebentar, sistem sedang mengirimkan pesanan
                      Anda ke dapur.
                    </p>
                    <Loader2 className="animate-spin text-white opacity-50 mx-auto" size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">
                      Sukses!
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed px-6 mb-8">
                      Koki kami sedang menyiapkan sate terenak untuk Anda.
                      Silakan duduk manis di{" "}
                      <span className="text-white font-black bg-white/10 px-2 py-0.5 rounded">
                        Meja {tableNumber}
                      </span>
                    </p>
                    <button
                      onClick={handleCloseModal}
                      className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:bg-gray-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
                    >
                      Tutup
                    </button>
                  </motion.div>
                )}
              </div>

              {/* FOOTER TOTAL & BUTTONS */}
              {cart.length > 0 &&
                checkoutStep !== "success" &&
                checkoutStep !== "waiting" && (
                  <div className="p-6 md:p-8 bg-[#0a0a0a] border-t border-white/5">
                    <div className="flex justify-between items-end mb-6">
                      <p className="text-gray-400 font-medium">Total Harga</p>
                      <p className="text-3xl font-black text-white tracking-tighter">
                        Rp {cartTotal.toLocaleString("id-ID")}
                      </p>
                    </div>
                    {checkoutStep === "cart" ? (
                      <button
                        onClick={() => setCheckoutStep("form")}
                        className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-full font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                      >
                        Lanjut Pesan <ArrowRight size={20} />
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCheckoutStep("cart")}
                          className="w-14 h-14 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white transition-all shrink-0"
                        >
                          <ArrowRight size={20} className="rotate-180" />
                        </button>
                        <button
                          onClick={submitOrder}
                          disabled={
                            isSubmitting || !tableNumber || !customerName
                          }
                          className="flex-1 bg-gradient-to-r from-[#C1121F] to-red-700 text-white hover:from-red-600 hover:to-red-800 py-4 rounded-full font-black uppercase tracking-widest disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_10px_20px_rgba(193,18,31,0.3)]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            "Kirim ke Dapur"
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

      {/* CHAT WIDGET: Disembunyikan saat modal keranjang / tambah menu terbuka agar tidak menghalangi */}
      {!isCartOpen && !selectedMenuToAdd && <ChatWidget />}
    </div>
  );
}
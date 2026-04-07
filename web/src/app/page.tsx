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
  ChevronLeft,
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
  protein?: string;
  tersedia?: boolean;
}

interface CartItem extends MenuItem {
  qty: number;
  level_pedas?: number;
  catatan?: string;
}

// --- 2. KONSTANTA ---
const CATEGORIES = ["All", "Sate", "Karbo", "Camilan", "Minuman"];
const AVAILABLE_TABLES = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString()
);

// --- 3. MAPPING FOTO MENU MANUAL (FALLBACK JIKA TIDAK ADA FOTO DARI ADMIN) ---
const MENU_IMAGES: Record<string, string> = {
  "Sate Taichan Sapi": "/1.png",
  "Sate Taichan Bumbu Kacang": "/2.png",
  "Sate Taichan Kulit": "/3.png",
  "Lontong": "/5.png",
  "Indomie Goreng Taichan": "/6.png",
  "Nasi Daun Jeruk": "/7.png",
  "Kulit Ayam Krispi": "/8.png",
  "Gyoza Chilli Oil": "/9.png",
  "Ceker Mercon": "/10.png",
  "Rich Harvest Ramen": "/11.png",
  "Sate Taichan Paket Komplit": "/12.png",
  "Sate Taichan Premium": "/13.png",
  "Tahu Cabai Garam": "/14.png",
  "Chilled Craft Blend": "/15.png",
  "BBQ Ribs Special": "/16.png",
  "Lemon Fresh Slice": "/17.png",
  "Es Teh Manis": "/18.png",
  "Es Jeruk Peras": "/19.png",
};

// --- DATA SLIDER ---
const SLIDER_DATA = [
  {
    id: 1,
    title: "SATE TAICHAN PREMIUM",
    subtitle: "Grilled Chicken Skewers with Lime & Chili",
    desc: "Daging ayam pilihan dibakar sempurna dengan arang batok, disajikan dengan sambal rawit merah segar, perasan jeruk nipis, dan kerupuk, memberikan rasa yang tak terlupakan.",
    image: "/sate.svg",
    price: 25000,
    theme: "from-red-950/90 via-red-900/70 to-black/95",
    accentColor: "#C1121F",
  },
  {
    id: 2,
    title: "DIMSUM GYOZA CHILI OIL",
    subtitle: "Hand-Crafted Dumplings with Szechuan Spice",
    desc: "Hand-crafted gyoza, pan-seared to perfection, then steamed and generously enveloped in our signature Szechuan-style chili oil.",
    image: "/dimsum.svg",
    price: 22000,
    theme: "from-red-950/90 via-orange-900/70 to-black/95",
    accentColor: "#DC2626",
  },
  {
    id: 3,
    title: "BBQ RIBS SPECIAL",
    subtitle: "Tender Ribs with Rich BBQ Sauce",
    desc: "Daging iga sapi pilihan yang dimasak perlahan hingga empuk, dilumuri dengan saus BBQ rahasia yang kaya rasa.",
    image: "/sapi.svg",
    price: 40000,
    theme: "from-amber-950/90 via-orange-900/70 to-black/95",
    accentColor: "#EA580C",
  },
  {
    id: 4,
    title: "LEMON FRESH SLICE",
    subtitle: "Hand-Pressed Lemonade with Ice",
    desc: "A vibrant, cooling blend of hand-pressed lemon juice and simple syrup, served over crystal-clear ice for a pure, refreshing taste. Pure citrus bliss.",
    image: "/lemon.svg",
    price: 10000,
    theme: "from-green-950/90 via-lime-900/70 to-black/95",
    accentColor: "#A3E635",
  },
  {
    id: 5,
    title: "RICH HARVEST RAMEN",
    subtitle: "A Hearty & Flavorful Ramen Bowl with Tamago",
    desc: "A rich, flavorful bowl of traditional ramen, featuring a deep umami-based broth and hand-pulled noodles. Topped with marinated Ajitama.",
    image: "/mie.svg",
    price: 35000,
    theme: "from-orange-950/90 via-amber-800/70 to-black/95",
    accentColor: "#F59E0B",
  },
  {
    id: 6,
    title: "CHILLED CRAFT BLENDS",
    subtitle: "A Curated Selection of Handcrafted Beverages",
    desc: "Featuring premium Matcha Latte, artisan Caramel Espresso with visible drizzle, rich Mocha, and our signature Iced Milk Coffee.",
    image: "/minuman.svg",
    price: 10000,
    theme: "from-teal-950/90 via-emerald-800/70 to-black/95",
    accentColor: "#D97706",
  },
];

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
        ? "bg-gradient-to-br from-[#C1121F] to-red-800 text-white shadow-[0_0_25px_rgba(193,18,31,0.6)] scale-110"
        : "text-gray-400 hover:bg-white/10 hover:text-white"
    }`}
    title={label}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
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
  const [isCartLoaded, setIsCartLoaded] = useState(false); // Flag untuk local storage
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMenuToAdd, setSelectedMenuToAdd] = useState<MenuItem | null>(
    null
  );
  const [addQty, setAddQty] = useState(1);
  const [customLevel, setCustomLevel] = useState<number>(0);
  const [customNote, setCustomNote] = useState<string>("");

  // --- CHECKOUT STATES ---
  const [checkoutStep, setCheckoutStep] = useState<
    "cart" | "form" | "waiting" | "success"
  >("cart");
  const [waitingStep, setWaitingStep] = useState(0); // State baru untuk animasi checkpoint
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);

  // --- SLIDER STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // --- TOAST STATE ---
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

  const cartTotal = cart.reduce(
    (total, item) => total + item.harga * item.qty,
    0
  );
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);

  // --- HELPER: UPDATE STOCK ---
  const adjustStock = (id: number, delta: number) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, stok: Math.max(0, m.stok + delta) } : m
      )
    );
  };

  // --- FETCH DATA MENU DARI API (DIPERBARUI SETIAP ADA PERUBAHAN) ---
  const fetchMenus = async () => {
    try {
      // Menggunakan cache: "no-store" untuk memastikan data selalu fresh dari database
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data menu");
      const data = await res.json();
      // Filter hanya menu yang tersedia (tersedia: true) dan set stok default jika null
      setMenus(
        data
          .filter((item: any) => item.tersedia !== false)
          .map((item: any) => ({ ...item, stok: item.stok ?? 99 }))
      );
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
          (order: any) => order.status !== "COMPLETED"
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
    // Refresh data menu setiap 5 detik untuk sinkronisasi dengan admin
    const interval = setInterval(() => {
      fetchMenus();
      fetchOccupiedTables();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- LOAD CART & ACTIVE ORDER DARI LOCAL STORAGE (JALAN SEKALI SAAT RENDER PERTAMA) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load cart
      const savedCart = localStorage.getItem("sadjodo_cart");
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error("Gagal load cart dari localStorage", error);
        }
      }
      setIsCartLoaded(true);

      // Load active order status (mencegah kembali ke dashboard bila reload saat waiting/success)
      const activeOrder = localStorage.getItem("sadjodo_active_order");
      if (activeOrder) {
        try {
          const parsed = JSON.parse(activeOrder);
          if (parsed.checkoutStep === "waiting" || parsed.checkoutStep === "success") {
            setIsCartOpen(true);
            setCheckoutStep(parsed.checkoutStep);
            setSubmittedOrderId(parsed.submittedOrderId);
            setTableNumber(parsed.tableNumber || "");
            setCustomerName(parsed.customerName || "");
          }
        } catch (e) {
          console.error("Gagal load active order dari localStorage", e);
        }
      }
    }
  }, []);

  // --- SIMPAN CART KE LOCAL STORAGE SETIAP KALI CART BERUBAH ---
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("sadjodo_cart", JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  // Logika mendeteksi menu pedas (Kategori Sate atau dari nama)
  const isSpicyMenu = selectedMenuToAdd ? (
    selectedMenuToAdd.kategori === "Sate" || 
    selectedMenuToAdd.nama.toLowerCase().includes("taichan") || 
    selectedMenuToAdd.nama.toLowerCase().includes("pedas") || 
    selectedMenuToAdd.nama.toLowerCase().includes("mercon") || 
    selectedMenuToAdd.nama.toLowerCase().includes("chili")
  ) : false;

  // --- LOGIKA PESANAN & CART ---
  const confirmAddToCart = () => {
    if (!selectedMenuToAdd) return;
    if (selectedMenuToAdd.stok < addQty) {
      alert("Stok tidak mencukupi!");
      return;
    }
    adjustStock(selectedMenuToAdd.id, -addQty);

    const finalLevel = isSpicyMenu ? customLevel : undefined;
    const finalNote = customNote.trim() !== "" ? customNote : undefined;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === selectedMenuToAdd.id);
      if (existing)
        return prev.map((item) =>
          item.id === selectedMenuToAdd.id
            ? { ...item, qty: item.qty + addQty, level_pedas: finalLevel, catatan: finalNote }
            : item
        );
      return [...prev, { ...selectedMenuToAdd, qty: addQty, level_pedas: finalLevel, catatan: finalNote }];
    });

    // --- LOGIKA TOAST MENAMPILKAN PESAN ---
    setToastMessage(`${selectedMenuToAdd.nama} sudah masuk ke keranjang`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
    // -------------------------------------

    setSelectedMenuToAdd(null);
    setAddQty(1);
    setCustomLevel(0);
    setCustomNote("");
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
        .filter((i) => i.qty > 0)
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
            level_pedas: item.level_pedas,
            catatan: item.catatan
          })),
        }),
      });
      if (!response.ok) throw new Error("Gagal");
      const data = await response.json();
      
      const newOrderId = data?.id || null;
      if (newOrderId) {
        setSubmittedOrderId(newOrderId);
      }
      
      setCheckoutStep("waiting");
      setCart([]); // Saat cart dikosongkan, localStorage cart juga akan otomatis ikut kosong
      fetchOccupiedTables();

      // SIMPAN STATE CHECKPOINT KE LOCAL STORAGE
      if (newOrderId && typeof window !== "undefined") {
        localStorage.setItem("sadjodo_active_order", JSON.stringify({
          checkoutStep: "waiting",
          submittedOrderId: newOrderId,
          tableNumber: tableNumber,
          customerName: customerName
        }));
      }

    } catch (error) {
      alert("Terjadi kesalahan saat mengirim pesanan.");
      cart.forEach((item) => adjustStock(item.id, item.qty));
      setCart([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Efek untuk animasi bertahap (Checkpoint) saat waiting
  useEffect(() => {
    if (checkoutStep === "waiting") {
      setWaitingStep(0);
      const t1 = setTimeout(() => setWaitingStep(1), 1500);
      const t2 = setTimeout(() => setWaitingStep(2), 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [checkoutStep]);

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
            
            // Perbarui status success di local storage
            if (typeof window !== "undefined") {
              const activeOrderStr = localStorage.getItem("sadjodo_active_order");
              if (activeOrderStr) {
                const parsed = JSON.parse(activeOrderStr);
                localStorage.setItem("sadjodo_active_order", JSON.stringify({ ...parsed, checkoutStep: "success" }));
              }
            }

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
      // Hapus state checkpoint dari localStorage jika sudah selesai
      if (typeof window !== "undefined") {
        localStorage.removeItem("sadjodo_active_order");
      }
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

  // --- FUNGSI UNTUK MENDAPATKAN GAMBAR MENU (PRIORITAS: DATABASE > MANUAL MAPPING > ID) ---
  const getMenuImage = (menu: MenuItem) => {
    // Prioritas 1: Gambar dari database (hasil upload admin)
    if (menu.image && menu.image.trim() !== "") {
      return menu.image;
    }
    // Prioritas 2: Mapping manual berdasarkan nama
    if (MENU_IMAGES[menu.nama]) {
      return MENU_IMAGES[menu.nama];
    }
    // Prioritas 3: Fallback ke ID
    return `/${menu.id}.png`;
  };

  // --- SLIDER NAVIGATION ---
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === SLIDER_DATA.length - 1 ? 0 : prev + 1));
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? SLIDER_DATA.length - 1 : prev - 1));
  };

  // Auto slide setiap 5 detik
  useEffect(() => {
    if (!isAutoSliding) return;
    const slideInterval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [isAutoSliding]);

  // --- VIEW RENDERERS ---
  const renderHome = () => (
    <motion.div
      key={currentSlide}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 w-full h-full bg-[#050505] overflow-hidden"
    >
      {/* Background Gradient Modern */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${SLIDER_DATA[currentSlide].accentColor}30 0%, #110505 50%, #050505 100%)`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full w-full flex flex-col justify-between p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto">
        {/* TOP LEFT: Title & Subtitle */}
        <div className="max-w-2xl z-20 mt-4 md:mt-8">
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-none uppercase tracking-tight"
          >
            {SLIDER_DATA[currentSlide].title}
          </motion.h1>
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-2xl md:text-4xl lg:text-5xl text-white/90 font-light leading-snug mt-4 max-w-lg"
          >
            {SLIDER_DATA[currentSlide].subtitle}
          </motion.h2>
        </div>

        {/* CENTER: 3D Tilted Neon Ring & Food Image */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-[45%] w-full flex justify-center items-center pointer-events-none z-10">
          {/* Tilted Neon Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute w-[320px] md:w-[550px] lg:w-[750px] h-[100px] md:h-[180px] lg:h-[220px] rounded-[100%] border-[2px] md:border-[4px] mt-[100px] md:mt-[180px] lg:mt-[220px]"
            style={{
              borderColor: SLIDER_DATA[currentSlide].accentColor,
              boxShadow: `0 0 50px ${SLIDER_DATA[currentSlide].accentColor}, inset 0 0 50px ${SLIDER_DATA[currentSlide].accentColor}`,
              opacity: 0.7,
            }}
          />
          {/* Food Image */}
          <motion.img
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 1.2, delay: 0.1 }}
            src={SLIDER_DATA[currentSlide].image}
            alt={SLIDER_DATA[currentSlide].title}
            className="relative z-20 w-[280px] h-[280px] md:w-[450px] md:h-[450px] lg:w-[600px] lg:h-[600px] object-cover rounded-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)] pointer-events-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000";
            }}
          />
        </div>

        {/* BOTTOM SECTION - Diberi padding bawah agar tidak menyatu dengan navbar mobile */}
        <div className="flex flex-row justify-between items-start z-20 pb-28 md:pb-12 gap-6 relative">
         {/* Bottom Left: Harga & Deskripsi */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="self-start md:self-end mb-24 md:mb-0" 
          >
            <div className="text-3xl md:text-5xl font-black text-white tracking-wider drop-shadow-lg mb-2">
              Rp {SLIDER_DATA[currentSlide].price.toLocaleString("id-ID")}
            </div>
            <div className="max-w-[300px] md:max-w-md text-gray-300 text-xs md:text-sm leading-relaxed">
              {SLIDER_DATA[currentSlide].desc}
            </div>
          </motion.div>

          {/* Bottom Right: Kontrol Navigasi & Action */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col items-end gap-5 w-full md:w-auto"
          >
            {/* Arrow Navigations */}
            <div className="flex gap-4 self-end">
              <button
                onClick={() => {
                  prevSlide();
                  setIsAutoSliding(false);
                  setTimeout(() => setIsAutoSliding(true), 10000);
                }}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-md"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <button
                onClick={() => {
                  nextSlide();
                  setIsAutoSliding(false);
                  setTimeout(() => setIsAutoSliding(true), 10000);
                }}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-md"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
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
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Menu Spesial Sadjodo
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Dari yang pedas membakar sampai yang manis menyegarkan.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Cari sate, minum..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#0a0a0a] border border-white/10 rounded-full pl-12 pr-4 py-3 outline-none text-white placeholder:text-gray-600 font-medium w-full focus:border-[#C1121F] focus:ring-2 focus:ring-[#C1121F]/20 transition-all"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-[#C1121F] to-red-700 text-white shadow-[0_0_20px_rgba(193,18,31,0.4)]"
                : "bg-[#0a0a0a] border border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20"
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
                onClick={() => !isOutOfStock && setSelectedMenuToAdd(menu)}
                className={`bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-white/15 transition-all shadow-xl hover:shadow-2xl flex flex-col ${
                  isOutOfStock ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div className="relative h-56 overflow-hidden bg-[#111]">
                  {/* FOTO MENU: PRIORITAS DATABASE > MANUAL MAPPING > ID */}
                  <img
                    src={getMenuImage(menu)}
                    alt={menu.nama}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                    <Flame
                      size={14}
                      className={
                        isOutOfStock ? "text-gray-500" : "text-[#C1121F]"
                      }
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
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah popup terpanggil 2 kali
                        if (!isOutOfStock) setSelectedMenuToAdd(menu);
                      }}
                      disabled={isOutOfStock}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                        isOutOfStock
                          ? "bg-white/5 text-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-br from-[#C1121F] to-red-700 text-white hover:shadow-[0_0_20px_rgba(193,18,31,0.4)]"
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
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Kunjungi Cabang Kami
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Pilih cabang terdekat dari lokasi Anda. Nikmati sate taichan otentik
          langsung dari pemanggang kami dalam suasana yang nyaman.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <a
            href="https://maps.app.goo.gl/Bg9c4Gz2S8m3qThX9"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/5 hover:border-red-500/30 transition-all duration-300 group cursor-pointer shadow-lg"
          >
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1 group-hover:text-red-400 transition-colors">
                Cabang Rancamanyar
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Jl. Bojong Koneng, Rancamanyar, Kec. Baleendah, Kabupaten
                Bandung, Jawa Barat 40375
              </p>
            </div>
          </a>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Sate+Sadjodo+Gading+Tutuka+Soreang"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/5 hover:border-red-500/30 transition-all duration-300 group cursor-pointer shadow-lg"
          >
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1 group-hover:text-red-400 transition-colors">
                Cabang Gading Tutuka
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                XGHR+3Q7, Jl. Raya Gading Tutuka, Cingcin, Kec. Soreang,
                Kabupaten Bandung, Jawa Barat
              </p>
            </div>
          </a>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-[#C1121F]/10 to-[#0a0a0a] border border-[#C1121F]/20 p-5 rounded-2xl flex items-center gap-3 hover:border-[#C1121F]/50 transition-all shadow-lg group cursor-pointer"
            >
              <div className="w-12 h-12 bg-[#C1121F] rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <PhoneCall size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">
                  Reservasi / WA
                </p>
                <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors">
                  Hubungi
                </h3>
              </div>
            </a>

            <a
              href="https://www.instagram.com/sate.sadjodo?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 border border-purple-500/20 p-5 rounded-2xl flex items-center gap-3 hover:border-purple-500/50 transition-all shadow-lg group cursor-pointer"
            >
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform">
                <Instagram size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">
                  Instagram
                </p>
                <h3 className="text-sm font-black text-white group-hover:text-pink-300 transition-colors">
                  @sate.sadjodo
                </h3>
              </div>
            </a>
          </div>

          <div className="lg:col-span-3 bg-[#0a0a0a] rounded-[3rem] overflow-hidden border border-white/5 relative h-[400px] lg:h-full min-h-[400px] shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt="Suasana Sate Sadjodo"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-8 left-8 right-8 z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">
                  Buka Setiap Hari
                </span>
              </div>
              <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                Suasana Hangat & Nyaman
              </h3>
              <p className="text-gray-200 text-sm max-w-md drop-shadow-md leading-relaxed">
                Tempat yang pas untuk bersantai, berbincang, dan menikmati
                hidangan sate taichan otentik bersama keluarga atau teman
                terdekat Anda.
              </p>
            </div>
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
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Cerita Kami Rasa Sadjodo
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Berawal dari kecintaan pada kuliner pedas gurih, kami meracik resep
          taichan yang tidak hanya membakar lidah, tetapi juga meninggalkan
          kenangan. Setiap tusuk adalah dedikasi kami untuk kualitas dan
          kepuasan pelanggan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-0">
        <div className="order-2 lg:order-1 space-y-6 lg:pr-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-2 border border-red-500/20 shadow-[0_0_15px_rgba(193,18,31,0.3)]">
            <Flame className="text-[#C1121F]" size={32} />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Seni Memanggang <br />
            <span className="text-[#C1121F]">Arang Batok</span>
          </h3>
          <p className="text-gray-400 leading-relaxed text-base">
            Kami menggunakan 100% daging ayam segar pilihan yang dimarinasi
            dengan bumbu rempah rahasia. Proses pemanggangan menggunakan arang
            batok kelapa khusus memastikan tingkat kematangan sempurna,{" "}
            <span className="text-white italic">juicy</span> di dalam, dengan
            aroma <span className="text-white font-bold">smoky</span> yang khas
            Sate Sadjodo.
          </p>
        </div>
        <div className="relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group h-[400px] order-1 lg:order-2 border border-white/5">
          <img
            src="/taichan-sate.png"
            alt="Grilling Sate Sadjodo Taichan"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#050505]/60 via-transparent to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-0">
        <div className="relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group h-[400px] border border-white/5">
          <img
            src="/taichan-sambal.png"
            alt="Sambal Rawit Merah Sadjodo"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-tl from-[#C1121F]/40 via-transparent to-transparent" />
        </div>
        <div className="space-y-6 lg:pl-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-2 border border-red-500/20 shadow-[0_0_15px_rgba(193,18,31,0.3)]">
            <HeartPulse className="text-[#C1121F]" size={32} />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Sengatan Asli <br />
            <span className="text-[#C1121F]">Tanpa Pengawet</span>
          </h3>
          <p className="text-gray-400 leading-relaxed text-base">
            Sambal andalan kami diulek segar setiap hari. Tanpa saus kemasan,
            dan tanpa bubuk cabai buatan. Hanya cabai rawit merah segar pilihan
            terbaik yang disiapkan untuk membakar lidah Anda dengan sensasi
            pedas gurih yang bikin nagih.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0a0a0a] to-[#111] border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-10 w-40 h-40 bg-yellow-500/10 blur-[50px]" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]">
            <Award className="text-white" size={40} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">Rasa Premium</h4>
            <p className="text-gray-400 text-sm">
              Pilihan Utama Pencinta Kuliner Taichan
            </p>
          </div>
        </div>
        <div className="text-center md:text-right relative z-10">
          <p className="text-4xl font-black text-white mb-1">
            Top <span className="text-[#C1121F]">Quality</span>
          </p>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
            Bahan Baku & Pelayanan
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-24 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 py-6 items-center gap-6 fixed h-full z-40">
        {/* LOGO SIDEBAR */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C1121F] to-red-800 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(193,18,31,0.4)]">
          <ChefHat size={28} className="text-white" />
        </div>

        <div className="flex flex-col gap-4 flex-1">
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
      <main className="flex-1 w-full h-screen overflow-hidden relative lg:ml-24">
        {/* --- BAWAH KIRI CART BUTTON (HANYA DI MENU) --- */}
        {activeTab === "Menu" && (
          <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-28 left-6 md:bottom-8 md:left-8 z-50 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }} // Mencegah scrolling layer saat didrag di HP
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 bg-[#C1121F] hover:bg-red-700 text-white shadow-[0_10px_30px_rgba(193,18,31,0.5)] border border-red-400/30 pointer-events-auto"
              title="Keranjang"
            >
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-[#C1121F] text-xs font-black rounded-full flex items-center justify-center border-2 border-[#050505]">
                  {totalItems}
                </span>
              )}
            </button>
          </motion.div>
        )}

        {/* Dynamic Content - Full Screen Slider */}
        <div className="w-full h-full">
          {activeTab === "Home" && renderHome()}
          {activeTab !== "Home" && (
            <div className="h-full overflow-y-auto px-6 lg:px-12 pt-12 md:pt-8 pb-32">
              {activeTab === "Menu" && renderMenu()}
              {activeTab === "Location" && renderLocation()}
              {activeTab === "About" && renderAbout()}
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL ADD TO CART --- */}
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
                setCustomLevel(0);
                setCustomNote("");
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-6 md:p-8 z-[70] shadow-2xl flex flex-col items-center text-center"
            >
              {/* UPDATE FOTO TAMBAH KE KERANJANG - PRIORITAS DATABASE */}
              <img
                src={getMenuImage(selectedMenuToAdd)}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/10 mb-6 shadow-xl shrink-0"
                alt={selectedMenuToAdd.nama}
              />
              <h3 className="text-2xl font-black text-white mb-2">
                {selectedMenuToAdd.nama}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Atur jumlah pesanan untuk menu ini.
              </p>

              <div className="flex items-center gap-6 bg-white/5 rounded-full p-2 mb-6 border border-white/10 shrink-0">
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

              {/* NEW SPICY LEVEL SELECTION */}
              {isSpicyMenu && (
                <div className="mb-4 w-full text-left shrink-0">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Level Pedas <span className="font-normal normal-case text-gray-500">(Opsional)</span></label>
                  <div className="flex justify-between gap-2">
                    {[0, 1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setCustomLevel(level)}
                        className={`flex-1 py-2 rounded-xl border transition-all ${
                          customLevel === level
                            ? "bg-gradient-to-br from-[#C1121F] to-red-800 border-red-500 text-white shadow-[0_0_15px_rgba(193,18,31,0.4)]"
                            : "bg-[#111] border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        <span className="block text-xs font-bold mb-0.5">{level === 0 ? "Pisah" : `Lv ${level}`}</span>
                        <div className="flex justify-center gap-0.5">
                          {level === 0 ? <Minus size={10} className="text-orange-500" /> : Array.from({length: Math.min(level, 3)}).map((_,i)=><Flame key={i} size={10} className="text-orange-500" />)}
                          {level > 3 && <Plus size={10} className="text-orange-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW NOTES FIELD */}
              <div className="mb-8 w-full text-left shrink-0">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Catatan Pesanan <span className="font-normal normal-case text-gray-500">(Opsional)</span></label>
                <textarea
                   value={customNote}
                   onChange={(e) => setCustomNote(e.target.value)}
                   placeholder="Contoh: Bakar agak kering, bawang goreng dipisah..."
                   className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#C1121F] focus:ring-1 focus:ring-[#C1121F] outline-none transition-all resize-none h-20 text-sm custom-scrollbar"
                />
              </div>

              <div className="flex gap-3 w-full shrink-0">
                <button
                  onClick={() => {
                    setSelectedMenuToAdd(null);
                    setAddQty(1);
                    setCustomLevel(0);
                    setCustomNote("");
                  }}
                  className="flex-1 py-4 rounded-full font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  Batal
                </button>

                <button
                  onClick={confirmAddToCart}
                  className="flex-[2] bg-gradient-to-r from-[#C1121F] to-red-700 hover:from-red-600 hover:to-red-800 text-white py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_10px_30px_rgba(193,18,31,0.3)] active:scale-95 flex items-center justify-center gap-2"
                >
                  Tambahkan <span className="opacity-50 font-normal">|</span>{" "}
                  Rp{" "}
                  {(selectedMenuToAdd.harga * addQty).toLocaleString("id-ID")}
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
                        {/* UPDATE FOTO KERANJANG - PRIORITAS DATABASE */}
                        <img
                          src={getMenuImage(item)}
                          className="w-20 h-20 rounded-2xl object-cover shrink-0"
                          alt={item.nama}
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {item.nama}
                            </h4>
                            {/* --- TAMPILAN LEVEL PEDAS & CATATAN --- */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.level_pedas !== undefined && (
                                 <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 w-max ${item.level_pedas === 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}`}>
                                   {item.level_pedas > 0 ? <><Flame size={10} /> Level {item.level_pedas}</> : "Pisah Sambal"}
                                 </span>
                              )}
                            </div>
                            {item.catatan && (
                              <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1 break-all">"{item.catatan}"</p>
                            )}
                            {/* -------------------------------------- */}
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
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0"
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
                        kami mudah mengantar pesanan. Meja yang redup merah
                        menandakan sedang terisi.
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
                                <span className="text-[9px] font-medium leading-tight mt-0.5">
                                  Terisi
                                </span>
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
                    className="flex flex-col items-center justify-center h-full px-4 w-full"
                  >
                    <h3 className="text-2xl font-black text-white mb-10 text-center">
                      Pesanan Diproses
                    </h3>

                    <div className="relative flex flex-col items-start w-full max-w-[280px] mx-auto gap-10">
                      {/* Background Line */}
                      <div className="absolute left-[19px] top-5 bottom-5 w-[2px] bg-white/10 rounded-full z-0" />
                      
                      {/* Animated Progress Line */}
                      <motion.div 
                        className="absolute left-[19px] top-5 w-[2px] bg-gradient-to-b from-[#C1121F] to-red-500 rounded-full z-0"
                        initial={{ height: "0%" }}
                        animate={{ height: waitingStep === 0 ? "0%" : waitingStep === 1 ? "50%" : "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />

                      {/* Step 1 */}
                      <div className="flex items-center gap-6 relative z-10 w-full">
                        <motion.div 
                          animate={waitingStep === 0 ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(193,18,31,0)", "0 0 20px rgba(193,18,31,0.5)", "0 0 0px rgba(193,18,31,0)"] } : {}}
                          transition={{ repeat: waitingStep === 0 ? Infinity : 0, duration: 1.5 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${waitingStep >= 0 ? 'bg-gradient-to-br from-[#C1121F] to-red-800 text-white' : 'bg-[#111] text-gray-600 border border-white/10'}`}
                        >
                          {waitingStep > 0 ? <CheckCircle2 size={20} /> : <ShoppingCart size={20} />}
                        </motion.div>
                        <div className="flex flex-col">
                          <p className={`font-bold text-base transition-all duration-500 ${waitingStep >= 0 ? 'text-white' : 'text-gray-600'}`}>Mengirim pesanan</p>
                          {waitingStep === 0 && <span className="text-xs text-red-400 mt-1">Sedang disinkronisasi...</span>}
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center gap-6 relative z-10 w-full">
                        <motion.div 
                          animate={waitingStep === 1 ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(193,18,31,0)", "0 0 20px rgba(193,18,31,0.5)", "0 0 0px rgba(193,18,31,0)"] } : {}}
                          transition={{ repeat: waitingStep === 1 ? Infinity : 0, duration: 1.5 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${waitingStep >= 1 ? 'bg-gradient-to-br from-[#C1121F] to-red-800 text-white' : 'bg-[#111] text-gray-600 border border-white/10'}`}
                        >
                          {waitingStep > 1 ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                        </motion.div>
                        <div className="flex flex-col">
                          <p className={`font-bold text-base transition-all duration-500 ${waitingStep >= 1 ? 'text-white' : 'text-gray-600'}`}>Verifikasi data</p>
                          {waitingStep === 1 && <span className="text-xs text-red-400 mt-1">Mengecek ketersediaan...</span>}
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-center gap-6 relative z-10 w-full">
                        <motion.div 
                          animate={waitingStep === 2 ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(193,18,31,0)", "0 0 20px rgba(193,18,31,0.5)", "0 0 0px rgba(193,18,31,0)"] } : {}}
                          transition={{ repeat: waitingStep === 2 ? Infinity : 0, duration: 1.5 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${waitingStep >= 2 ? 'bg-gradient-to-br from-[#C1121F] to-red-800 text-white' : 'bg-[#111] text-gray-600 border border-white/10'}`}
                        >
                          {waitingStep > 2 ? <CheckCircle2 size={20} /> : <ChefHat size={20} />}
                        </motion.div>
                        <div className="flex flex-col">
                          <p className={`font-bold text-base transition-all duration-500 ${waitingStep >= 2 ? 'text-white' : 'text-gray-600'}`}>Menunggu koki</p>
                          {waitingStep === 2 && <span className="text-xs text-red-400 mt-1">Pesanan diterima dapur!</span>}
                        </div>
                      </div>
                    </div>
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

      {/* --- TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: "-50%", y: 50 }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: "-50%", y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 md:bottom-32 left-1/2 z-[100] bg-[#1a1a1a] text-white px-6 py-4 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 backdrop-blur-lg w-max max-w-[90vw]"
          >
            <CheckCircle2 className="text-[#C1121F] shrink-0" size={20} />
            <p className="font-medium text-sm text-center leading-tight">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --------------------------- */}

      {/* CHAT WIDGET: Disembunyikan saat modal keranjang / tambah menu terbuka agar tidak menghalangi */}
      {!isCartOpen && !selectedMenuToAdd && <ChatWidget />}
    </div>
  );
}
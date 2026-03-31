"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { X, Send, Sparkles, Info, Bot, ChevronRight, ShoppingBag } from "lucide-react";

// --- DEFINISI TIPE DATA ---
interface Menu {
  nama: string;
  harga: string;
  image: string;
  deskripsi: string;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  menus?: Menu[];
  catatan?: string;
}

const SUGGESTIONS = ["Menu Terlaris?", "Daftar Menu?", "Jam Buka?", "Lokasi Cabang?"];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Halo Kak! ✨ Saya Asisten AI Sadjodo.\nMau cari rekomendasi menu, tanya cabang, atau lihat daftar sate kami?",
      sender: "bot",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drag state untuk tombol melayang di tepi layar
  const [side, setSide] = useState<"left" | "right">("right");
  const controls = useAnimation();
  const [winWidth, setWinWidth] = useState(0);
  const [winHeight, setWinHeight] = useState(0);
  const buttonWidth = 32;

  useEffect(() => {
    setWinWidth(window.innerWidth);
    setWinHeight(window.innerHeight);
    const handleResize = () => {
      setWinWidth(window.innerWidth);
      setWinHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragEnd = (event: any, info: any) => {
    const currentX = info.point.x;
    const isCloserToLeft = currentX < winWidth / 2;
    if (isCloserToLeft) {
      setSide("left");
      controls.start({
        x: -(winWidth - buttonWidth),
        transition: { type: "spring", stiffness: 300, damping: 20 },
      });
    } else {
      setSide("right");
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [messages, isOpen, isLoading]);

  // Handle pengiriman pesan & parser data
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newUserMsg: Message = { id: Date.now(), text, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();

      let aiText = String(data.jawaban || "Maaf, sistem sedang memproses. Boleh diulang?");
      aiText = aiText.replace(/ID-\d+/gi, "").trim();

      const detectedMenus: Menu[] = Array.isArray(data.menus) ? data.menus : [];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: aiText,
          sender: "bot",
          menus: detectedMenus.length > 0 ? detectedMenus : undefined,
          catatan: data.catatan && data.catatan !== "-" ? data.catatan : undefined,
        },
      ]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Mohon maaf Kak, koneksi sistem AI kami sedang sibuk 🙏 Mohon coba lagi dalam beberapa detik.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBotText = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>');
    formatted = formatted.replace(/^- (.*)$/gm, '<li class="ml-4 list-disc marker:text-[#C1121F] mb-1">$1</li>');
    return { __html: formatted };
  };

  // --- FUNGSI TRIK "AUTO-CLICK" MENU ---
  const handlePindahKeMenu = () => {
    setIsOpen(false); // Tutup dulu modal chatnya

    // Beri jeda sepersekian detik agar animasi chat hilang dulu dari layar
    setTimeout(() => {
      // Kita cari semua elemen tombol di halaman
      const allButtons = document.querySelectorAll("button, a, div");
      
      // Cari elemen yang teksnya persis "Menu" (Biasanya ada di Sidebar / Bottom Bar)
      const menuBtn = Array.from(allButtons).find(
        (el) => el.textContent?.trim().toLowerCase() === "menu" && el.tagName.toLowerCase() !== "textarea"
      );

      // Jika tombolnya ketemu, eksekusi klik otomatis!
      if (menuBtn && menuBtn instanceof HTMLElement) {
        menuBtn.click();
      } else {
        // Kalau navigasi Kakak pakai cara scroll ke bagian tertentu (bukan tab ganti layar)
        window.scrollTo({ top: 500, behavior: "smooth" }); 
      }
    }, 300);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 w-full h-[100dvh] bg-[#050505]/95 backdrop-blur-3xl z-[150] flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#C1121F]/10 rounded-[100%] blur-[120px] pointer-events-none" />

            <div className="relative p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/60 backdrop-blur-2xl z-20">
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
              <div className="flex items-center gap-4 max-w-4xl mx-auto w-full px-2 md:px-0">
                <div className="relative">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#C1121F] to-red-900 flex items-center justify-center border border-red-400/30 shadow-[0_0_25px_rgba(193,18,31,0.3)]">
                    <Bot size={26} className="text-white drop-shadow-md" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-[#0a0a0a] rounded-full shadow-[0_0_10px_#10b981]" />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-white flex items-center gap-2 text-lg md:text-xl tracking-tight">
                      Sadjodo AI <Sparkles size={16} className="text-[#C1121F]" />
                    </h3>
                    <p className="text-[11px] md:text-xs text-gray-400 font-medium tracking-wide mt-0.5">
                      Asisten Virtual • Online
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all hover:rotate-90 active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto relative overflow-hidden z-10">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth hide-scroll pb-32">
                
                <div className="flex justify-center mb-6">
                  <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-400 shadow-sm">
                    <Info size={14} className="text-[#C1121F]" />
                    Pesan diproses secara real-time
                  </div>
                </div>

                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] md:max-w-[80%] rounded-3xl p-4 md:p-5 shadow-2xl relative overflow-hidden ${
                        msg.sender === "user"
                          ? "bg-gradient-to-br from-[#C1121F] to-red-800 text-white rounded-tr-sm border border-red-500/30"
                          : "bg-[#111]/80 text-gray-300 rounded-tl-sm border border-white/10 backdrop-blur-xl"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p className="text-[15px] leading-relaxed relative z-10 font-medium">
                          {msg.text}
                        </p>
                      ) : (
                        <div
                          className="text-[15px] leading-relaxed relative z-10 space-y-2"
                          dangerouslySetInnerHTML={formatBotText(msg.text)}
                        />
                      )}

                      {msg.menus && msg.menus.length > 0 && (
                        <div className="mt-5 flex gap-4 overflow-x-auto hide-scroll pb-4 snap-x snap-mandatory w-[85vw] md:w-full max-w-full -ml-1 pl-1">
                          {msg.menus.map((menu, idx) => (
                            <div
                              key={idx}
                              className="snap-start min-w-[200px] md:min-w-[240px] bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer hover:border-red-500/50 hover:shadow-[0_10px_30px_rgba(193,18,31,0.2)] transition-all flex flex-col"
                            >
                              <div className="h-32 md:h-36 overflow-hidden relative bg-[#111] shrink-0">
                                <img
                                  src={menu.image}
                                  alt={menu.nama}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
                                <div className="absolute bottom-2 left-3 bg-[#C1121F] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                  Rp {menu.harga}
                                </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-white text-sm md:text-[15px] line-clamp-1 mb-1.5 tracking-tight group-hover:text-[#C1121F] transition-colors">
                                    {menu.nama}
                                  </h4>
                                  <p className="text-gray-400 text-[11px] md:text-xs line-clamp-2 leading-relaxed">
                                    {menu.deskripsi}
                                  </p>
                                </div>
                                
                                {/* Eksekusi Fungsi Pindah Tanpa Sentuh page.tsx */}
                                <button 
                                  onClick={handlePindahKeMenu} 
                                  className="mt-4 w-full flex items-center justify-between gap-1 text-[11px] font-bold text-gray-500 group-hover:text-[#C1121F] transition-colors cursor-pointer"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <ShoppingBag size={12} /> Pesan Menu
                                  </span>
                                  <ChevronRight size={12} />
                                </button>

                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.catatan && (
                        <div className="mt-4 bg-[#0a0a0a] border border-white/5 px-3 py-2.5 rounded-xl flex items-start gap-2.5 text-xs text-gray-400">
                          <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-mono text-[10px]">{msg.catatan}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-2 font-bold px-2 uppercase tracking-widest">
                      {msg.sender === "user" ? "Anda" : "Sadjodo AI"}
                    </span>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start">
                    <div className="bg-[#111]/80 border border-white/10 rounded-3xl rounded-tl-sm px-5 py-4 flex gap-2 shadow-xl backdrop-blur-xl items-center">
                      <div className="w-2 h-2 bg-[#C1121F] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-12 z-20">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-4 snap-x">
                    {SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSendMessage(sug)}
                        className="snap-start whitespace-nowrap px-5 py-2.5 bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 hover:border-red-500/50 transition-all active:scale-95"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex items-end gap-3 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 focus-within:border-red-500/50 focus-within:shadow-[0_0_20px_rgba(193,18,31,0.15)] transition-all">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(inputMessage);
                        }
                      }}
                      placeholder="Tanya menu, cabang, atau promo hari ini..."
                      className="w-full bg-transparent pl-4 pr-2 py-3.5 text-white placeholder:text-gray-500 focus:outline-none resize-none min-h-[50px] max-h-[120px] hide-scroll text-[15px] font-medium leading-relaxed"
                      rows={1}
                    />
                    <button
                      onClick={() => handleSendMessage(inputMessage)}
                      disabled={!inputMessage.trim() || isLoading}
                      className="shrink-0 w-12 h-12 bg-[#C1121F] hover:bg-red-700 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-[0_0_15px_rgba(193,18,31,0.4)]"
                    >
                      <Send size={18} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          animate={controls}
          onDragEnd={handleDragEnd}
          dragConstraints={{
            left: -(winWidth - buttonWidth),
            right: 0,
            top: -winHeight / 2 + 80,
            bottom: winHeight / 2 - 80,
          }}
          initial={{ x: 0 }}
          className="fixed top-[45%] right-0 z-[100] cursor-grab active:cursor-grabbing"
        >
          <button
            onClick={() => setIsOpen(true)}
            className={`w-9 h-36 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center uppercase transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.5)] group hover:bg-[#111] ${
              side === "right"
                ? "rounded-l-2xl border-r-0 hover:shadow-[-5px_0_20px_rgba(193,18,31,0.2)]"
                : "rounded-r-2xl border-l-0 hover:shadow-[5px_0_20px_rgba(193,18,31,0.2)]"
            }`}
          >
            <div className="w-7 h-7 bg-gradient-to-br from-[#C1121F] to-red-900 rounded-full flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(193,18,31,0.5)] border border-red-500/50">
              <Bot size={14} />
            </div>
            <span
              className="text-gray-400 font-bold text-[10px] tracking-[0.25em] group-hover:text-white transition-colors"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              AI ASSISTANT
            </span>
          </button>
        </motion.div>
      )}
    </>
  );
}
"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, MessageSquare, Info, Bot, Zap } from "lucide-react";

// Definisi tipe data
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

const SUGGESTIONS = ["Menu Terlaris?", "Jam Buka?", "Lokasi?", "Promo?"];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Halo Kak! 👋 Saya Sadjodo AI Assistant. Ada yang bisa saya bantu untuk pesanan hari ini?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
  }, [messages, isOpen, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    setMessages((prev) => [...prev, { id: Date.now(), text, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: data.jawaban,
          sender: "bot",
          menus: data.menus || [],
          catatan: data.catatan !== "-" ? data.catatan : undefined,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Maaf Kak, sistem AI kami sedang gangguan. 🙏",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            // Tinggi dikurangi (h-[520px]) agar tidak terlalu atas
            className="fixed bottom-24 right-6 lg:right-8 w-[90vw] md:w-[400px] h-[520px] max-h-[80vh] bg-[#020617]/90 backdrop-blur-3xl border border-cyan-500/30 rounded-[2rem] shadow-[0_20px_60px_rgba(6,182,212,0.2)] z-[100] flex flex-col overflow-hidden font-sans"
          >
            {/* --- BACKGROUND GLOW EFFECTS --- */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-cyan-500/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-600/15 rounded-full blur-[80px] pointer-events-none" />

            {/* --- HEADER (Modern Glass Cyan Theme) --- */}
            <div className="relative bg-[#020617]/60 px-6 py-5 flex justify-between items-center text-white shrink-0 border-b border-cyan-500/20 backdrop-blur-xl z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-40 animate-pulse rounded-full" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-white/20">
                    <Bot size={24} className="text-white drop-shadow-md" />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-[15px] tracking-wide flex items-center gap-1.5 leading-tight">
                    Sadjodo AI
                    <Sparkles size={14} className="text-cyan-400 fill-cyan-400" />
                  </h3>
                  <p className="text-[11px] text-cyan-200/80 flex items-center gap-1.5 mt-0.5 font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 bg-white/5 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-100 transition-all hover:rotate-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* --- CHAT SPACE --- */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide relative z-10"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.sender === "user" ? (
                    /* User Bubble (Cyan Gradient Glossy) */
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-[85%] bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-5 py-3.5 rounded-[1.5rem] rounded-br-sm text-[13px] shadow-[0_8px_25px_rgba(6,182,212,0.3)] border border-cyan-300/30 relative overflow-hidden"
                    >
                      {/* Glass Shimmer Overlay */}
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                      <span className="relative z-10 font-medium leading-relaxed">{msg.text}</span>
                    </motion.div>
                  ) : (
                    /* Bot Space */
                    <div className="max-w-[90%] w-full flex flex-col gap-2">
                      {/* Bot Label */}
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest pl-2 flex items-center gap-1.5">
                        <Bot size={12} /> Sadjodo AI
                      </span>

                      {/* Bot Text Bubble (Dark Glass) */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[13px] text-cyan-50 leading-relaxed bg-[#0f172a]/90 backdrop-blur-md border border-cyan-500/20 px-5 py-3.5 rounded-[1.5rem] rounded-tl-sm self-start shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden"
                      >
                         <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-600/10 rounded-full blur-[20px] pointer-events-none" />
                        <span className="relative z-10">{msg.text}</span>
                      </motion.div>

                      {/* Bot Menu Cards (Modern Hover Effect) */}
                      {msg.menus && msg.menus.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 w-full snap-x mask-linear-fade">
                          {msg.menus.map((m, i) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={i}
                              className="min-w-[170px] w-[170px] bg-gradient-to-br from-[#0f172a] to-[#020617] border border-cyan-500/20 rounded-2xl overflow-hidden shrink-0 snap-center shadow-lg hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 transition-all group cursor-pointer"
                            >
                              <div className="h-28 relative overflow-hidden">
                                <img
                                  src={m.image}
                                  alt={m.nama}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2 bg-cyan-500/90 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-[10px] font-black shadow-[0_4px_15px_rgba(6,182,212,0.4)] border border-cyan-300/30">
                                  Rp {m.harga}
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="text-white text-[12px] font-bold mb-1 truncate tracking-tight">
                                  {m.nama}
                                </h4>
                                <p className="text-cyan-200/60 text-[10px] line-clamp-2 leading-relaxed">
                                  {m.deskripsi}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Bot Note/Catatan (Pill Style) */}
                      {msg.catatan && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[10px] text-cyan-100 font-medium bg-cyan-950/40 border border-cyan-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2 self-start mt-1 backdrop-blur-sm shadow-inner"
                        >
                          <Info size={14} className="text-cyan-400 shrink-0" />
                          <span className="leading-tight">{msg.catatan}</span>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#0f172a]/90 border border-cyan-500/20 px-5 py-4 rounded-[1.5rem] rounded-tl-sm flex gap-1.5 items-center shadow-lg">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-4 bg-[#020617] border-t border-cyan-500/10 shrink-0 relative z-10">
              {/* Quick Suggestions */}
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar mask-linear-fade pr-4">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend(s)}
                    className="shrink-0 text-[11px] bg-[#0f172a] hover:bg-cyan-900/40 border border-cyan-500/20 hover:border-cyan-400/50 px-4 py-2 rounded-xl text-cyan-100 hover:text-white transition-all font-bold shadow-sm"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
              
              {/* Input Field */}
              <div className="flex items-center gap-2 bg-[#0a0f1e] border border-cyan-500/20 focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-500/30 rounded-2xl p-1.5 transition-all shadow-inner group">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Tanya Sadjodo AI..."
                  className="flex-1 bg-transparent text-[13px] text-white px-3 focus:outline-none placeholder:text-gray-500 font-medium"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <Send size={16} className="ml-0.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING BUTTON (KAPSUL KANAN BAWAH) --- */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 flex items-center gap-3.5 bg-[#020617]/90 backdrop-blur-xl border border-cyan-500/40 pl-2.5 pr-6 py-2.5 rounded-full shadow-[0_15px_40px_rgba(6,182,212,0.3)] z-[100] group overflow-hidden"
        >
          {/* Efek Kilauan Kaca di Tombol Kapsul */}
          <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          
          <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/40">
            <MessageSquare size={20} className="text-white fill-white group-hover:scale-110 transition-transform" />
            {/* Indikator Online Hijau di Ikon */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#020617] rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
          </div>
          
          <div className="flex flex-col items-start pr-1">
            <span className="text-white font-black text-[14px] tracking-wide flex items-center gap-1.5 leading-tight">
              Sadjodo AI
            </span>
            <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
              Assistant
            </span>
          </div>
        </motion.button>
      )}
    </>
  );
}
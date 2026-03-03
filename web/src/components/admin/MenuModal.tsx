// src/components/admin/MenuModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, ChevronDown } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { FormField, inputClass } from "./FormField";

interface MenuModalProps {
    menu: Partial<MenuItem> | null;
    onClose: () => void;
    onSave: () => void;
}

const KATEGORI_OPTIONS = ["Sate", "Karbo", "Camilan", "Minuman"];

// ─── Helper: parse number input — buang leading zero, return 0 jika kosong/NaN
function parseNum(val: string): number {
    const n = parseInt(val.replace(/^0+(?=\d)/, ""), 10);
    return isNaN(n) ? 0 : n;
}

// ─── Custom Dropdown agar tidak terpotong oleh `overflow-y-auto` modal
function KategoriSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={
                    inputClass +
                    " flex items-center justify-between text-left pr-3 cursor-pointer"
                }
            >
                <span>{value}</span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown — ditempatkan di `fixed` agar tidak terpotong overflow */}
            <AnimatePresence>
                {open && (
                    <motion.ul
                        initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                        transition={{ duration: 0.12 }}
                        style={{ transformOrigin: "top" }}
                        className="absolute left-0 right-0 mt-2 z-[9999] bg-zinc-900 border border-white/15 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
                    >
                        {KATEGORI_OPTIONS.map((k) => (
                            <li
                                key={k}
                                onClick={() => { onChange(k); setOpen(false); }}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${value === k
                                        ? "bg-cyan-500/20 text-cyan-400 font-bold"
                                        : "text-gray-200 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {k}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

export const MenuModal: React.FC<MenuModalProps> = ({ menu, onClose, onSave }) => {
    const isEdit = !!menu?.id;

    const [form, setForm] = useState({
        nama: menu?.nama ?? "",
        deskripsi: menu?.deskripsi ?? "",
        kategori: menu?.kategori ?? "Sate",
        protein: menu?.protein ?? "Ayam",
        image: menu?.image ?? "",
        harga: menu?.harga ?? 0,
        stok: menu?.stok ?? 100,
        low_stock_threshold: menu?.low_stock_threshold ?? 10,
        level_pedas_min: menu?.level_pedas_min ?? 0,
        level_pedas_max: menu?.level_pedas_max ?? 5,
        kalori: menu?.kalori ?? 0,
        favorit: menu?.favorit ?? false,
        tersedia: menu?.tersedia ?? true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((p) => ({ ...p, [key]: value }));

    // Helper khusus input angka — buang leading zero setiap keystroke
    const setNum = (key: "harga" | "stok" | "low_stock_threshold" | "level_pedas_min" | "level_pedas_max" | "kalori") =>
        (e: React.ChangeEvent<HTMLInputElement>) => set(key, parseNum(e.target.value));

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const url = isEdit ? `/api/admin/menu/${menu!.id}` : "/api/admin/menu";
            const method = isEdit ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form), // semua angka sudah number di state
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Gagal menyimpan"); return; }
            onSave();
        } catch {
            setError("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-zinc-950 border border-white/10 rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-white font-bold text-lg">
                        {isEdit ? "Edit Menu" : "Tambah Menu Baru"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-red-500/20 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body — overflow-y-auto di sini, tapi dropdown menggunakan absolute z-[9999] */}
                <div className="p-6 overflow-y-auto max-h-[70vh] grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nama Menu">
                        <input
                            className={inputClass}
                            value={form.nama}
                            onChange={(e) => set("nama", e.target.value)}
                            placeholder="Sate Taichan..."
                        />
                    </FormField>

                    {/* Custom dropdown — tidak terpotong overflow */}
                    <FormField label="Kategori">
                        <KategoriSelect
                            value={form.kategori}
                            onChange={(val) => set("kategori", val)}
                        />
                    </FormField>

                    <FormField label="Protein">
                        <input
                            className={inputClass}
                            value={form.protein}
                            onChange={(e) => set("protein", e.target.value)}
                            placeholder="Ayam"
                        />
                    </FormField>

                    <FormField label="Harga (Rp)">
                        <input
                            className={inputClass}
                            type="number"
                            min={0}
                            value={form.harga || ""}
                            onChange={setNum("harga")}
                            placeholder="0"
                        />
                    </FormField>

                    <FormField label="Stok">
                        <input
                            className={inputClass}
                            type="number"
                            min={0}
                            value={form.stok || ""}
                            onChange={setNum("stok")}
                            placeholder="0"
                        />
                    </FormField>

                    <FormField label="Ambang Stok Rendah">
                        <input
                            className={inputClass}
                            type="number"
                            min={0}
                            value={form.low_stock_threshold || ""}
                            onChange={setNum("low_stock_threshold")}
                            placeholder="10"
                        />
                    </FormField>

                    <FormField label="Level Pedas Min">
                        <input
                            className={inputClass}
                            type="number"
                            min={0}
                            max={10}
                            value={form.level_pedas_min === 0 ? "" : form.level_pedas_min}
                            onChange={setNum("level_pedas_min")}
                            placeholder="0"
                        />
                    </FormField>

                    <FormField label="Level Pedas Max">
                        <input
                            className={inputClass}
                            type="number"
                            min={0}
                            max={10}
                            value={form.level_pedas_max || ""}
                            onChange={setNum("level_pedas_max")}
                            placeholder="5"
                        />
                    </FormField>

                    <FormField label="Kalori (kkal)">
                        <input
                            className={inputClass}
                            type="number"
                            min={0}
                            value={form.kalori || ""}
                            onChange={setNum("kalori")}
                            placeholder="0"
                        />
                    </FormField>

                    <FormField label="URL Gambar">
                        <input
                            className={inputClass}
                            value={form.image ?? ""}
                            onChange={(e) => set("image", e.target.value)}
                            placeholder="https://..."
                        />
                    </FormField>

                    <div className="md:col-span-2">
                        <FormField label="Deskripsi">
                            <textarea
                                className={inputClass + " resize-none"}
                                rows={2}
                                value={form.deskripsi ?? ""}
                                onChange={(e) => set("deskripsi", e.target.value)}
                            />
                        </FormField>
                    </div>

                    {/* Toggle switches */}
                    <div className="flex gap-6 md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div
                                onClick={() => set("favorit", !form.favorit)}
                                className={`w-10 h-6 rounded-full relative transition-all ${form.favorit ? "bg-amber-500" : "bg-white/10"}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.favorit ? "left-5" : "left-1"}`} />
                            </div>
                            <span className="text-sm text-gray-300">Favorit</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div
                                onClick={() => set("tersedia", !form.tersedia)}
                                className={`w-10 h-6 rounded-full relative transition-all ${form.tersedia ? "bg-emerald-500" : "bg-white/10"}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.tersedia ? "left-5" : "left-1"}`} />
                            </div>
                            <span className="text-sm text-gray-300">Tersedia</span>
                        </label>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-xl text-white font-bold hover:bg-white/20 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 bg-linear-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {isEdit ? "Simpan Perubahan" : "Tambah Menu"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

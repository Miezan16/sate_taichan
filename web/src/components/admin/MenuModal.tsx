"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2, Upload, Package, DollarSign, Tag, Info } from "lucide-react";
import { MenuItem } from "@/lib/types";

interface MenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    menu?: MenuItem | null;
}

export const MenuModal = ({ isOpen, onClose, onSave, menu }: MenuModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nama: "",
        deskripsi: "",
        harga: 0,
        stok: 0,
        kategori: "Sate",
        image: "",
        low_stock_threshold: 10,
        tersedia: true,
    });

    useEffect(() => {
        if (menu) {
            setFormData({
                nama: menu.nama || "",
                deskripsi: menu.deskripsi || "",
                harga: menu.harga || 0,
                stok: menu.stok || 0,
                kategori: menu.kategori || "Sate",
                image: menu.image || "",
                low_stock_threshold: menu.low_stock_threshold || 10,
                tersedia: menu.tersedia ?? true,
            });
        } else {
            setFormData({
                nama: "",
                deskripsi: "",
                harga: 0,
                stok: 0,
                kategori: "Sate",
                image: "",
                low_stock_threshold: 10,
                tersedia: true,
            });
        }
    }, [menu, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const url = menu?.id ? `/api/admin/menu/${menu.id}` : "/api/admin/menu";
            // FIX: Gunakan PATCH untuk edit (jika ada ID) dan POST untuk tambah baru
            const method = menu?.id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Gagal menyimpan data");
            }

            alert(menu?.id ? "Menu berhasil diperbarui!" : "Menu berhasil ditambahkan!");
            onSave();
            onClose();
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {menu ? "Edit Menu Sadjodo" : "Tambah Menu Baru"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Upload Gambar */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Foto Menu</label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center">
                                {formData.image ? (
                                    <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <Upload className="text-gray-600" />
                                )}
                            </div>
                            <input type="file" onChange={handleImageChange} accept="image/*" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Nama Menu</label>
                            <input required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none" placeholder="Sate Taichan Ori" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Kategori</label>
                            <select value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                                <option value="Sate">Sate</option>
                                <option value="Karbo">Karbo</option>
                                <option value="Camilan">Camilan</option>
                                <option value="Minuman">Minuman</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Harga (Rp)</label>
                            <input type="number" required value={formData.harga} onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Stok</label>
                            <input type="number" required value={formData.stok} onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Min. Stok (Alert)</label>
                            <input type="number" value={formData.low_stock_threshold} onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Deskripsi</label>
                        <textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none h-24" placeholder="Deskripsi rasa atau isi porsi..." />
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-400 font-medium hover:text-white transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-red-900/20">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Simpan Menu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
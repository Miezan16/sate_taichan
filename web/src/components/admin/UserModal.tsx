// src/components/admin/UserModal.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Loader2, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { UserRecord, CabangInfo } from "@/lib/types";
import { FormField, inputClass } from "./FormField";

type Role = "admin" | "kasir";

interface UserModalProps {
    user: Partial<UserRecord> | null;
    branches: CabangInfo[];
    onClose: () => void;
    onSave: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ user, branches, onClose, onSave }) => {
    const isEdit = !!user?.id;

    const [form, setForm] = useState({
        username: user?.username ?? "",
        password: "",
        role: (user?.role ?? "kasir") as Role,
        cabang_id: user?.cabang_id ?? (null as number | null),
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((p) => ({ ...p, [key]: value }));

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const url = isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users";
            const method = isEdit ? "PATCH" : "POST";
            const body: Record<string, unknown> = {
                username: form.username,
                role: form.role,
                cabang_id: form.cabang_id,
            };
            if (form.password) body.password = form.password;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Gagal menyimpan");
                return;
            }
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
                className="bg-zinc-950 border border-white/10 rounded-4xl w-full max-w-md shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-white font-bold text-lg">
                        {isEdit ? "Edit User" : "Tambah User Baru"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-red-500/20 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <FormField label="Username">
                        <input
                            className={inputClass}
                            value={form.username}
                            onChange={(e) => set("username", e.target.value)}
                            placeholder="kasir_baru"
                        />
                    </FormField>

                    <FormField
                        label={
                            isEdit
                                ? "Password (kosongkan jika tidak diubah)"
                                : "Password"
                        }
                    >
                        <div className="relative">
                            <input
                                className={inputClass + " pr-12"}
                                type={showPass ? "text" : "password"}
                                value={form.password}
                                onChange={(e) => set("password", e.target.value)}
                                placeholder={isEdit ? "••••••" : "Min 6 karakter"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass((p) => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </FormField>

                    <FormField label="Role">
                        <div className="grid grid-cols-2 gap-3">
                            {(["kasir", "admin"] as Role[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => set("role", r)}
                                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all capitalize ${form.role === r
                                            ? "border-cyan-500 bg-cyan-500/10 text-white"
                                            : "border-white/10 bg-white/5 text-gray-400"
                                        }`}
                                >
                                    {r === "admin" ? <ShieldCheck size={16} /> : <KeyRound size={16} />} {r}
                                </button>
                            ))}
                        </div>
                    </FormField>

                    <FormField label="Cabang (Opsional)">
                        <select
                            className={inputClass + " appearance-none"}
                            value={form.cabang_id ?? ""}
                            onChange={(e) =>
                                set("cabang_id", e.target.value ? Number(e.target.value) : null)
                            }
                        >
                            <option value="">— Tidak ada cabang —</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.nama_cabang}
                                </option>
                            ))}
                        </select>
                    </FormField>
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
                        className="flex-1 py-3 bg-linear-to-r from-violet-500 to-purple-600 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {isEdit ? "Simpan" : "Tambah User"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

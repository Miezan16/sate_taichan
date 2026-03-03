// src/components/admin/ConfirmModal.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

interface ConfirmModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-400" size={28} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-400 text-sm mb-6">{message}</p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                >
                    Batal
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
                >
                    Hapus
                </button>
            </div>
        </motion.div>
    </div>
);

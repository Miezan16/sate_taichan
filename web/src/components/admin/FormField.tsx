// src/components/admin/FormField.tsx
// Komponen field wrapper yang stabil (didefinisikan di luar komponen manapun)
import React from "react";

interface FormFieldProps {
    label: string;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
            {label}
        </label>
        {children}
    </div>
);

// Class string input yang sering dipakai — konstanta agar tidak di-recreate
export const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-all";

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChefHat, Users, LogOut, Loader2, Plus, Pencil, Trash2,
    AlertTriangle, Package, ShieldCheck, KeyRound,
    Activity, Search, RefreshCw, TrendingUp, ArrowUpDown,
} from "lucide-react";
import { MenuItem, UserRecord, ActivityLogEntry, CabangInfo } from "@/lib/types";

// ── Komponen modal yang stabil (didefinisikan di modul terpisah)
import { MenuModal } from "@/components/admin/MenuModal";
import { UserModal } from "@/components/admin/UserModal";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

// ==========================================
// HELPERS
// ==========================================
type Tab = "menu" | "users" | "log";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// ==========================================
// MENU TAB
// ==========================================
function MenuTab({ menus, onRefresh }: { menus: MenuItem[]; onRefresh: () => void }) {
    const [modalMenu, setModalMenu] = useState<Partial<MenuItem> | null>(null);
    const [confirm, setConfirm] = useState<MenuItem | null>(null);
    const [search, setSearch] = useState("");
    const [sortStok, setSortStok] = useState(false); // false = default, true = stok terendah dulu

    const filtered = menus
        .filter((m) => m.nama.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => sortStok ? a.stok - b.stok : 0);

    const handleDelete = async (menu: MenuItem) => {
        await fetch(`/api/admin/menu/${menu.id}`, { method: "DELETE" });
        onRefresh();
        setConfirm(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                        <Search size={16} className="text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari menu..."
                            className="bg-transparent outline-none text-sm text-white w-40 placeholder:text-gray-600"
                        />
                    </div>
                    {/* Tombol filter stok terendah */}
                    <button
                        onClick={() => setSortStok((p) => !p)}
                        title={sortStok ? "Reset urutan" : "Urutkan stok terendah"}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${sortStok
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        <ArrowUpDown size={14} />
                        Stok {sortStok ? "Terendah ▲" : "Terendah"}
                    </button>
                </div>
                <button
                    onClick={() => setModalMenu({})}
                    className="flex items-center gap-2 bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                    <Plus size={16} /> Tambah Menu
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                        <tr>
                            <th className="p-4 font-bold">Menu</th>
                            <th className="p-4 font-bold text-center">Stok</th>
                            <th className="p-4 font-bold text-right">Harga</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence>
                            {filtered.map((m) => (
                                <motion.tr
                                    key={m.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {m.image && (
                                                <img
                                                    src={m.image}
                                                    alt={m.nama}
                                                    className="w-10 h-10 rounded-xl object-cover bg-white/5"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                            )}
                                            <div>
                                                <p className="font-bold text-white text-sm">{m.nama}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    {m.kategori} · {m.protein}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${m.is_low_stock
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                : "bg-white/5 border-white/10 text-gray-300"
                                                }`}
                                        >
                                            {m.is_low_stock && (
                                                <AlertTriangle size={10} className="inline mr-1" />
                                            )}
                                            {m.stok}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-white">
                                        {formatRp(m.harga)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${m.tersedia
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-gray-500/10 text-gray-500"
                                                }`}
                                        >
                                            {m.tersedia ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => setModalMenu(m)}
                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirm(m)}
                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                                title="Hapus"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                        <Package size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-bold">Tidak ada menu ditemukan</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modalMenu !== null && (
                <MenuModal
                    menu={modalMenu}
                    onClose={() => setModalMenu(null)}
                    onSave={() => { setModalMenu(null); onRefresh(); }}
                />
            )}
            {confirm && (
                <ConfirmModal
                    message={`Hapus menu "${confirm.nama}"? Menu tidak akan muncul di daftar pelanggan, tetapi data tetap tersimpan.`}
                    onConfirm={() => handleDelete(confirm)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
}

// ==========================================
// USERS TAB
// ==========================================
function UsersTab({
    users,
    branches,
    onRefresh,
}: {
    users: UserRecord[];
    branches: CabangInfo[];
    onRefresh: () => void;
}) {
    const [modalUser, setModalUser] = useState<Partial<UserRecord> | null>(null);
    const [confirm, setConfirm] = useState<UserRecord | null>(null);

    const handleDelete = async (user: UserRecord) => {
        await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
        onRefresh();
        setConfirm(null);
    };

    const roleBadge = (role: string) =>
        role === "admin" ? (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center gap-1">
                <ShieldCheck size={10} /> Admin
            </span>
        ) : (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center gap-1">
                <KeyRound size={10} /> Kasir
            </span>
        );

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setModalUser({})}
                    className="flex items-center gap-2 bg-linear-to-r from-violet-500 to-purple-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                >
                    <Plus size={16} /> Tambah User
                </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                        <tr>
                            <th className="p-4 font-bold">User</th>
                            <th className="p-4 font-bold text-center">Role</th>
                            <th className="p-4 font-bold">Cabang</th>
                            <th className="p-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-white">{u.username}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">{roleBadge(u.role)}</div>
                                </td>
                                <td className="p-4 text-gray-400 text-xs">
                                    {u.cabang?.nama_cabang ?? (
                                        <span className="text-gray-600 italic">Tidak ada</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => setModalUser(u)}
                                            className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => setConfirm(u)}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {modalUser !== null && (
                <UserModal
                    user={modalUser}
                    branches={branches}
                    onClose={() => setModalUser(null)}
                    onSave={() => { setModalUser(null); onRefresh(); }}
                />
            )}
            {confirm && (
                <ConfirmModal
                    message={`Hapus user "${confirm.username}"? Tindakan ini tidak bisa dibatalkan.`}
                    onConfirm={() => handleDelete(confirm)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
}

// ==========================================
// LOG TAB
// ==========================================
function LogTab({ logs }: { logs: ActivityLogEntry[] }) {
    const actionColor: Record<string, string> = {
        CREATE_MENU: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        DELETE_MENU: "text-red-400 bg-red-500/10 border-red-500/30",
        UPDATE_PRICE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        UPDATE_STOCK: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    };
    return (
        <div className="h-full overflow-y-auto bg-white/5 border border-white/10 rounded-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
            <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-400 text-[10px] uppercase sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                    <tr>
                        <th className="p-4 font-bold">Waktu</th>
                        <th className="p-4 font-bold">Aksi</th>
                        <th className="p-4 font-bold">Entity</th>
                        <th className="p-4 font-bold">Old Value</th>
                        <th className="p-4 font-bold">New Value</th>
                        <th className="p-4 font-bold">User</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString("id-ID")}
                            </td>
                            <td className="p-4">
                                <span
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${actionColor[log.action] ?? "text-gray-400 bg-white/5 border-white/10"
                                        }`}
                                >
                                    {log.action}
                                </span>
                            </td>
                            <td className="p-4 text-gray-300 text-xs">
                                {log.entity} #{log.entity_id}
                            </td>
                            <td className="p-4 text-gray-500 text-xs font-mono max-w-[140px] truncate">
                                {log.old_value ?? "—"}
                            </td>
                            <td className="p-4 text-gray-300 text-xs font-mono max-w-[140px] truncate">
                                {log.new_value ?? "—"}
                            </td>
                            <td className="p-4 text-gray-400 text-xs">
                                {log.user?.username ?? (log.user_id ? `User #${log.user_id}` : "—")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                    <Activity size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold">Belum ada log aktivitas</p>
                </div>
            )}
        </div>
    );
}

// ==========================================
// MAIN DASHBOARD
// ==========================================
export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("menu");
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [branches, setBranches] = useState<CabangInfo[]>([]);
    const [adminName, setAdminName] = useState("");
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const lowStockCount = menus.filter((m) => m.is_low_stock).length;
    const activeMenuCount = menus.filter((m) => m.tersedia).length;

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [menuRes, userRes, logRes, branchRes, meRes] = await Promise.all([
                fetch("/api/admin/menu"),
                fetch("/api/admin/users"),
                fetch("/api/admin/log"),
                fetch("/api/cabang"),
                fetch("/api/auth/me"),
            ]);
            if (!meRes.ok) { router.push("/login"); return; }
            const meData = await meRes.json();
            setAdminName(meData.username);
            if (menuRes.ok) setMenus(await menuRes.json());
            if (userRes.ok) setUsers(await userRes.json());
            if (logRes.ok) setLogs(await logRes.json());
            if (branchRes.ok) {
                const b = await branchRes.json();
                setBranches(Array.isArray(b) ? b : [b]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: "menu", label: "Menu", icon: ChefHat, badge: lowStockCount > 0 ? lowStockCount : undefined },
        { id: "users", label: "Users", icon: Users },
        { id: "log", label: "Log", icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505]">

            {/* SIDEBAR */}
            <aside className="w-20 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 z-40 shadow-2xl sticky top-0 h-screen">
                <div className="mb-8 p-3 bg-linear-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                    <ShieldCheck className="text-white" size={24} />
                </div>
                <nav className="flex flex-col gap-4 w-full px-3 flex-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                ? "bg-white/10 text-white border border-white/10"
                                : "text-gray-500 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <tab.icon
                                size={20}
                                className={`transition-transform ${activeTab === tab.id ? "scale-110 text-violet-400" : "group-hover:scale-110"
                                    }`}
                            />
                            <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                            {tab.badge && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-black flex items-center justify-center">
                                    {tab.badge}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="adminActiveTab"
                                    className="absolute left-0 w-1 h-8 bg-violet-400 rounded-full"
                                    style={{ top: "50%", transform: "translateY(-50%)" }}
                                />
                            )}
                        </button>
                    ))}
                </nav>
                <div className="w-full px-3 mt-auto">
                    <div className="flex flex-col items-center gap-1 mb-4">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">
                            {adminName ? adminName[0].toUpperCase() : "?"}
                        </div>
                        <span className="text-[9px] text-gray-500 font-medium text-center truncate w-full">
                            {adminName || "..."}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                        {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                        <span className="text-[9px] font-bold">Keluar</span>
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="px-8 py-5 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-sm z-10">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            ADMIN
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-purple-500">
                                {" "}PANEL
                            </span>
                        </h1>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                            Manajemen menu, pengguna &amp; sistem
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">
                                {activeMenuCount} Menu Aktif
                            </span>
                        </div>
                        {lowStockCount > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-400" />
                                <span className="text-xs font-bold text-amber-400">
                                    {lowStockCount} Stok Rendah
                                </span>
                            </div>
                        )}
                        <button
                            onClick={fetchAll}
                            disabled={loading}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-8 overflow-hidden">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 size={40} className="animate-spin text-violet-400" />
                                <p className="text-gray-500 text-sm">Memuat data...</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col"
                            >
                                {activeTab === "menu" && <MenuTab menus={menus} onRefresh={fetchAll} />}
                                {activeTab === "users" && (
                                    <UsersTab users={users} branches={branches} onRefresh={fetchAll} />
                                )}
                                {activeTab === "log" && <LogTab logs={logs} />}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
}

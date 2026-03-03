// src/lib/types.ts

export interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  deskripsi?: string | null;
  image?: string | null;
  kategori: string;
  tersedia: boolean;
  level_pedas_min: number;
  level_pedas_max: number;
  kalori: number;
  stok: number;
  low_stock_threshold: number;
  favorit: boolean;
  protein: string;
  deleted_at?: string | null;
  is_low_stock?: boolean;   // flag dari API, bukan dari DB
}

export interface UserRecord {
  id: number;
  username: string;
  role: 'admin' | 'kasir';
  cabang_id?: number | null;
  cabang?: { id: number; nama_cabang: string } | null;
}

export interface ActivityLogEntry {
  id: number;
  user_id?: number | null;
  action: string;
  entity: string;
  entity_id: number;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  user?: { username: string } | null;
}

export interface CabangInfo {
  id: number;
  nama_cabang: string;
  alamat: string;
  telepon?: string | null;
  link_maps?: string | null;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp?: Date;
}

export interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}
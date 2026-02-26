// src/lib/types.ts

export interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  deskripsi: string;
  image_url: string;
  kategori: string;
  tersedia: boolean;
  level_pedas_min: number;
  level_pedas_max: number;
  is_best_seller: boolean;
  protein: number;
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
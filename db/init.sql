-- db/init.sql

CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100),
  deskripsi TEXT,
  protein VARCHAR(50),
  harga INTEGER,
  level_pedas_min INTEGER,
  level_pedas_max INTEGER,
  kalori INTEGER,
  favorit BOOLEAN DEFAULT false,
  tersedia BOOLEAN DEFAULT true
);

INSERT INTO menus (nama, protein, harga, level_pedas_min, level_pedas_max, favorit, tersedia) VALUES
('Sate Taichan Original', 'Ayam', 25000, 0, 5, true, true),
('Sate Taichan Jumbo', 'Ayam', 35000, 3, 7, true, true),
('Sate Taichan Kulit', 'Kulit Ayam', 28000, 2, 8, false, true);

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'kasir');

-- CreateEnum
CREATE TYPE "StatusPesanan" AS ENUM ('PENDING', 'PROCESSING', 'UNPAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('CASH', 'EWALLET');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'kasir',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'Sate',
    "image" TEXT,
    "protein" TEXT NOT NULL DEFAULT 'Ayam',
    "harga" INTEGER NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 100,
    "level_pedas_min" INTEGER NOT NULL DEFAULT 0,
    "level_pedas_max" INTEGER NOT NULL DEFAULT 5,
    "kalori" INTEGER NOT NULL DEFAULT 0,
    "favorit" BOOLEAN NOT NULL DEFAULT false,
    "tersedia" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaksi" (
    "id" SERIAL NOT NULL,
    "kasir_id" INTEGER,
    "kasir_nama" TEXT,
    "nama_pelanggan" TEXT NOT NULL,
    "nomor_meja" TEXT NOT NULL,
    "status" "StatusPesanan" NOT NULL DEFAULT 'PENDING',
    "metode_pembayaran" "MetodePembayaran",
    "total_harga" INTEGER NOT NULL,
    "uang_bayar" INTEGER,
    "kembalian" INTEGER,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiItem" (
    "id" SERIAL NOT NULL,
    "transaksi_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_satuan" INTEGER NOT NULL,

    CONSTRAINT "TransaksiItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cabang" (
    "id" SERIAL NOT NULL,
    "nama_cabang" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "link_maps" TEXT,
    "telepon" TEXT,

    CONSTRAINT "Cabang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_kasir_id_fkey" FOREIGN KEY ("kasir_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiItem" ADD CONSTRAINT "TransaksiItem_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "Transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiItem" ADD CONSTRAINT "TransaksiItem_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

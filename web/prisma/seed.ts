import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🍢 Resetting database dan mengisi 20 menu terpilih...");
  
  await prisma.transaksiItem.deleteMany();
  await prisma.transaksi.deleteMany();
  await prisma.menu.deleteMany();

  const menu20 = [
    // --- SATE (8 Menu) ---
    { nama: "Sate Taichan Daging", harga: 25000, kategori: "Sate", protein: "Ayam", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", favorit: true, deskripsi: "Daging ayam fillet premium." },
    { nama: "Sate Taichan Kulit", harga: 22000, kategori: "Sate", protein: "Ayam", image: "https://images.unsplash.com/photo-1626074353765-517a681e40be", favorit: true, deskripsi: "Kulit ayam krispi gurih." },
    { nama: "Sate Taichan Campur", harga: 28000, kategori: "Sate", protein: "Ayam", image: "https://images.unsplash.com/photo-1544025162-d76694265947", favorit: true, deskripsi: "5 Daging + 5 Kulit." },
    { nama: "Sate Taichan Sapi", harga: 45000, kategori: "Sate", protein: "Sapi", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143", deskripsi: "Daging sapi meltique empuk." },
    { nama: "Sate Mozzarella", harga: 35000, kategori: "Sate", protein: "Ayam", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba", favorit: true, deskripsi: "Sate ayam topping keju lumer." },
    
    // --- KARBO (4 Menu) ---
    { nama: "Lontong", harga: 5000, kategori: "Karbo", protein: "Karbo", image: "https://images.unsplash.com/photo-1626074353765-517a681e40be", favorit: true, deskripsi: "Lontong daun pisang." },
    { nama: "Nasi Daun Jeruk", harga: 10000, kategori: "Karbo", protein: "Karbo", image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6", favorit: true, deskripsi: "Nasi aromatik wangi jeruk." },
    { nama: "Indomie Goreng Taichan", harga: 18000, kategori: "Karbo", protein: "Karbo", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", deskripsi: "Mie goreng sambal pedas." },

    // --- CAMILAN (4 Menu) ---
    { nama: "Kulit Ayam Krispi", harga: 20000, kategori: "Camilan", protein: "Ayam", image: "https://images.unsplash.com/photo-1562967914-01efa7e87a32", favorit: true, deskripsi: "Kulit ayam goreng tepung." },
    { nama: "Tahu Cabai Garam", harga: 15000, kategori: "Camilan", protein: "Tahu", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", deskripsi: "Tahu sutra pedas asin." },
    { nama: "Ceker Mercon", harga: 18000, kategori: "Camilan", protein: "Ayam", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0", deskripsi: "Ceker tanpa tulang pedas." },
    { nama: "Dimsum Bakar", harga: 20000, kategori: "Camilan", protein: "Ayam", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c", deskripsi: "4 pcs dimsum bakar." },

    // --- MINUMAN (4 Menu) ---
    { nama: "Es Teh Manis", harga: 5000, kategori: "Minuman", protein: "Minuman", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc", favorit: true, deskripsi: "Teh seduh segar." },
    { nama: "Es Jeruk Peras", harga: 10000, kategori: "Minuman", protein: "Minuman", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423", deskripsi: "Jeruk murni segar." },
    { nama: "Es Yakult Leci", harga: 18000, kategori: "Minuman", protein: "Minuman", image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c", favorit: true, deskripsi: "Leci dan yakult segar." },
  ];

  for (const item of menu20) {
    await prisma.menu.create({
      data: {
        ...item,
        stok: 100,
        level_pedas_min: 0,
        level_pedas_max: 5,
        kalori: Math.floor(Math.random() * 300) + 100,
        tersedia: true,
      },
    });
  }

  console.log("✅ Berhasil memasukkan 20 menu!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
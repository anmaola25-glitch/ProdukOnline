```markdown
# Nasa Skincare — Website Toko Online (Diperbarui)

Versi ini menambahkan:
- Navigasi: Beranda | Kategori | BestSeler | Promo | Kontak | Checkout | Admin
- Halaman terpisah: kategori.html, bestseller.html, promo.html, kontak.html, checkout.html, admin.html
- Admin demo: login (password: admin123) + dashboard untuk menambah/hapus produk (disimpan di localStorage)
- Checkout halaman terpisah menampilkan ringkasan keranjang dan form order
- Produk dapat diubah oleh admin dan disimpan di localStorage (menggantikan products.json pada browser)

File penting:
- index.html, kategori.html, bestseller.html, promo.html, kontak.html, checkout.html, admin.html
- styles.css — styling bersama
- script.js — logika produk, filter, keranjang, checkout
- products.json — data initial
- README.md — instruksi ini

Menjalankan di lokal:
1. Simpan semua file di satu folder.
2. Jalankan server statis: `python -m http.server 8000`
3. Buka browser: `http://localhost:8000`

Catatan keamanan & produksi:
- Admin login ini hanya demo (password tersimpan di client). Untuk produksi, gunakan backend dengan autentikasi aman.
- Untuk menyimpan produk permanen, implementasikan API/DB atau gunakan layanan seperti Firebase.
- Untuk pembayaran, integrasikan gateway pembayaran (Midtrans, Stripe, dll).

Butuh bantuan lanjutan?
- Saya bisa: deploy ke GitHub Pages, tambahkan autentikasi backend (Node/Express + MongoDB atau Firebase), atau integrasikan pembayaran.
- Ingin saya modifikasi desain warna / menambahkan logo? Kirim file logo dan preferensi warna.
```
# Perpustakaan Digital – buku-perpustakaan

**Perpustakaan Digital** adalah aplikasi web sederhana untuk manajemen peminjaman buku berbasis web dengan integrasi Firebase Firestore. Cocok untuk kebutuhan perpustakaan kecil, sekolah, komunitas, atau demo konsep peminjaman buku online.

---

## Fitur

- **Daftar Buku**: Menampilkan koleksi buku yang tersedia (dummy data dapat ditambah otomatis).
- **Peminjaman Buku**: Formulir untuk meminjam satu atau beberapa buku yang tersedia.
- **Riwayat Peminjaman**: Melihat daftar riwayat peminjaman.
- **Panel Admin**: Login admin untuk menambah/edit/hapus buku dan mengelola peminjaman.
- **Firebase Firestore**: Data tersimpan di database cloud gratis dari Firebase.
- **Manajemen Denda**: Otomatis menghitung keterlambatan dan denda.

---

## Teknologi & Kebutuhan

- **HTML5, CSS, JavaScript** (Vanilla)
- **Firebase (Firestore & Auth)**
- **Tidak perlu instalasi package NPM, cukup browser modern**

---

## Cara Menjalankan

### 1. Clone/download repositori ini

```bash
git clone https://github.com/semfck/buku-perpustakaan.git
cd buku-perpustakaan
```

### 2. Siapkan Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/), buat project baru.
2. Aktifkan **Firestore Database** dan **Authentication (Email/Password)**.
3. Salin konfigurasi (`apiKey`, dsb) dari proyek Firebase Anda.
4. Ganti konfigurasi di bagian awal file `main.js`:
    ```js
    // Firebase config dan inisialisasi
    const firebaseConfig = {
      apiKey: "...",
      authDomain: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "...",
      measurementId: "..."
    };
    firebase.initializeApp(firebaseConfig);
    ```

### 3. Jalankan di Browser

Cukup buka `index.html` dengan browser modern (Chrome, Firefox, Edge, dsb).

> **Tips:** Bisa langsung klik 2x file `index.html` atau buka dengan `Live Server` (VSCode Extension) untuk pengalaman terbaik.

### 4. Login Admin

- Email admin default: `admin@domain.com`
- Password: **Buat user ini di Firebase Auth > Users** (atau edit di `main.js`)
- Setelah login sebagai admin, fitur tambah/edit/hapus buku akan muncul.

---

## Struktur Berkas

```
.
├── index.html      # Halaman utama web
├── style.css       # Styling halaman
├── main.js         # Logika aplikasi (Firebase, UI, dll)
├── favicon.svg     # Logo perpustakaan
└── README.md       # Dokumentasi ini
```

---

## Catatan Tambahan

- **Dummy Buku**: Jika koleksi buku kosong, data dummy otomatis dimasukkan ke Firestore saat pertama kali dijalankan.
- **Dapat dihosting di Netlify/Vercel/GitHub Pages** (bila perlu, cukup upload semua file).
- **Konfigurasi Firebase** bisa diubah sesuai kebutuhan dan disimpan secara rahasia jika deploy publik.
- **Tidak perlu backend/server tambahan**.

---

## Kontribusi

Pull Request dan laporan bug sangat diterima! Silakan fork repo ini dan buat perubahan sesuai kebutuhan Anda.

---

## Lisensi

MIT License – Silakan gunakan, modifikasi, dan distribusikan kembali dengan bebas.

---

**Semoga bermanfaat!**

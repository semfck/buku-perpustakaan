# 📚 Perpustakaan Digital - buku-perpustakaan

**Perpustakaan Digital** adalah aplikasi web sederhana untuk manajemen peminjaman buku berbasis web dengan integrasi Firebase Firestore. Proyek ini bertujuan untuk membantu pengelolaan data buku, peminjaman, pengembalian, dan administrasi perpustakaan secara online.

---

## ✨ Fitur

- **Daftar Buku**: Menampilkan koleksi buku yang tersedia (dummy data dapat diubah dengan database Firestore).
- **Peminjaman Buku**: Form untuk meminjam buku yang tersedia dengan input data peminjam.
- **Riwayat Peminjaman**: Melihat daftar riwayat peminjaman.
- **Panel Admin**: Login admin untuk mengelola data buku dan peminjaman.
- **Integrasi Firestore**: Data tersimpan di database cloud Firestore.
- **Manajemen Data**: Otomatis menambah, menghapus, dan mengedit data koleksi buku maupun peminjam.

---

## 🚀 Teknologi dan Tools

- **Frontend**: HTML5, CSS, JavaScript (Vanilla)
- **Backend/Database**: Firebase (Firestore & Auth)
- **Deployment**: Bisa di-host di Netlify/Vercel/GitHub Pages
- **Package**: Tidak perlu install package NPM, cukup buka di browser

---

## 🛠️ Instalasi & Penggunaan

### 1. Clone Repo

```bash
git clone https://github.com/semfck/buku-perpustakaan.git
cd buku-perpustakaan
```

### 2. Setup Firebase Project

1. Buat Project di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Firestore Database** dan **Authentication** (Email/Password).
3. Salin konfigurasi Firebase Anda ke dalam file `main.js`:
   ```js
   // Contoh konfigurasi
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
4. Pastikan struktur koleksi Firestore sesuai kebutuhan (buku, users, peminjaman, dst).

### 3. Jalankan di Browser

Buka file `index.html` di browser (Chrome, Firefox, Edge, dsb).

---

## 🔑 Login Admin

- **Email admin default:** `admin@domain.com`
- **Password:** Lihat data user pada Firestore Auth atau edit di `main.js` jika dummy.

---

## 🗂️ Struktur Direktori

```
/
├── index.html        # Halaman utama
├── style.css         # Styling utama
├── main.js           # Logika aplikasi & koneksi Firebase
├── favicon.svg       # Logo perpustakaan
├── README.md         # Dokumentasi
```

---

## 📸 Screenshot

Berikut adalah tampilan utama aplikasi **Perpustakaan Digital**:

![image](https://github.com/user-attachments/assets/55a9f108-7a30-42ae-bae0-a777b0dd5618)


**Keterangan Tampilan:**
- Navigasi utama di bagian atas: **Koleksi Buku**, **Pinjam Buku**, **Admin Login**.
- Tombol aksi "Lihat Koleksi Buku" untuk akses cepat ke daftar koleksi.
- Fitur filter kategori: Semua, Fiksi, Non-Fiksi, Teknologi, Sejarah.
- Setiap buku menampilkan: judul, pengarang, kategori, tahun, ISBN, status (Tersedia/Dipinjam), dan tombol aksi (Pinjam).
- Status buku diberikan warna berbeda untuk kemudahan identifikasi (Tersedia = hijau, Dipinjam = merah muda).

---

### Screenshot Lainnya 

![image](https://github.com/user-attachments/assets/56dd49c3-45f9-434e-968c-a7ddd262e1ea)

![image](https://github.com/user-attachments/assets/2a7f1383-946c-44a6-ab07-372c616a363b)

### Fitur Admin

![image](https://github.com/user-attachments/assets/60da4be0-06fa-42e0-98e7-be6bc0b5f1d0)


---

> **Tips:**  
> Screenshot sangat membantu pengguna baru memahami fitur dan antarmuka aplikasi sebelum mencoba langsung di browser.

---


## 📒 Data Dummy

- Data buku dan peminjaman dummy dapat diubah di Firestore, atau melalui antarmuka admin pada aplikasi.

---

## 🙋 Kontribusi

Pull Request dan laporan bug sangat diterima! Silakan fork repo ini dan buat PR untuk perbaikan atau fitur baru.

---

## 📄 Lisensi

MIT License — Silakan gunakan, modifikasi, dan distribusikan dengan bebas.

---

## ✨ Catatan

- Proyek ini hanya sebagai pembelajaran, data dummy otomatis dihapus saat deploy ulang.
- Konfigurasi Firestore wajib diisi, jangan share apiKey secara publik pada proyek nyata.
- Untuk penggunaan production, gunakan rules keamanan Firestore yang sesuai.

---

**Semoga bermanfaat!**

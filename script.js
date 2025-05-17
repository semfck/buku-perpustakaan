// Modul Manajemen Buku untuk Admin

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvgK3-CN1qOQ_6hfhJOTEoNtyUkws-FWs",
  authDomain: "buku-perpustakaan-d5800.firebaseapp.com",
  projectId: "buku-perpustakaan-d5800",
  storageBucket: "buku-perpustakaan-d5800.firebasestorage.app",
  messagingSenderId: "272079716908",
  appId: "1:272079716908:web:f621036e0be69ef4ab4789",
  measurementId: "G-QR79PE11PS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CRUD BUKU --- //

export async function tambahBuku(dataBuku) {
  try {
    await addDoc(collection(db, "buku"), dataBuku);
    return { success: true, message: "Buku berhasil ditambahkan!" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function hapusBuku(idBuku) {
  try {
    await deleteDoc(doc(db, "buku", idBuku));
    return { success: true, message: "Buku berhasil dihapus!" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function ambilDaftarBuku() {
  try {
    const querySnapshot = await getDocs(collection(db, "buku"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
}

// --- DATA DEFAULT 4 BUKU PER KATEGORI --- //

export const DATA_BUKU_AWAL = [
  // Fiksi
  { judul: "Laskar Pelangi", pengarang: "Andrea Hirata", tahun: 2005, kategori: "Fiksi", isbn: "9789793062792" },
  { judul: "Bumi", pengarang: "Tere Liye", tahun: 2014, kategori: "Fiksi", isbn: "9786021637005" },
  { judul: "Cantik Itu Luka", pengarang: "Eka Kurniawan", tahun: 2002, kategori: "Fiksi", isbn: "9789799637666" },
  { judul: "Supernova", pengarang: "Dewi Lestari", tahun: 2001, kategori: "Fiksi", isbn: "9789799251763" },
  // Non Fiksi
  { judul: "Atomic Habits", pengarang: "James Clear", tahun: 2018, kategori: "Non-Fiksi", isbn: "9780735211292" },
  { judul: "Rich Dad Poor Dad", pengarang: "Robert Kiyosaki", tahun: 1997, kategori: "Non-Fiksi", isbn: "9780446677455" },
  { judul: "Sapiens", pengarang: "Yuval Noah Harari", tahun: 2011, kategori: "Non-Fiksi", isbn: "9780062316097" },
  { judul: "Filosofi Teras", pengarang: "Henry Manampiring", tahun: 2018, kategori: "Non-Fiksi", isbn: "9786024811679" },
  // Teknologi
  { judul: "Clean Code", pengarang: "Robert C. Martin", tahun: 2008, kategori: "Teknologi", isbn: "9780132350884" },
  { judul: "Introduction to Algorithms", pengarang: "Cormen et al.", tahun: 2009, kategori: "Teknologi", isbn: "9780262033848" },
  { judul: "Artificial Intelligence: A Modern Approach", pengarang: "Russell & Norvig", tahun: 2016, kategori: "Teknologi", isbn: "9780136042594" },
  { judul: "JavaScript: The Good Parts", pengarang: "Douglas Crockford", tahun: 2008, kategori: "Teknologi", isbn: "9780596517748" },
  // Sejarah
  { judul: "Indonesia Etc.", pengarang: "Elizabeth Pisani", tahun: 2014, kategori: "Sejarah", isbn: "9780393082631" },
  { judul: "Sejarah Dunia yang Disembunyikan", pengarang: "Jonathan Black", tahun: 2013, kategori: "Sejarah", isbn: "9786020309385" },
  { judul: "History of Java", pengarang: "Thomas Stamford Raffles", tahun: 1817, kategori: "Sejarah", isbn: "9781108007729" },
  { judul: "A People's History of the United States", pengarang: "Howard Zinn", tahun: 1980, kategori: "Sejarah", isbn: "9780062397348" }
];

// Fungsi untuk mengisi buku awal (hanya jalankan sekali saat setup awal)
export async function isiBukuAwal() {
  for (const buku of DATA_BUKU_AWAL) {
    await tambahBuku(buku);
  }
}
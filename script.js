// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration (PASTIKAN storageBucket .appspot.com!)
const firebaseConfig = {
  apiKey: "AIzaSyAvgK3-CN1qOQ_6hfhJOTEoNtyUkws-FWs",
  authDomain: "buku-perpustakaan-d5800.firebaseapp.com",
  projectId: "buku-perpustakaan-d5800",
  storageBucket: "buku-perpustakaan-d5800.appspot.com", // <- perbaikan di sini!
  messagingSenderId: "272079716908",
  appId: "1:272079716908:web:f621036e0be69ef4ab4789",
  measurementId: "G-QR79PE11PS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

let isAdminUser = false;

// Helper untuk badge kategori
function getKategoriBadgeClass(kat) {
    switch ((kat||'').toLowerCase()) {
        case 'fiksi': return 'bg-category-fiksi';
        case 'non-fiksi': case 'nonfiksi': return 'bg-category-nonfiksi';
        case 'teknologi': return 'bg-category-teknologi';
        case 'sejarah': return 'bg-category-sejarah';
        default: return 'bg-secondary';
    }
}

function showAlert(type, message) {
    const alertClass = type === 'error' ? 'danger' : 'success';
    const icon = type === 'error' ? 'exclamation-circle' : 'check-circle';
    const alertHTML = `
        <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
            <i class="fas fa-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.getElementById('alertContainer').innerHTML = alertHTML;
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (alert) alert.classList.remove('show');
        });
    }, 4000);
}

// Login admin otomatis
document.getElementById('btnLogin').onclick = async function() {
    const email = "admin@admin.com";
    const pass = "123456";
    signInWithEmailAndPassword(auth, email, pass)
        .catch(err => showAlert('error', err.message));
};
document.getElementById('btnLogout').onclick = function() {
    signOut(auth);
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('btnLogin').classList.add('d-none');
        document.getElementById('btnLogout').classList.remove('d-none');
        // Cek admin claim (setelah login ulang agar token refresh)
        let tokenResult = await user.getIdTokenResult(true);
        isAdminUser = !!tokenResult.claims.admin;
        document.getElementById('cardTambahBuku').style.display = isAdminUser ? 'block' : 'none';
        document.getElementById('adminStatus').classList.toggle('d-none', !isAdminUser);
        loadBooks();
    } else {
        isAdminUser = false;
        document.getElementById('btnLogin').classList.remove('d-none');
        document.getElementById('btnLogout').classList.add('d-none');
        document.getElementById('cardTambahBuku').style.display = 'none';
        document.getElementById('adminStatus').classList.add('d-none');
        loadBooks();
    }
});

async function loadBooks() {
    const daftarBukuBody = document.getElementById("daftarBukuBody");
    daftarBukuBody.innerHTML = "";
    const q = query(collection(db, "buku"), orderBy("judul", "asc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(docSnap => {
        const buku = docSnap.data();
        let tombolHapus = "";
        if (isAdminUser) {
            tombolHapus = `
                <button class="btn btn-danger btn-sm btn-hapus-buku" data-id="${docSnap.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        const badgeKategori = `<span class="badge ${getKategoriBadgeClass(buku.kategori)}">${buku.kategori}</span>`;
        const row = `
            <tr>
                <td>${buku.judul}</td>
                <td>${buku.pengarang}</td>
                <td>${buku.tahun}</td>
                <td>${buku.isbn}</td>
                <td>${badgeKategori}</td>
                <td>
                    <button class="btn btn-primary btn-sm btn-pinjam" 
                        data-judul="${buku.judul}" data-pengarang="${buku.pengarang}" 
                        data-tahun="${buku.tahun}" data-kategori="${buku.kategori}" data-isbn="${buku.isbn}">
                        <i class="fas fa-hand-holding me-1"></i>Pinjam
                    </button>
                    ${tombolHapus}
                </td>
            </tr>
        `;
        daftarBukuBody.innerHTML += row;
    });

    // Tombol hapus buku
    if (isAdminUser) {
        document.querySelectorAll('.btn-hapus-buku').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus buku ini?')) {
                    await deleteDoc(doc(db, "buku", id))
                        .then(() => {
                            showAlert('success', 'Buku berhasil dihapus');
                            loadBooks();
                        })
                        .catch(() => showAlert('error', 'Gagal menghapus buku'));
                }
            });
        });
    }
    // Isi form pinjam otomatis
    document.querySelectorAll('.btn-pinjam').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('judulBuku').value = button.getAttribute('data-judul');
            document.getElementById('pengarang').value = button.getAttribute('data-pengarang');
            document.getElementById('tahunTerbit').value = button.getAttribute('data-tahun');
            document.getElementById('kategori').value = button.getAttribute('data-kategori');
            document.getElementById('isbn').value = button.getAttribute('data-isbn');
            document.getElementById('formPeminjaman').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Tambah buku (admin)
document.getElementById('formTambahBuku').addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdminUser) {
        showAlert('error', 'Hanya admin yang bisa menambah buku!');
        return;
    }
    if (this.checkValidity()) {
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.getElementById('loadingText').textContent = 'Menambah buku...';
        const bukuBaru = {
            judul: document.getElementById('judulBaru').value,
            pengarang: document.getElementById('pengarangBaru').value,
            tahun: parseInt(document.getElementById('tahunBaru').value, 10),
            isbn: document.getElementById('isbnBaru').value,
            kategori: document.getElementById('kategoriBaru').value
        };
        await addDoc(collection(db, "buku"), bukuBaru)
            .then(() => {
                showAlert('success', 'Buku berhasil ditambahkan');
                document.getElementById('formTambahBuku').reset();
                document.getElementById('formTambahBuku').classList.remove('was-validated');
                loadBooks();
                document.getElementById('loadingOverlay').style.display = 'none';
            })
            .catch(() => {
                showAlert('error', 'Gagal menambah buku');
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    } else {
        this.classList.add('was-validated');
    }
});

// --- Fitur lain (peminjaman, pengembalian, riwayat) bisa ditambah sesuai kebutuhan ---

// Dummy: hide loader after load, load books awal
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async function() {
        document.getElementById('loadingOverlay').style.display = 'none';
        loadBooks();
    }, 1000);
});
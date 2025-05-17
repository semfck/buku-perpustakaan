// Firebase config & initialization
const firebaseConfig = {
    apiKey: "AIzaSyCCi8CdLNb1O6uEZBpVoeH_3mJhXElBGTU",
    authDomain: "meminjam-buku.firebaseapp.com",
    projectId: "meminjam-buku",
    storageBucket: "meminjam-buku.appspot.com",
    messagingSenderId: "517105835463",
    appId: "1:517105835463:web:90dcc1dfa5d2ffc6e38de2",
    measurementId: "G-KK3XQDMD9G"
};
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

let isAdminUser = false;

document.getElementById('btnLogin').onclick = async function() {
    const email = prompt("Email admin:");
    const pass = prompt("Password admin:");
    if (email && pass) {
        auth.signInWithEmailAndPassword(email, pass)
            .catch(err => showAlert('error', err.message));
    }
};
document.getElementById('btnLogout').onclick = function() {
    auth.signOut();
};

auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('btnLogin').classList.add('d-none');
        document.getElementById('btnLogout').classList.remove('d-none');
        const tokenResult = await user.getIdTokenResult(true);
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
            new bootstrap.Alert(alert).close();
        });
    }, 5000);
}

function loadBooks() {
    db.collection("buku").orderBy("judul", "asc").get()
        .then(querySnapshot => {
            const daftarBukuBody = document.getElementById("daftarBukuBody");
            daftarBukuBody.innerHTML = "";
            querySnapshot.forEach(doc => {
                const buku = doc.data();
                let tombolHapus = "";
                if (isAdminUser) {
                    tombolHapus = `
                        <button class="btn btn-danger btn-sm btn-hapus-buku" data-id="${doc.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
                const row = `
                    <tr>
                        <td>${buku.judul}</td>
                        <td>${buku.pengarang}</td>
                        <td>${buku.tahun}</td>
                        <td>${buku.isbn}</td>
                        <td>${buku.kategori}</td>
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

            if (isAdminUser) {
                document.querySelectorAll('.btn-hapus-buku').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        if (confirm('Yakin ingin menghapus buku ini?')) {
                            db.collection("buku").doc(id).delete()
                                .then(() => {
                                    showAlert('success', 'Buku berhasil dihapus');
                                    loadBooks();
                                })
                                .catch(() => showAlert('error', 'Gagal menghapus buku'));
                        }
                    });
                });
            }
            document.querySelectorAll('.btn-pinjam').forEach(button => {
                button.addEventListener('click', function() {
                    var judul = this.getAttribute('data-judul');
                    var pengarang = this.getAttribute('data-pengarang');
                    var tahun = this.getAttribute('data-tahun');
                    var kategori = this.getAttribute('data-kategori');
                    var isbn = this.getAttribute('data-isbn');
                    document.getElementById('judulBuku').value = judul;
                    document.getElementById('pengarang').value = pengarang;
                    document.getElementById('tahunTerbit').value = tahun;
                    document.getElementById('kategori').value = kategori;
                    document.getElementById('isbn').value = isbn;
                    document.getElementById('formPeminjaman').scrollIntoView({ behavior: 'smooth' });
                    analytics.logEvent('select_book', {
                        book_title: judul,
                        author: pengarang,
                        category: kategori
                    });
                });
            });
        });
}

// Tambah buku (admin only)
document.getElementById('formTambahBuku').addEventListener('submit', function(e) {
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
        db.collection("buku").add(bukuBaru)
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

// Tambahkan data buku awal jika koleksi buku masih kosong (otomatis, hanya sekali)
async function autoSeedBooks() {
    const snap = await db.collection("buku").limit(1).get();
    if (!snap.empty) return;

    const bukuSeed = [
        // FIKSI
        { judul: "Laskar Pelangi", pengarang: "Andrea Hirata", tahun: 2005, isbn: "979-3062-79-7", kategori: "Fiksi" },
        { judul: "Bumi Manusia", pengarang: "Pramoedya Ananta Toer", tahun: 1980, isbn: "979-8659-17-6", kategori: "Fiksi" },
        { judul: "Perahu Kertas", pengarang: "Dee Lestari", tahun: 2009, isbn: "978-979-22-4861-6", kategori: "Fiksi" },
        { judul: "Pulang", pengarang: "Tere Liye", tahun: 2015, isbn: "978-602-03-1251-5", kategori: "Fiksi" },
        // NON-FIKSI
        { judul: "Filosofi Teras", pengarang: "Henry Manampiring", tahun: 2018, isbn: "978-602-424-698-5", kategori: "Non-Fiksi" },
        { judul: "Atomic Habits", pengarang: "James Clear", tahun: 2018, isbn: "978-0735211292", kategori: "Non-Fiksi" },
        { judul: "Seni Hidup Minimalis", pengarang: "Francine Jay", tahun: 2010, isbn: "978-0061715015", kategori: "Non-Fiksi" },
        { judul: "Mindset: The New Psychology of Success", pengarang: "Carol S. Dweck", tahun: 2006, isbn: "978-0345472328", kategori: "Non-Fiksi" },
        // TEKNOLOGI
        { judul: "Clean Code", pengarang: "Robert C. Martin", tahun: 2008, isbn: "978-0132350884", kategori: "Teknologi" },
        { judul: "The Pragmatic Programmer", pengarang: "Andrew Hunt, David Thomas", tahun: 1999, isbn: "978-0201616224", kategori: "Teknologi" },
        { judul: "Designing Data-Intensive Applications", pengarang: "Martin Kleppmann", tahun: 2017, isbn: "978-1449373320", kategori: "Teknologi" },
        { judul: "Artificial Intelligence: A Modern Approach", pengarang: "Stuart Russell, Peter Norvig", tahun: 2020, isbn: "978-0134610993", kategori: "Teknologi" },
        // SEJARAH
        { judul: "Sapiens: Riwayat Singkat Umat Manusia", pengarang: "Yuval Noah Harari", tahun: 2011, isbn: "978-0062316097", kategori: "Sejarah" },
        { judul: "Sejarah Dunia yang Disembunyikan", pengarang: "Jonathan Black", tahun: 2007, isbn: "978-1846041811", kategori: "Sejarah" },
        { judul: "Sejarah Indonesia Modern", pengarang: "M.C. Ricklefs", tahun: 1981, isbn: "978-979-421-904-5", kategori: "Sejarah" },
        { judul: "Guns, Germs, and Steel", pengarang: "Jared Diamond", tahun: 1997, isbn: "978-0393317558", kategori: "Sejarah" }
    ];
    for (const buku of bukuSeed) {
        await db.collection("buku").add(buku);
    }
}

function loadActiveLoans() {
    db.collection("peminjaman")
        .where("status", "==", "aktif")
        .get()
        .then((querySnapshot) => {
            const pengembalianBody = document.getElementById('pengembalianBody');
            pengembalianBody.innerHTML = '';
            querySnapshot.forEach((doc, index) => {
                const data = doc.data();
                const row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${data.judulBuku}</td>
                        <td>${data.pengarang}</td>
                        <td>${data.namaPeminjam}</td>
                        <td>${data.tanggalPinjam}</td>
                        <td>${data.jatuhTempo}</td>
                        <td><span class="badge bg-success">Aktif</span></td>
                        <td><button class="btn btn-warning btn-sm btn-kembalikan" data-id="${doc.id}">Kembalikan</button></td>
                    </tr>
                `;
                pengembalianBody.innerHTML += row;
            });
            document.querySelectorAll('.btn-kembalikan').forEach(button => {
                button.addEventListener('click', function() {
                    const docId = this.getAttribute('data-id');
                    showReturnModal(docId);
                });
            });
        })
        .catch(() => showAlert('error', 'Gagal memuat data peminjaman aktif'));
}
function loadLoanHistory() {
    db.collection("peminjaman")
        .where("status", "in", ["dikembalikan", "terlambat"])
        .orderBy("tanggalPinjam", "desc")
        .get()
        .then((querySnapshot) => {
            const riwayatBody = document.getElementById('riwayatBody');
            riwayatBody.innerHTML = '';
            querySnapshot.forEach((doc, index) => {
                const data = doc.data();
                const statusBadge = data.status === 'dikembalikan' ? 
                    '<span class="badge bg-success">Dikembalikan</span>' : 
                    '<span class="badge bg-warning text-dark">Terlambat</span>';
                const row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${data.judulBuku}</td>
                        <td>${data.pengarang}</td>
                        <td>${data.namaPeminjam}</td>
                        <td>${data.tanggalPinjam}</td>
                        <td>${data.jatuhTempo}</td>
                        <td>${data.tanggalKembali || '-'}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
                riwayatBody.innerHTML += row;
            });
        })
        .catch(() => showAlert('error', 'Gagal memuat riwayat peminjaman'));
}
function showReturnModal(docId) {
    const docRef = db.collection("peminjaman").doc(docId);
    docRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('modalJudulBuku').value = data.judulBuku;
            document.getElementById('modalPengarang').value = data.pengarang;
            document.getElementById('modalNamaPeminjam').value = data.namaPeminjam;
            document.getElementById('modalTanggalPinjam').value = data.tanggalPinjam;
            document.getElementById('modalJatuhTempo').value = data.jatuhTempo;
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('modalTanggalKembali').value = today;
            const prosesBtn = document.getElementById('btnProsesPengembalian');
            prosesBtn.setAttribute('data-id', docId);
            const modal = new bootstrap.Modal(document.getElementById('pengembalianModal'));
            modal.show();
        } else {
            showAlert('error', 'Dokumen tidak ditemukan');
        }
    }).catch(() => showAlert('error', 'Gagal memuat data peminjaman'));
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async function() {
        document.getElementById('loadingOverlay').style.display = 'none';
        await autoSeedBooks();
        loadBooks();
        loadActiveLoans();
        loadLoanHistory();
        analytics.logEvent('page_view');
    }, 1000);

    document.getElementById('tanggalPinjam').addEventListener('change', hitungJatuhTempo);
    document.getElementById('lamaPinjam').addEventListener('change', hitungJatuhTempo);

    function hitungJatuhTempo() {
        var tanggalPinjam = document.getElementById('tanggalPinjam').value;
        var lamaPinjam = document.getElementById('lamaPinjam').value;
        if (tanggalPinjam && lamaPinjam) {
            var date = new Date(tanggalPinjam);
            date.setDate(date.getDate() + (lamaPinjam * 7));
            var formattedDate = date.toISOString().split('T')[0];
            document.getElementById('jatuhTempo').value = formattedDate;
        }
    }

    document.getElementById('catatan').addEventListener('input', function() {
        const charCount = this.value.length;
        document.getElementById('charCount').textContent = charCount;
    });

    document.getElementById('formPeminjaman').addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.checkValidity()) {
            document.getElementById('loadingOverlay').style.display = 'flex';
            document.getElementById('loadingText').textContent = 'Menyimpan data peminjaman...';
            const peminjamanData = {
                judulBuku: document.getElementById('judulBuku').value,
                pengarang: document.getElementById('pengarang').value,
                tahunTerbit: document.getElementById('tahunTerbit').value,
                isbn: document.getElementById('isbn').value,
                kategori: document.getElementById('kategori').value,
                namaPeminjam: document.getElementById('namaPeminjam').value,
                noHp: document.getElementById('noHp').value,
                tanggalPinjam: document.getElementById('tanggalPinjam').value,
                lamaPinjam: document.getElementById('lamaPinjam').value,
                jatuhTempo: document.getElementById('jatuhTempo').value,
                catatan: document.getElementById('catatan').value,
                status: 'aktif',
                tanggalKembali: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            db.collection("peminjaman").add(peminjamanData)
                .then(() => {
                    showAlert('success', 'Peminjaman buku berhasil disimpan');
                    document.getElementById('loadingOverlay').style.display = 'none';
                    document.getElementById('formPeminjaman').reset();
                    document.getElementById('formPeminjaman').classList.remove('was-validated');
                    document.getElementById('charCount').textContent = '0';
                    loadActiveLoans();
                    analytics.logEvent('loan_success', {
                        book_title: peminjamanData.judulBuku,
                        borrower: peminjamanData.namaPeminjam
                    });
                })
                .catch(() => {
                    showAlert('error', 'Gagal menyimpan peminjaman');
                    document.getElementById('loadingOverlay').style.display = 'none';
                });
        } else {
            this.classList.add('was-validated');
        }
    });

    document.getElementById('btnReset').addEventListener('click', function() {
        document.getElementById('formPeminjaman').reset();
        document.getElementById('formPeminjaman').classList.remove('was-validated');
        document.getElementById('charCount').textContent = '0';
    });

    document.getElementById('btnProsesPengembalian').addEventListener('click', function() {
        const modalTanggalKembali = document.getElementById('modalTanggalKembali');
        const docId = this.getAttribute('data-id');
        if (!modalTanggalKembali.value) {
            modalTanggalKembali.classList.add('is-invalid');
            return;
        }
        modalTanggalKembali.classList.remove('is-invalid');
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.getElementById('loadingText').textContent = 'Memproses pengembalian...';
        const tanggalKembali = new Date(modalTanggalKembali.value);
        const jatuhTempo = new Date(document.getElementById('modalJatuhTempo').value);
        const status = tanggalKembali > jatuhTempo ? 'terlambat' : 'dikembalikan';
        db.collection("peminjaman").doc(docId).update({
            status: status,
            tanggalKembali: modalTanggalKembali.value,
            returnedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('pengembalianModal'));
            modal.hide();
            showAlert('success', 'Pengembalian buku berhasil diproses');
            document.getElementById('loadingOverlay').style.display = 'none';
            loadActiveLoans();
            loadLoanHistory();
        })
        .catch(() => {
            showAlert('error', 'Gagal memproses pengembalian');
            document.getElementById('loadingOverlay').style.display = 'none';
        });
    });

    document.getElementById('btnFilter').addEventListener('click', function() {
        const dariTanggal = document.getElementById('filterDari').value;
        const sampaiTanggal = document.getElementById('filterSampai').value;
        const keyword = document.getElementById('searchRiwayat').value.toLowerCase();
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.getElementById('loadingText').textContent = 'Memfilter data...';
        let query = db.collection("peminjaman")
            .where("status", "in", ["dikembalikan", "terlambat"]);
        if (dariTanggal && sampaiTanggal) {
            query = query.where("tanggalPinjam", ">=", dariTanggal)
                        .where("tanggalPinjam", "<=", sampaiTanggal);
        }
        query.orderBy("tanggalPinjam", "desc")
            .get()
            .then((querySnapshot) => {
                const riwayatBody = document.getElementById('riwayatBody');
                riwayatBody.innerHTML = '';
                querySnapshot.forEach((doc, index) => {
                    const data = doc.data();
                    if (keyword && 
                        !data.judulBuku.toLowerCase().includes(keyword) && 
                        !data.pengarang.toLowerCase().includes(keyword) && 
                        !data.namaPeminjam.toLowerCase().includes(keyword)) {
                        return;
                    }
                    const statusBadge = data.status === 'dikembalikan' ? 
                        '<span class="badge bg-success">Dikembalikan</span>' : 
                        '<span class="badge bg-warning text-dark">Terlambat</span>';
                    const row = `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${data.judulBuku}</td>
                            <td>${data.pengarang}</td>
                            <td>${data.namaPeminjam}</td>
                            <td>${data.tanggalPinjam}</td>
                            <td>${data.jatuhTempo}</td>
                            <td>${data.tanggalKembali || '-'}</td>
                            <td>${statusBadge}</td>
                        </tr>
                    `;
                    riwayatBody.innerHTML += row;
                });
                document.getElementById('loadingOverlay').style.display = 'none';
            })
            .catch(() => {
                showAlert('error', 'Gagal memfilter riwayat peminjaman');
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });

    document.getElementById('searchPeminjaman').addEventListener('input', function() {
        const keyword = this.value.toLowerCase();
        const rows = document.querySelectorAll('#pengembalianBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(keyword) ? '' : 'none';
        });
    });
});
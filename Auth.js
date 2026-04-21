/**
 * auth.js — Modul Firebase Authentication bersama
 * Pasang di setiap halaman HTML dengan:
 *   import { requireAuth, getDB, fbModules } from "./auth.js";
 *
 * ⚠️  Ganti UID_PEMILIK di bawah dengan UID akun Google kamu!
 *     Cara cari UID: setelah login pertama kali, buka Console browser
 *     dan lihat log "UID kamu:" yang muncul.
 */

import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase }          from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ── Konfigurasi Firebase (sama di semua halaman) ──────────────
const firebaseConfig = {
    apiKey:            "AIzaSyBCHrlq5VIizVn42KzyvmUYH3OUs2G74rQ",
    authDomain:        "katalog-video.firebaseapp.com",
    databaseURL:       "https://katalog-video-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "katalog-video",
    storageBucket:     "katalog-video.firebasestorage.app",
    messagingSenderId: "1035864136490",
    appId:             "1:1035864136490:web:9abe5dbf41e80b11ad5c53"
};

// ── UID pemilik — GANTI dengan UID kamu! ──────────────────────
//    Setelah login pertama kali, UID akan tercetak di console.
//    Contoh: "XkL9pQ2rTh..."
const UID_PEMILIK = "GANTI_DENGAN_UID_KAMU";

// ── Inisialisasi Firebase ─────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const db   = getDatabase(app);
const auth = getAuth(app);

// ── Inject login overlay ke halaman ──────────────────────────
function buatLoginOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:9999;
        background:rgba(7,7,26,0.96);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        gap:20px; font-family:inherit;
    `;
    overlay.innerHTML = `
        <div style="text-align:center; max-width:340px; padding:0 24px;">
            <div style="font-size:48px; margin-bottom:8px;">🔐</div>
            <h2 style="color:#e8e4ff; font-size:22px; margin-bottom:6px;">FokusPro</h2>
            <p style="color:#7a76a8; font-size:14px; margin-bottom:28px;">
                Masuk dengan akun Google untuk mengakses app ini.
            </p>
            <button id="btn-google-login" style="
                display:flex; align-items:center; gap:12px; justify-content:center;
                width:100%; padding:14px 20px;
                background:#fff; color:#1c1c1e;
                border:none; border-radius:12px;
                font-size:15px; font-weight:700;
                cursor:pointer; transition:opacity .2s;
            ">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                     width="20" height="20" alt="Google">
                Masuk dengan Google
            </button>
            <p id="auth-error" style="color:#ff4f6a; font-size:13px; margin-top:14px; display:none;"></p>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("btn-google-login").addEventListener("click", async () => {
        const btn = document.getElementById("btn-google-login");
        const errEl = document.getElementById("auth-error");
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.textContent = "Menghubungkan...";
        errEl.style.display = "none";
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="Google"> Masuk dengan Google`;
            errEl.textContent = "Login gagal: " + e.message;
            errEl.style.display = "block";
        }
    });
}

// ── Inject tombol logout ke topbar/nav ───────────────────────
function tambahTombolLogout(user) {
    // Cari topbar atau nav untuk taruh tombol
    const topbar = document.querySelector(".topbar-inner, .nav-links, nav");
    if (!topbar) return;

    const existing = document.getElementById("btn-logout");
    if (existing) return;

    const btn = document.createElement("button");
    btn.id = "btn-logout";
    btn.title = `Login sebagai ${user.email}\nKlik untuk logout`;
    btn.style.cssText = `
        display:flex; align-items:center; gap:6px;
        padding:6px 12px; border-radius:20px;
        background:rgba(255,79,106,0.12);
        color:#ff4f6a; border:1px solid rgba(255,79,106,0.3);
        font-size:12px; font-weight:700; cursor:pointer;
        font-family:inherit; transition:background .2s;
        margin-left:auto; white-space:nowrap;
    `;
    btn.innerHTML = `<img src="${user.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'}"
        width="18" height="18" style="border-radius:50%;" alt="">
        Logout`;
    btn.addEventListener("click", () => {
        if (confirm("Yakin ingin logout?")) signOut(auth);
    });
    topbar.appendChild(btn);
}

// ── Fungsi utama: requireAuth ─────────────────────────────────
/**
 * Panggil di setiap halaman sebelum inisialisasi Firebase lainnya.
 * Mengembalikan Promise yang resolve saat user sudah terverifikasi.
 *
 * @returns {Promise<{db: Database, user: User}>}
 */
export function requireAuth() {
    return new Promise((resolve) => {
        // Sembunyikan konten halaman dulu
        document.body.style.visibility = "hidden";
        buatLoginOverlay();

        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Cetak UID ke console (untuk setup pertama kali)
                console.log("✅ Login berhasil!");
                console.log("UID kamu:", user.uid);
                console.log("Email:", user.email);

                // Cek apakah ini pemilik yang sah
                if (UID_PEMILIK !== "GANTI_DENGAN_UID_KAMU" && user.uid !== UID_PEMILIK) {
                    // Bukan pemilik — tampilkan pesan akses ditolak
                    const overlay = document.getElementById("auth-overlay");
                    if (overlay) overlay.innerHTML = `
                        <div style="text-align:center; max-width:320px; padding:0 24px;">
                            <div style="font-size:48px; margin-bottom:12px;">🚫</div>
                            <h2 style="color:#ff4f6a; font-size:20px; margin-bottom:8px;">Akses Ditolak</h2>
                            <p style="color:#7a76a8; font-size:14px; margin-bottom:24px;">
                                Akun ini tidak memiliki akses ke app ini.
                            </p>
                            <button onclick="import('https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js').then(m => m.signOut(m.getAuth()))"
                                style="padding:10px 20px; background:#ff4f6a; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:700;">
                                Logout
                            </button>
                        </div>
                    `;
                    return;
                }

                // Hapus overlay login
                const overlay = document.getElementById("auth-overlay");
                if (overlay) overlay.remove();

                // Tampilkan halaman
                document.body.style.visibility = "visible";

                // Tambah tombol logout
                tambahTombolLogout(user);

                resolve({ db, user });
            } else {
                // Belum login — tampilkan overlay
                document.body.style.visibility = "hidden";
                const overlay = document.getElementById("auth-overlay");
                if (overlay) overlay.style.display = "flex";
            }
        });
    });
}

// ── Export db dan modul Firebase untuk dipakai di halaman ────
export { db };
export const fbModules = { getDatabase };
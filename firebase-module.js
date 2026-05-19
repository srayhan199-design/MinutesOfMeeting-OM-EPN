// Integrasi Firebase Database & Auth
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyABsU8Z9wzzzAPHk-5eB6HV2tcsRYGsC2w",
    authDomain: "data-minutes-of-meeting.firebaseapp.com",
    databaseURL: "https://data-minutes-of-meeting-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "data-minutes-of-meeting",
    storageBucket: "data-minutes-of-meeting.firebasestorage.app",
    messagingSenderId: "766106710249",
    appId: "1:766106710249:web:569025628323eeb3460078"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app); 

// ================= SISTEM LOGIN & LOGOUT =================
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById("loginScreen");
    const toolbar = document.querySelector(".toolbar");
    const mainApp = document.querySelector(".main");

    if (user) {
        if(loginScreen) loginScreen.style.display = "none";
        if(toolbar) toolbar.style.display = "flex";
        if(mainApp) mainApp.style.display = "flex";
    } else {
        if(loginScreen) loginScreen.style.display = "flex";
        if(toolbar) toolbar.style.display = "none";
        if(mainApp) mainApp.style.display = "none";
    }
});

window.prosesLogin = function() {
    const email = document.getElementById("emailInput").value;
    const pass = document.getElementById("passwordInput").value;
    const btnLogin = document.querySelector(".login-box button");
    const errorText = document.getElementById("loginError");

    if(!email || !pass) {
        errorText.innerText = "Email dan Password harus diisi!";
        errorText.style.display = "block";
        return;
    }
    btnLogin.innerText = "Mengecek...";
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            errorText.style.display = "none";
            btnLogin.innerText = "Login";
            document.getElementById("emailInput").value = "";
            document.getElementById("passwordInput").value = "";
        })
        .catch(() => {
            errorText.innerText = "Login gagal! Cek kembali email & password.";
            errorText.style.display = "block";
            btnLogin.innerText = "Login";
        });
};

window.prosesLogout = function() {
    if(confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
        signOut(auth).then(() => {
            alert("Berhasil Logout!");
            if(typeof window.home === "function") window.home();
            else if(typeof home === "function") home(); 
        }).catch((error) => console.error(error));
    }
};

// ================= FUNGSI DATABASE MOM =================
function parseGroups(rawData) {
    let groups = [];
    let currentGroup = null;
    if(!rawData || !Array.isArray(rawData)) return groups;
    rawData.forEach(d => {
        if (d[0] !== "-") { 
            let key = d[2] ? d[2].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : Math.random().toString();
            currentGroup = { key: key, items: [d], hasActive: (d[10] === "open" || d[10] === "process") };
            groups.push(currentGroup);
        } else { 
            if (currentGroup) {
                currentGroup.items.push(d);
                if (d[10] === "open" || d[10] === "process") currentGroup.hasActive = true;
            }
        }
    });
    return groups;
}

const urutanBulanLokal = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const urutanMingguLokal = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5"]; // DITAMBAH MINGGU 5
const urutanHariLokal = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

window.getHariSebelumnya = function(y, m, w, d) {
    let yIdx = parseInt(y); let mIdx = urutanBulanLokal.indexOf(m); let wIdx = urutanMingguLokal.indexOf(w); let dIdx = urutanHariLokal.indexOf(d);
    dIdx--; 
    if (dIdx < 0) {
        dIdx = 4; wIdx--; 
        if (wIdx < 0) { wIdx = 4; mIdx--; if (mIdx < 0) { mIdx = 11; yIdx--; } } // MINGGU KE-5 AMAN
    }
    return { y: yIdx.toString(), m: urutanBulanLokal[mIdx], w: urutanMingguLokal[wIdx], d: urutanHariLokal[dIdx] };
}

window.loadHariIni = async function() {
    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px;'>Sinkronisasi data dari cloud...</td></tr>";
    try {
        const currentSnap = await get(child(ref(db), `MOM/${window.tahun}/${window.month}/${window.week}/${window.day}`));
        tbody.innerHTML = "";
        if (currentSnap.exists()) {
            currentSnap.val().forEach(d => {
                let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                let els = row.querySelectorAll("input,textarea,select,span");
                
                for(let i=0; i < d.length; i++) {
                    if(!els[i]) continue;
                    let valCloud = d[i] || "";

                    // 🔥 PELINDUNG TANGGAL OTOMATIS 🔥
                    if (i === 1 || i === 4) {
                        if (valCloud === "" || valCloud === window.day) {
                            continue; // Skip penimpaan dari Firebase
                        }
                    }

                    if(els[i].tagName === "SPAN") els[i].innerText = valCloud;
                    else { 
                        els[i].value = valCloud; 
                        if(els[i].tagName === "TEXTAREA" && typeof autoHeight === "function") autoHeight(els[i]); 
                    }
                }
                if(typeof window.setStatus === "function") window.setStatus(row.querySelector("select")); 
                else if(typeof setStatus === "function") setStatus(row.querySelector("select")); 
            });
        } else {
            if(typeof window.tambah === "function") window.tambah(); else tambah();
        }
        if(typeof window.updateNomor === "function") window.updateNomor(); else updateNomor();
    } catch (error) { tbody.innerHTML = "<tr><td colspan='13' style='color:red;'>Gagal memuat data MOM.</td></tr>"; }
};

window.tarikDataKemarin = async function() {
    let prev = window.getHariSebelumnya(window.tahun, window.month, window.week, window.day);
    if (parseInt(prev.y) < 2025) { alert("Tidak ada data sebelum tahun 2025."); return; }
    try {
        const snap = await get(child(ref(db), `MOM/${prev.y}/${prev.m}/${prev.w}/${prev.d}`));
        if (snap.exists()) {
            let groups = parseGroups(snap.val()); let hasCarry = false;
            let existingKeys = [];
            document.querySelectorAll("#momTable tbody tr").forEach(tr => {
                if(tr.style.display === "none" || tr.cells.length <= 1) return;
                let textMatter = tr.cells[2].querySelector("textarea") ? tr.cells[2].querySelector("textarea").value.toLowerCase().replace(/[^a-z0-9]/g, '') : "";
                existingKeys.push(textMatter);
            });
            groups.forEach(g => {
                if (g.hasActive) {
                    let kMatter = g.items[0][2] ? g.items[0][2].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : "";
                    if (!existingKeys.includes(kMatter) || kMatter === "") {
                        hasCarry = true;
                        g.items.forEach(d => {
                            let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                            let els = row.querySelectorAll("input,textarea,select,span");
                            for(let i=0; i < d.length; i++) {
                                if(!els[i]) continue;
                                let valCloud = d[i] || "";

                                // 🔥 JANGAN TARIK TANGGAL HARI KEMARIN KE TABEL HARI INI 🔥
                                if (i === 1 || i === 4) {
                                    continue; 
                                }

                                if(els[i].tagName === "SPAN") els[i].innerText = valCloud;
                                else { 
                                    els[i].value = valCloud; 
                                    if(els[i].tagName === "TEXTAREA" && typeof autoHeight === "function") autoHeight(els[i]); 
                                }
                            }
                            if(typeof window.setStatus === "function") window.setStatus(row.querySelector("select")); else if(typeof setStatus === "function") setStatus(row.querySelector("select")); 
                        });
                    }
                }
            });
            if (hasCarry) {
                alert(`Tugas belum selesai ditarik dari hari ${prev.d}!`);
                if(typeof window.updateNomor === "function") window.updateNomor(); else updateNomor();
            } else { alert(`Tugas hari ${prev.d} sudah ditarik semua.`); }
        } else { alert(`Tidak ada rekaman tersimpan di hari ${prev.d}.`); }
    } catch (err) { alert("Gagal terhubung ke Cloud."); }
};

// ================= SUMMARY & FILTER =================
window.loadMonthlySummary = async function(targetMonth) {
    window.isSummaryMode = true; 
    if (typeof window.resetDisplay === "function") window.resetDisplay(); else if (typeof resetDisplay === "function") resetDisplay();

    document.getElementById("momContainer").style.display = "block";
    document.getElementById("actionButtons").style.display = "none"; 
    document.getElementById("judul").innerText = `SUMMARY BULAN ${targetMonth.toUpperCase()} ${window.tahun || "2026"}`;
    document.getElementById("colDelete").style.display = "none";
    
    let statCont = document.getElementById("statContainer");
    if(statCont) statCont.style.display = "flex";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px; text-align:center;'>Sedang merangkum data...</td></tr>";

    try {
        const snapshot = await get(ref(db, `MOM/${window.tahun || "2026"}/${targetMonth}`));
        let saringanData = {}; let cOpen = 0, cProcess = 0, cClose = 0;

        if (snapshot.exists()) {
            const dataBulanIni = snapshot.val(); 
            
            urutanMingguLokal.forEach(minggu => {
                if(dataBulanIni[minggu]) {
                    urutanHariLokal.forEach(hari => {
                        if(dataBulanIni[minggu][hari]) {
                            dataBulanIni[minggu][hari].forEach(d => {
                                let matters = d[2] || ""; let problem = d[3] || "";
                                if (!matters) return;
                                let kunciUnik = matters.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '') + "_" + problem.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                                saringanData[kunciUnik] = d; 
                            });
                        }
                    });
                }
            });

            tbody.innerHTML = ""; let dataTerbaru = Object.values(saringanData); let cTotal = dataTerbaru.length;

            if (cTotal === 0) {
                tbody.innerHTML = "<tr><td colspan='13' style='text-align:center; padding:20px;'>Tidak ada pekerjaan di bulan ini.</td></tr>";
                ["countOpen", "countProcess", "countClose", "countTotal"].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = 0; });
                return;
            }

            dataTerbaru.forEach(d => {
                let statusVal = d[10] ? d[10].toLowerCase() : "";
                if (statusVal === "open") cOpen++; else if (statusVal === "process") cProcess++; else if (statusVal === "close") cClose++;
                let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                let elements = row.querySelectorAll("input,textarea,select,span");
                for(let i=0; i < d.length; i++) {
                    if(!elements[i]) continue;
                    if(elements[i].tagName === "SPAN") elements[i].innerText = d[i] || "";
                    else { elements[i].value = d[i] || ""; if(elements[i].tagName === "TEXTAREA" && typeof autoHeight === "function") autoHeight(elements[i]); }
                }
                if (typeof window.setStatus === "function") window.setStatus(row.querySelector("select")); else if (typeof setStatus === "function") setStatus(row.querySelector("select")); 
                row.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = true; el.style.backgroundColor = "transparent"; el.style.color = "black"; });
                row.querySelector(".col-del").style.display = "none";
            });

            if (typeof window.updateNomor === "function") window.updateNomor(); else updateNomor();
            if(document.getElementById("countOpen")) document.getElementById("countOpen").innerText = cOpen;
            if(document.getElementById("countProcess")) document.getElementById("countProcess").innerText = cProcess;
            if(document.getElementById("countClose")) document.getElementById("countClose").innerText = cClose;
            if(document.getElementById("countTotal")) document.getElementById("countTotal").innerText = cTotal;
        } else {
            tbody.innerHTML = "<tr><td colspan='13' style='text-align:center; padding:20px;'>Belum ada data tersimpan.</td></tr>";
            ["countOpen", "countProcess", "countClose", "countTotal"].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = 0; });
        }
    } catch (error) { tbody.innerHTML = `<tr><td colspan='13' style='color:red;'>Error Asli: <b>${error.message}</b></td></tr>`; }
};

window.save = async function() {
    if(window.isSummaryMode) return;
    let data = [];
    document.querySelectorAll("#momTable tbody tr").forEach(r => {
        let rowData = []; r.querySelectorAll("input,textarea,select,span").forEach(el => rowData.push(el.value || el.innerText || ""));
        if (r.classList.contains("sub-row")) rowData[0] = "-";
        if ((rowData[2] ? rowData[2].trim() : "") !== "" || (rowData[3] ? rowData[3].trim() : "") !== "") data.push(rowData);
    });
    if (data.length === 0) data = null;
    try { 
        await set(ref(db, `MOM/${window.tahun}/${window.month}/${window.week}/${window.day}`), data); 
        alert(data === null ? `Data di hari ${window.day} dikosongkan!` : `Data Berhasil disimpan!`);
        if(typeof window.loadHariIni === "function") window.loadHariIni(); else loadHariIni();
    } catch (error) { alert("Gagal menyimpan data."); }
};

// ================= FITUR FOTO KEGIATAN =================
window.loadKegiatan = function() {
    try {
        window.isSummaryMode = false; 
        if(typeof window.resetDisplay === "function") window.resetDisplay();
        
        let kegCont = document.getElementById("kegiatanContainer");
        if(kegCont) kegCont.style.display = "block";
        
        let formUpload = document.getElementById("formUploadFoto");
        if(formUpload) formUpload.style.display = "none";
        
        let btnToggle = document.getElementById("btnToggleUpload");
        if(btnToggle) btnToggle.style.display = "inline-block";
        
        if(typeof window.triggerFade === "function") window.triggerFade("kegiatanContainer");
        if(typeof window.fetchFoto === "function") window.fetchFoto('Semua');
    } catch (error) { console.error(error.message); }
}

window.fetchFoto = async function(filterKategori = 'Semua') {
    try {
        const tombolFilters = document.querySelectorAll('#filterKegiatanContainer .stat-box');
        tombolFilters.forEach(btn => {
            btn.style.opacity = "0.5"; btn.style.transform = "scale(0.95)"; btn.style.boxShadow = "none";
            if (btn.innerText.includes(filterKategori) || (filterKategori === 'Semua' && btn.innerText.includes('Semua'))) {
                btn.style.opacity = "1"; btn.style.transform = "scale(1.05)"; btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            }
        });

        const gallery = document.getElementById("galleryContainer");
        if(gallery) gallery.innerHTML = "<p>Memuat foto kegiatan...</p>";

        const snap = await get(ref(db, `Kegiatan`));
        if(gallery) gallery.innerHTML = ""; let hasPhoto = false;

        if (snap.exists()) {
            const data = snap.val();
            const listKategori = ["Lapangan", "Meeting", "Bebas"]; 

            listKategori.forEach(kat => {
                if (filterKategori !== 'Semua' && filterKategori !== kat) return;
                if (data[kat]) {
                    let keys = Object.keys(data[kat]).reverse(); 
                    keys.forEach(key => {
                        if(kat === 'Gallery') return; 
                        hasPhoto = true;
                        let imgData = data[kat][key];
                        let imgSrc = typeof imgData === 'string' ? imgData : imgData.image; 
                        let imgComment = typeof imgData === 'string' ? "" : (imgData.comment || "");
                        let safeComment = imgComment.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');

                        const card = document.createElement("div"); card.className = "photo-card";
                        card.innerHTML = `
                            <div class="photo-img-wrapper">
                                <img src="${imgSrc}" loading="lazy" onclick="if(typeof window.bukaLightbox === 'function') window.bukaLightbox(this.src, '${safeComment}');">
                                <span class="photo-category-badge">${kat}</span>
                                <button class="del-photo-btn" onclick="hapusFoto('${kat}', '${key}')">✖</button>
                            </div>
                            ${imgComment ? `<div class="photo-comment">${imgComment.replace(/\n/g, '<br>')}</div>` : ''}
                        `;
                        if(gallery) gallery.appendChild(card);
                    });
                }
            });
        } 
        if (!hasPhoto && gallery) { gallery.innerHTML = `<p style='padding: 20px;'>Belum ada foto kategori: <b>${filterKategori}</b>.</p>`; }
    } catch (err) { console.error(err); }
}

window.uploadFoto = function() {
    const files = document.getElementById("fotoInput").files;
    const kategori = document.getElementById("kategoriFoto").value; 
    const komentar = document.getElementById("fotoKomentar").value; 
    if (files.length === 0) { alert("Pilih foto terlebih dahulu!"); return; }

    const btnUpload = document.querySelector("#formUploadFoto button.add-btn");
    const btnOriginalText = btnUpload.innerText;
    btnUpload.innerText = "⏳ Uploading..."; btnUpload.disabled = true;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image(); img.src = e.target.result;
            img.onload = async function() {
                const canvas = document.createElement("canvas");
                const scaleSize = 1000 / img.width; canvas.width = 1000; canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                try {
                    await push(ref(db, `Kegiatan/${kategori}`), { image: canvas.toDataURL("image/jpeg", 0.75), comment: komentar });
                    if(typeof window.toggleUploadForm === "function") window.toggleUploadForm(); 
                    window.fetchFoto('Semua'); 
                } catch (err) { alert("Gagal upload foto."); } finally { btnUpload.innerText = btnOriginalText; btnUpload.disabled = false; }
            }
        }
        reader.readAsDataURL(file);
    });
}

window.hapusFoto = async function(kategori, key) {
    if(event) event.stopPropagation();
    if (confirm(`Yakin hapus foto ${kategori}?`)) {
        try { await remove(ref(db, `Kegiatan/${kategori}/${key}`)); window.fetchFoto('Semua'); } catch(err) { alert("Gagal hapus."); }
    }
}

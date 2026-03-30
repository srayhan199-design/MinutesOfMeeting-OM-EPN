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
const db = getDatabase(app);
const auth = getAuth(app);

// ================= AUTH SYSTEM =================
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById("loginScreen");
    const toolbar = document.querySelector(".toolbar");
    const mainApp = document.querySelector(".main");

    if (user) {
        if(loginScreen) loginScreen.style.display = "none";
        if(toolbar) toolbar.style.display = "flex";
        if(mainApp) mainApp.style.display = "flex";
        loadHariIni(); 
    } else {
        if(loginScreen) loginScreen.style.display = "flex";
        if(toolbar) toolbar.style.display = "none";
        if(mainApp) mainApp.style.display = "none";
    }
});

window.prosesLogin = function() {
    const email = document.getElementById("emailInput").value;
    const pass = document.getElementById("passwordInput").value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => {
        document.getElementById("loginError").innerText = "Email/Password Salah!";
        document.getElementById("loginError").style.display = "block";
    });
};

window.prosesLogout = function() {
    if(confirm("Logout?")) signOut(auth).then(() => location.reload());
};

// ================= LOGIK MoM =================

function parseGroups(rawData) {
    let groups = [];
    let currentGroup = null;
    if(!rawData || !Array.isArray(rawData)) return groups;
    rawData.forEach(d => {
        if (d[0] !== "-") { 
            currentGroup = { key: (d[2]||"").toString().toLowerCase().trim(), items: [d], hasActive: (d[10] === "open" || d[10] === "process") };
            groups.push(currentGroup);
        } else if (currentGroup) {
            currentGroup.items.push(d);
            if (d[10] === "open" || d[10] === "process") currentGroup.hasActive = true;
        }
    });
    return groups;
}

window.loadHariIni = async function() {
    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13'>Loading...</td></tr>";
    try {
        const snap = await get(child(ref(db), `MOM/${tahun}/${month}/${week}/${day}`));
        tbody.innerHTML = "";
        if (snap.exists()) {
            snap.val().forEach(d => {
                let row = tambah(d[0] === "-");
                let elements = row.querySelectorAll("input,textarea,select,span");
                for(let i=0; i < d.length; i++) {
                    if(!elements[i]) continue;
                    if(elements[i].tagName === "SPAN") elements[i].innerText = d[i] || "";
                    else elements[i].value = d[i] || "";
                }
                setStatus(row.querySelector("select"));
            });
        } else { tambah(); }
        updateNomor();
    } catch (e) { console.error(e); }
};

window.save = async function() {
    if(isSummaryMode) return;
    let data = [];
    document.querySelectorAll("#momTable tbody tr").forEach(r => {
        let rowData = [];
        r.querySelectorAll("input,textarea,select,span").forEach(el => rowData.push(el.value || el.innerText || ""));
        if (rowData[2] || rowData[3]) data.push(rowData);
    });
    try {
        await set(ref(db, `MOM/${tahun}/${month}/${week}/${day}`), data.length ? data : null);
        alert("Berhasil Simpan!");
    } catch (e) { alert("Gagal Simpan"); }
};

// ================= GLOBAL SUMMARY (DUAL MODE) =================

window.loadSummaryGlobal = async function(mode = "terbaru") {
    isSummaryMode = true; 
    resetDisplay();
    document.getElementById("momContainer").style.display = "block";
    document.getElementById("statContainer").style.display = "flex";
    document.getElementById("filterGlobalContainer").style.display = "flex"; // Tampilkan tombol filter
    document.getElementById("actionButtons").style.display = "none";
    document.getElementById("colDelete").style.display = "table-cell";
    document.getElementById("judul").innerText = mode === "terbaru" ? "Global Summary (Terbaru)" : "Global Summary (Histori)";

    // Style Tombol Aktif
    document.getElementById("btnTerbaru").style.opacity = mode === "terbaru" ? "1" : "0.5";
    document.getElementById("btnSemua").style.opacity = mode === "semua" ? "1" : "0.5";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px;'>Scanning Database...</td></tr>";

    try {
        const snapshot = await get(ref(db, "MOM"));
        if (snapshot.exists()) {
            tbody.innerHTML = "";
            const allData = snapshot.val();
            let globalGroupsMap = new Map();
            let allGlobalGroupsArray = [];
            
            const urutanBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

            for (let thn = 2025; thn <= 2035; thn++) {
                let tKey = thn.toString();
                if (allData[tKey]) {
                    urutanBulan.forEach(bln => {
                        if (allData[tKey][bln]) {
                            ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"].forEach(mgg => {
                                if (allData[tKey][bln][mgg]) {
                                    urutanHari.forEach(hr => {
                                        if (allData[tKey][bln][mgg][hr]) {
                                            let infoAsal = `${tKey}-${bln.substring(0,3)}-${hr}`;
                                            let groups = parseGroups(allData[tKey][bln][mgg][hr]);
                                            groups.forEach(g => {
                                                g.items.forEach(d => {
                                                    d.infoAsal = infoAsal;
                                                    d.pathTahun = tKey; d.pathBulan = bln; d.pathMinggu = mgg; d.pathHari = hr;
                                                });
                                                
                                                if (mode === "terbaru") {
                                                    // Identitas unik: Title yang dibersihkan dari spasi aneh
                                                    let cleanKey = (g.items[0][2] || "").toString().toLowerCase().trim().replace(/\s+/g, ' ');
                                                    if(cleanKey) globalGroupsMap.set(cleanKey, g);
                                                } else {
                                                    allGlobalGroupsArray.push(g);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }

            let dataToRender = mode === "terbaru" ? Array.from(globalGroupsMap.values()) : allGlobalGroupsArray;
            let cOpen = 0, cProcess = 0, cClose = 0;

            dataToRender.forEach(g => {
                g.items.forEach(d => {
                    let sVal = d[10] || ""; 
                    if(sVal === "open") cOpen++; else if(sVal === "process") cProcess++; else if(sVal === "close") cClose++;
                    
                    let row = tbody.insertRow();
                    row.className = d[0] === "-" ? "sub-row" : "";
                    row.innerHTML = `
                        <td class="col-no">${d[0] || ''}</td>
                        <td class="col-hari" style="font-size:10px;">${d.pathBulan}<br>${d.pathHari}</td>
                        <td style="text-align:left;">${(d[2]||'').replace(/\n/g, '<br>')}</td>
                        <td style="text-align:left;">${(d[3]||'').replace(/\n/g, '<br>')}</td>
                        <td class="col-tanggal">${d.infoAsal}</td>
                        <td>${d[5] || ''}</td>
                        <td>${d[6] || ''}</td>
                        <td>${d[7] || ''}</td>
                        <td>${d[8] || ''}</td>
                        <td>${d[9] || ''}</td>
                        <td class="status-${sVal}">${sVal.toUpperCase()}</td>
                        <td style="text-align:left;">${d[11] || ''}</td>
                        <td><button onclick="hapusBarisGlobal(this)" data-t="${d.pathTahun}" data-b="${d.pathBulan}" data-m="${d.pathMinggu}" data-h="${d.pathHari}" data-matters="${encodeURIComponent(d[2])}" data-problem="${encodeURIComponent(d[3])}" style="color:red; background:none; border:none; cursor:pointer;">✖</button></td>
                    `;
                });
            });
            document.getElementById("countOpen").innerText = cOpen;
            document.getElementById("countProcess").innerText = cProcess;
            document.getElementById("countClose").innerText = cClose;
            updateNomor();
        }
    } catch (e) { console.error(e); }
};

window.hapusBarisGlobal = async function(btn) {
    if(!confirm("Hapus permanen dari Cloud?")) return;
    let t = btn.dataset.t, b = btn.dataset.b, m = btn.dataset.m, h = btn.dataset.h;
    let mtr = decodeURIComponent(btn.dataset.matters), prb = decodeURIComponent(btn.dataset.problem);
    try {
        let snap = await get(ref(db, `MOM/${t}/${b}/${m}/${h}`));
        if(snap.exists()){
            let filtered = snap.val().filter(d => !((d[2]||"") === mtr && (d[3]||"") === prb));
            await set(ref(db, `MOM/${t}/${b}/${m}/${h}`), filtered.length ? filtered : null);
            btn.closest("tr").remove();
        }
    } catch(e) { alert("Gagal Hapus"); }
};

// ================= FOTO KEGIATAN =================
window.uploadFoto = function() {
    const files = document.getElementById("fotoInput").files[0];
    const kat = document.getElementById("kategoriFoto").value;
    const kom = document.getElementById("fotoKomentar").value;
    if(!files) return alert("Pilih foto!");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result; // Untuk simpel, kita simpan base64 ke RTDB
        await push(ref(db, `Kegiatan/${kat}`), { image: base64, comment: kom });
        alert("Berhasil!"); fetchFoto('Semua');
    };
    reader.readAsDataURL(files);
};

window.fetchFoto = async function(kat) {
    const gallery = document.getElementById("galleryContainer");
    gallery.innerHTML = "Loading...";
    const snap = await get(ref(db, `Kegiatan`));
    gallery.innerHTML = "";
    if(snap.exists()){
        const data = snap.val();
        Object.keys(data).forEach(k => {
            if(kat !== 'Semua' && kat !== k) return;
            Object.keys(data[k]).forEach(id => {
                const item = data[k][id];
                const card = document.createElement("div");
                card.className = "photo-card";
                card.innerHTML = `<img src="${item.image}" onclick="bukaLightbox(this.src, '${item.comment}')"><p>${item.comment}</p>`;
                gallery.appendChild(card);
            });
        });
    }
};

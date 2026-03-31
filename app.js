// ================= VARIABEL GLOBAL =================
let tahun = "2026";
let month = "";
let week = "";
let day = "";
let isSummaryMode = false;
let currentStatusFilter = 'all'; 

const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const urutanBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ================= FITUR EXPORT KE EXCEL ==================
window.exportKeExcel = function() {
    if (typeof XLSX === 'undefined') {
        alert("Library Excel belum dimuat. Pastikan koneksi internet lancar.");
        return;
    }
    let wb = XLSX.utils.book_new();
    let ws_data = [];
    
    let headers = [];
    document.querySelectorAll("#momTable thead th").forEach(th => {
        if (th.id !== "colDelete" && th.style.display !== "none") {
            headers.push(th.innerText);
        }
    });
    ws_data.push(headers);

    document.querySelectorAll("#momTable tbody tr").forEach(tr => {
        if (tr.style.display === "none") return; 
        let rowData = [];
        tr.querySelectorAll("td").forEach(td => {
            if(td.classList.contains("col-del") || td.style.display === "none") return;
            let input = td.querySelector("input, textarea, select");
            rowData.push(input ? input.value : td.innerText);
        });
        if (rowData.length > 0) ws_data.push(rowData);
    });

    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Data_MOM");
    XLSX.writeFile(wb, isSummaryMode ? "MOM_Global_Summary.xlsx" : `MOM_Harian_${day}.xlsx`);
}

// ================= FUNGSI DASAR UI =================
function triggerFade(id) {
    let el = document.getElementById(id);
    if(!el) return; el.classList.remove("fade-in"); void el.offsetWidth; el.classList.add("fade-in");
}

function autoHeight(el) { 
    el.style.height = "auto"; 
    el.style.height = (el.scrollHeight) + "px"; 
}

function resetDisplay() {
    document.getElementById("homeText").style.display = "none";
    document.getElementById("weekMenu").style.display = "none";
    document.getElementById("dayMenu").style.display = "none";
    document.getElementById("momContainer").style.display = "none";
    document.getElementById("statContainer").style.display = "none";
    document.getElementById("filterGlobalContainer").style.display = "none"; // Sembunyi filter
    document.getElementById("kegiatanContainer").style.display = "none";
    document.getElementById("searchInput").value = "";
    currentStatusFilter = "all";
}

function home() { 
    isSummaryMode = false; resetDisplay();
    document.getElementById("homeText").style.display = "block";
    document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active-month"));
    triggerFade("homeText");
}

// ================= LOGIKA TABEL & BARIS =================
function updateNomor() {
    let idx = 1;
    let trs = Array.from(document.querySelectorAll("#momTable tbody tr"));
    let visibleTrs = trs.filter(r => r.style.display !== "none");
    
    visibleTrs.forEach((r, i) => {
        let colNo = r.querySelector(".col-no");
        if (!colNo) return;
        
        if (r.classList.contains("sub-row")) {
            colNo.innerHTML = `<div style="color:#bdc3c7;">-</div>`;
        } else {
            colNo.innerHTML = `<div class="no">${idx++}</div>`;
        }
    });
}

function setStatus(s) {
    if(!s) return; 
    s.parentElement.className = "col-status status-" + s.value; 
    aging(s);
}

function aging(el) {
    let row = el.closest("tr");
    let tglVal = row.cells[4].querySelector("input").value;      
    let dueVal = row.cells[7].querySelector("input").value;      
    let selesaiVal = row.cells[8].querySelector("input").value;  
    let statusVal = row.cells[10].querySelector("select").value; 
    let agingSpan = row.cells[9].querySelector("span");

    if (!tglVal && !dueVal) { agingSpan.innerText = ""; return; }
    let pembandingDate = selesaiVal ? new Date(selesaiVal) : new Date();
    pembandingDate.setHours(0,0,0,0);

    if (dueVal) {
        let dueDate = new Date(dueVal); dueDate.setHours(0,0,0,0);
        let diffDays = Math.floor((dueDate - pembandingDate) / (1000 * 60 * 60 * 24));
        agingSpan.innerText = diffDays;
        agingSpan.style.color = (diffDays < 0 && statusVal !== "close") ? "red" : "#495057";
    } else if (tglVal) {
        let startDate = new Date(tglVal); startDate.setHours(0,0,0,0);
        let diffDays = Math.floor((pembandingDate - startDate) / (1000 * 60 * 60 * 24));
        agingSpan.innerText = diffDays;
    }
}

function tambah(isSubRow = false, referenceRow = null) {
    let tbody = document.querySelector("#momTable tbody");
    let row = document.createElement("tr");
    if (isSubRow) row.classList.add("sub-row");

    row.innerHTML = `
        <td class="col-no"></td>
        <td class="col-hari"><input class="cell-hari" value="${day}" readonly></td>
        <td class="col-matters"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-problem"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-tanggal"><input type="date" onchange="aging(this)"></td>
        <td class="col-pic"><input></td>
        <td class="col-epc"><input></td>
        <td class="col-due"><input type="date" onchange="aging(this)"></td>
        <td class="col-done"><input type="date" onchange="aging(this)"></td>
        <td class="col-aging"><span style="font-weight:bold;"></span></td>
        <td class="col-status"><select onchange="setStatus(this)"><option></option><option value="open">Open</option><option value="process">Process</option><option value="close">Close</option></select></td>
        <td class="col-remarks"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-del">
            <button onclick="tambahSub(this)" style="color:#2ecc71;">➕</button>
            <button onclick="hapusBaris(this)" style="color:red;">✖</button>
        </td>
    `;
    if (referenceRow) { tbody.insertBefore(row, referenceRow.nextSibling); } 
    else { tbody.appendChild(row); }
    updateNomor(); 
    return row;
}

function tambahSub(btn) { tambah(true, btn.closest('tr')); }

// ================= NAVIGASI MENU =================
function pilihBulan(b, e) { 
    isSummaryMode = false; month = b; resetDisplay(); 
    document.getElementById("weekMenu").style.display = "block"; 
    triggerFade("weekMenu"); 
    document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active-month")); 
    e.classList.add("active-month"); 
}

function pilihMinggu(w) { 
    week = w; 
    document.getElementById("weekMenu").style.display="none"; 
    document.getElementById("dayMenu").style.display="block"; 
    triggerFade("dayMenu"); 
}

function pilihHari(h) { 
    day = h; isSummaryMode = false; 
    resetDisplay();
    document.getElementById("momContainer").style.display="block"; 
    document.getElementById("actionButtons").style.display="flex"; 
    document.getElementById("judul").innerText = `MOM ${tahun} - ${month} - ${week} - ${day}`; 
    if (typeof window.loadHariIni === 'function') window.loadHariIni(); 
}

// ================= LOGIKA FILTER GLOBAL (ANT-DOBEL) =================
function filterGlobal(status) {
    currentStatusFilter = status;
    // Update UI tombol aktif
    document.getElementById("btnTerbaru").style.opacity = (status === 'all') ? "1" : "0.5";
    document.getElementById("btnSemua").style.opacity = (status === 'all') ? "0.5" : "1";
    
    // Panggil ulang load dengan filter
    loadGlobalSummary(status === 'all'); 
}

window.loadGlobalSummary = async function(isLatestOnly = true) {
    isSummaryMode = true;
    resetDisplay();
    document.getElementById("momContainer").style.display = "block";
    document.getElementById("filterGlobalContainer").style.display = "flex"; // Munculkan tombol filter
    document.getElementById("actionButtons").style.display = "none";
    document.getElementById("judul").innerText = isLatestOnly ? "GLOBAL SUMMARY (UPDATE TERBARU)" : "GLOBAL SUMMARY (SEMUA HISTORI)";
    
    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13'>Memuat data...</td></tr>";

    try {
        // Ambil data dari Firebase (Asumsi fungsi loadSemuaData dari firebase-module.js)
        const allData = await window.loadSemuaData(); 
        tbody.innerHTML = "";

        if (isLatestOnly) {
            // LOGIKA ANTI-DOBEL
            let saringanMap = new Map();

            allData.forEach(d => {
                // Buat kunci unik: Matters + Problem (dihapus spasi & simbolnya)
                let cleanMatters = (d[2] || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                let cleanProblem = (d[3] || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                let key = cleanMatters + "_" + cleanProblem;

                if (!saringanMap.has(key)) {
                    saringanMap.set(key, d);
                } else {
                    // Cek mana yang lebih baru (Asumsi d[4] adalah tanggal/timestamp)
                    let lama = new Date(saringanMap.get(key)[4] || 0);
                    let baru = new Date(d[4] || 0);
                    if (baru >= lama) saringanMap.set(key, d);
                }
            });

            saringanMap.forEach(data => renderRow(data));
        } else {
            // Munculkan SEMUA tanpa saringan
            allData.forEach(data => renderRow(data));
        }

        updateNomor();
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='13'>Gagal memuat data.</td></tr>";
    }
}

function renderRow(d) {
    let row = tambah();
    row.querySelector(".col-hari input").value = d[1] || "";
    row.querySelector(".col-matters textarea").value = d[2] || "";
    row.querySelector(".col-problem textarea").value = d[3] || "";
    row.querySelector(".col-tanggal input").value = d[4] || "";
    row.querySelector(".col-pic input").value = d[5] || "";
    row.querySelector(".col-epc input").value = d[6] || "";
    row.querySelector(".col-due input").value = d[7] || "";
    row.querySelector(".col-done input").value = d[8] || "";
    row.querySelector(".col-status select").value = d[10] || "";
    row.querySelector(".col-remarks textarea").value = d[11] || "";
    setStatus(row.querySelector(".col-status select"));
}

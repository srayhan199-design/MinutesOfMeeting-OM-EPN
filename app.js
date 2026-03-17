// Variabel Global
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
        alert("Library Excel belum berhasil dimuat. Pastikan koneksi internet lancar dan coba lagi.");
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
        if (tr.cells.length <= 1) return;

        let rowData = [];
        let cells = tr.querySelectorAll("td");
        
        for(let i = 0; i < cells.length; i++) {
            if(cells[i].classList.contains("col-del") || cells[i].style.display === "none") continue;
            
            let val = "";
            let input = cells[i].querySelector("input, textarea, select");
            if (input) { val = input.value; } else { val = cells[i].innerText; }
            rowData.push(val);
        }
        if (rowData.length > 0) ws_data.push(rowData);
    });

    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Data_MOM");
    let namaFile = isSummaryMode ? "MOM_Global_Summary.xlsx" : `MOM_Harian_${tahun}_${month}_${week}_${day}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// ================= VARIABEL UNDO HAPUS =================
let rowYangDihapus = null;
let posisiRow = null;
let timerUndo = null;

function hapusBaris(btn) {
    if (confirm("Apakah Anda yakin akan menghapus baris ini?")) {
        let row = btn.closest('tr');
        let tbody = row.parentNode;
        rowYangDihapus = row;
        posisiRow = row.nextSibling;
        tbody.removeChild(row);
        updateNomor(); 

        let toast = document.getElementById("undoToast");
        toast.innerHTML = `Baris berhasil dihapus. <button class="undo-btn" onclick="batalHapus()">Batalkan</button>`;
        toast.classList.add("show");

        clearTimeout(timerUndo);
        timerUndo = setTimeout(() => { toast.classList.remove("show"); rowYangDihapus = null; }, 7000);
    }
}

function batalHapus() {
    if (rowYangDihapus) {
        let tbody = document.querySelector("#momTable tbody");
        tbody.insertBefore(rowYangDihapus, posisiRow);
        updateNomor(); 
        let toast = document.getElementById("undoToast");
        if (toast) toast.classList.remove("show");
        rowYangDihapus = null;
        clearTimeout(timerUndo);
    }
}

window.hapusSemuaDataTabel = function() {
    if (confirm("🚨 PERINGATAN! Apakah Anda yakin ingin mengosongkan SEMUA baris di tabel ini?\n\n(Data di Cloud tidak akan terhapus secara permanen sampai Anda menekan tombol 'Simpan ke Cloud' setelah ini.)")) {
        let tbody = document.querySelector("#momTable tbody");
        tbody.innerHTML = ""; 
        tambah(); 
        updateNomor();
        
        let toast = document.getElementById("undoToast");
        if (toast) toast.classList.remove("show");
        rowYangDihapus = null;
        
        alert("Semua baris telah dikosongkan. Jangan lupa klik 'Simpan ke Cloud' jika Anda ingin menghapus data ini dari database.");
    }
}

function bukaLightbox(src, komentar) {
    document.getElementById('lightbox').style.display = 'block';
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxCaption').innerHTML = komentar || '';
}
function tutupLightbox() { document.getElementById('lightbox').style.display = 'none'; }

function toggleUploadForm() {
    let form = document.getElementById("formUploadFoto");
    let btnToggle = document.getElementById("btnToggleUpload");
    if (form.style.display === "none" || form.style.display === "") {
        form.style.display = "flex"; btnToggle.style.display = "none"; 
    } else {
        form.style.display = "none"; btnToggle.style.display = "inline-block"; 
        document.getElementById("fotoInput").value = ""; document.getElementById("fotoKomentar").value = "";
    }
}

function toggleMonthList() {
    let container = document.getElementById("monthListContainer");
    container.style.display = (container.style.display === "block") ? "none" : "block";
}
function gantiTahun() {
    tahun = document.getElementById("selectTahun").value;
    document.getElementById("btnYear").innerText = tahun; home(); 
}
function triggerFade(id) {
    let el = document.getElementById(id);
    if(!el) return; el.classList.remove("fade-in"); void el.offsetWidth; el.classList.add("fade-in");
}
function autoHeight(el) { el.style.height = "auto"; el.style.height = (el.scrollHeight) + "px"; }

function resetDisplay() {
    document.getElementById("homeText").style.display = "none";
    document.getElementById("weekMenu").style.display = "none";
    document.getElementById("dayMenu").style.display = "none";
    document.getElementById("momContainer").style.display = "none";
    document.getElementById("statContainer").style.display = "none";
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

function cariData() { applyFilters(); }
function filterGlobal(status) { currentStatusFilter = status; applyFilters(); }

function applyFilters() {
    let keyword = document.getElementById("searchInput").value.toLowerCase();
    let trs = document.querySelectorAll("#momTable tbody tr");

    trs.forEach(r => {
        let sVal = "";
        let selectEl = r.querySelector("select");
        if (selectEl) { sVal = selectEl.value; } 
        else {
            let statusTd = r.querySelector(".col-status");
            if(statusTd) {
                if(statusTd.classList.contains("status-open")) sVal = "open";
                else if(statusTd.classList.contains("status-process")) sVal = "process";
                else if(statusTd.classList.contains("status-close")) sVal = "close";
            }
        }
        let matchStatus = (currentStatusFilter === 'all' || sVal === currentStatusFilter);
        let textContent = "";
        r.querySelectorAll("input, textarea, select").forEach(el => textContent += el.value.toLowerCase() + " ");
        r.querySelectorAll("div, span").forEach(el => textContent += el.innerText.toLowerCase() + " ");
        let matchSearch = textContent.includes(keyword);

        if (matchStatus && matchSearch) { r.style.display = "table-row"; } else { r.style.display = "none"; }
    });
    updateNomor();
}

function updateNomor() {
    let idx = 1;
    let trs = Array.from(document.querySelectorAll("#momTable tbody tr"));
    trs.forEach(r => { let colNo = r.querySelector(".col-no"); if (colNo) { colNo.style.display = "table-cell"; colNo.rowSpan = 1; } });
    let visibleTrs = trs.filter(r => r.style.display !== "none");
    
    for (let i = 0; i < visibleTrs.length; i++) {
        let r = visibleTrs[i];
        let colNo = r.querySelector(".col-no");
        if (!colNo) continue;

        if (r.classList.contains("sub-row")) {
            let prevMainIndex = i - 1;
            while(prevMainIndex >= 0 && visibleTrs[prevMainIndex].classList.contains("sub-row")) { prevMainIndex--; }
            
            if (prevMainIndex >= 0) {
                colNo.style.display = "none";
                let parentColNo = visibleTrs[prevMainIndex].querySelector(".col-no");
                parentColNo.rowSpan = parentColNo.rowSpan + 1;
                let noInput = colNo.querySelector(".no");
                if(noInput) noInput.value = "-"; else { let div = colNo.querySelector("div"); if(div) div.innerText = "-"; }
            } else {
                colNo.style.display = "table-cell"; colNo.rowSpan = 1;
                let noInput = colNo.querySelector(".no");
                if(noInput) noInput.value = "-"; else { let div = colNo.querySelector("div"); if(div) div.innerText = "-"; }
            }
        } else {
            colNo.style.display = "table-cell"; colNo.rowSpan = 1;
            let noInput = colNo.querySelector(".no");
            if(noInput) { noInput.value = idx++; } else { let div = colNo.querySelector("div"); if(div) div.innerText = idx++; }
        }
    }
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
    agingSpan.style.color = "#495057"; 

    if (dueVal) {
        let dueDate = new Date(dueVal); dueDate.setHours(0,0,0,0);
        let diffDays = Math.floor((dueDate - pembandingDate) / (1000 * 60 * 60 * 24));
        agingSpan.innerText = diffDays;
        if (diffDays < 0 && statusVal !== "close") { agingSpan.style.color = "red"; }
    } else if (tglVal) {
        let startDate = new Date(tglVal); startDate.setHours(0,0,0,0);
        let diffDays = Math.floor((pembandingDate - startDate) / (1000 * 60 * 60 * 24));
        agingSpan.innerText = diffDays;
    }
}

function setStatus(s) {
    if(!s) return; s.parentElement.className = "col-status status-" + s.value; aging(s);
}

function tambah(isSubRow = false, referenceRow = null) {
    let tbody = document.querySelector("#momTable tbody");
    let row = document.createElement("tr");
    if (isSubRow) row.classList.add("sub-row");

    row.innerHTML = `
        <td class="col-no"><input class="no" readonly style="background:transparent; border:none; text-align:center; font-weight:bold; font-size:16px; width:100%;"></td>
        <td class="col-hari"><input class="cell-hari" value="${day}" readonly style="background:transparent; border:none; text-align:center;"></td>
        <td class="col-matters"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-problem"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-tanggal"><input type="date" onchange="aging(this)"></td>
        <td class="col-pic"><input></td>
        <td class="col-epc"><input></td>
        <td class="col-due"><input type="date" onchange="aging(this)"></td>
        <td class="col-done"><input type="date" onchange="aging(this)"></td>
        <td class="col-aging"><span style="font-weight:bold; color:#495057;"></span></td>
        <td class="col-status"><select onchange="setStatus(this)"><option></option><option value="open">Open</option><option value="process">Process</option><option value="close">Close</option></select></td>
        <td class="col-remarks"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-del" style="white-space:nowrap;">
            <button onclick="tambahSub(this)" style="color:#2ecc71; background:none; border:none; cursor:pointer; font-weight:bold; font-size:18px; margin-right:5px;" title="Tambah Sub-Task di bawah ini">➕</button>
            <button onclick="hapusBaris(this)" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold; font-size:18px;" title="Hapus baris ini">✖</button>
        </td>
    `;
    if (referenceRow) { tbody.insertBefore(row, referenceRow.nextSibling); } 
    else { tbody.appendChild(row); }
    updateNomor(); 
    return row;
}

function tambahSub(btn) { let parentTr = btn.closest('tr'); tambah(true, parentTr); }
function pilihBulan(b, e) { isSummaryMode = false; month = b; resetDisplay(); document.getElementById("weekMenu").style.display = "block"; triggerFade("weekMenu"); document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active-month")); e.classList.add("active-month"); }
function pilihMinggu(w) { week = w; document.getElementById("weekMenu").style.display="none"; document.getElementById("dayMenu").style.display="block"; triggerFade("dayMenu"); }

function pilihHari(h) { 
    day = h; isSummaryMode = false; 
    document.getElementById("dayMenu").style.display="none"; 
    document.getElementById("momContainer").style.display="block"; 
    triggerFade("momContainer"); 
    document.getElementById("actionButtons").style.display="flex"; 
    document.getElementById("colDelete").style.display="table-cell"; 
    document.getElementById("backToDayBtn").onclick = kembaliHari; 
    document.getElementById("judul").innerText = `MOM ${tahun} - ${month} - ${week} - ${day}`; 
    
    // Ini akan memanggil fungsi dari file firebase-module.js
    if (typeof window.loadHariIni === 'function') window.loadHariIni(); 
}

function kembaliHari() { document.getElementById("momContainer").style.display="none"; document.getElementById("dayMenu").style.display="block"; triggerFade("dayMenu"); }
function kembaliMinggu() { document.getElementById("dayMenu").style.display="none"; document.getElementById("weekMenu").style.display="block"; triggerFade("weekMenu"); }


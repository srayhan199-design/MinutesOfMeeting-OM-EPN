// ================= VARIABEL GLOBAL =================
let tahun = "2026";
let month = "";
let week = "";
let day = "";
let isSummaryMode = false;
let currentStatusFilter = 'all'; 
let rowYangDihapus = null;
let posisiRow = null;
let timerUndo = null;

// ================= FITUR EXPORT KE EXCEL ==================
window.exportKeExcel = function() {
    if (typeof XLSX === 'undefined') {
        alert("Library Excel belum berhasil dimuat.");
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

    let nomorIndukTerakhir = 0;

    document.querySelectorAll("#momTable tbody tr").forEach(tr => {
        if (tr.style.display === "none") return; 

        let rowData = [];
        let cells = tr.querySelectorAll("td");
        
        for(let i = 0; i < cells.length; i++) {
            if(cells[i].classList.contains("col-del") || cells[i].style.display === "none") continue;
            
            let input = cells[i].querySelector("input, textarea, select");
            let val = input ? input.value : cells[i].innerText;
            
            // Logika agar nomor tetap menyatu di Excel
            if (i === 0) {
                if (!tr.classList.contains("sub-row")) {
                    nomorIndukTerakhir = val;
                } else {
                    val = nomorIndukTerakhir; // Sub-row ikut nomor induk
                }
            }
            rowData.push(val);
        }
        if (rowData.length > 0) ws_data.push(rowData);
    });

    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Data_MOM");
    let namaFile = isSummaryMode ? "MOM_Global_Summary.xlsx" : `MOM_${tahun}_${month}_${week}_${day}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// ================= MANAJEMEN BARIS (TAMBAH/HAPUS) =================
function updateNomor() {
    let trs = Array.from(document.querySelectorAll("#momTable tbody tr"));
    let nomorUrut = 1;

    trs.forEach((r) => {
        if (r.style.display === "none") return;
        let colNo = r.querySelector(".col-no");
        if (!colNo) return;

        let div = colNo.querySelector("div") || colNo.querySelector(".no");
        if (r.classList.contains("sub-row")) {
            if (div.tagName === 'INPUT') div.value = "-";
            else div.innerText = "-";
        } else {
            if (div.tagName === 'INPUT') div.value = nomorUrut++;
            else div.innerText = nomorUrut++;
        }
    });
}

function tambah(isSubRow = false, referenceRow = null) {
    let tbody = document.querySelector("#momTable tbody");
    let row = document.createElement("tr");
    if (isSubRow) row.classList.add("sub-row");

    row.innerHTML = `
        <td class="col-no"><input class="no" readonly style="background:transparent; border:none; text-align:center; font-weight:bold; width:100%;"></td>
        <td class="col-hari"><input class="cell-hari" value="${day}" readonly style="background:transparent; border:none; text-align:center;"></td>
        <td class="col-matters"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-problem"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-tanggal"><input type="date" onchange="aging(this)"></td>
        <td class="col-pic"><input></td>
        <td class="col-epc"><input></td>
        <td class="col-due"><input type="date" onchange="aging(this)"></td>
        <td class="col-done"><input type="date" onchange="aging(this)"></td>
        <td class="col-aging"><span></span></td>
        <td class="col-status"><select onchange="setStatus(this)"><option></option><option value="open">Open</option><option value="process">Process</option><option value="close">Close</option></select></td>
        <td class="col-remarks"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-del"><button onclick="tambahSub(this)">➕</button><button onclick="hapusBaris(this)">✖</button></td>
    `;
    if (referenceRow) tbody.insertBefore(row, referenceRow.nextSibling); 
    else tbody.appendChild(row);
    updateNomor();
    return row;
}

function tambahSub(btn) { let parentTr = btn.closest('tr'); tambah(true, parentTr); }

function hapusBaris(btn) {
    let row = btn.closest('tr');
    row.parentNode.removeChild(row);
    updateNomor();
}

// ================= FUNGSI BANTUAN LAINNYA =================
function autoHeight(el) { el.style.height = "auto"; el.style.height = (el.scrollHeight) + "px"; }
function aging(el) { /* logika aging Anda tetap sama */ }
function setStatus(s) { s.parentElement.className = "col-status status-" + s.value; aging(s); }
function resetDisplay() { /* fungsi reset Anda */ }
function home() { resetDisplay(); document.getElementById("homeText").style.display = "block"; }
function applyFilters() { 
    // Pastikan updateNomor dipanggil setelah filter agar penomoran ulang tetap benar
    updateNomor(); 
}

// ... (tambahkan fungsi lainnya seperti pilihHari, bukaLightbox, dll yang sudah ada di file Anda)
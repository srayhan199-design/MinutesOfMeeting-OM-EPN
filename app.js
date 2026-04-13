// ================= SIMPAN KE CLOUD DENGAN MERGE BERDASARKAN MATTERS =================
window.simpanKeCloud = async function() {
    if (typeof isSummaryMode !== 'undefined' && isSummaryMode) {
        alert("Tidak bisa menyimpan dalam mode Global Summary. Kembali ke mode harian terlebih dahulu.");
        return;
    }

    // Kumpulkan data dari tabel
    let rows = document.querySelectorAll("#momTable tbody tr");
    
    // Gunakan Map untuk mengelompokkan data agar yang satu "Matters" nyatu di 1 dokumen
    let dataToSaveMap = new Map();
    let currentMatters = "";

    rows.forEach(row => {
        if (row.style.display === "none") return;
        
        // Ambil isi matters. Jika diisi, jadikan acuan. 
        // Jika kosong (misal karena ini baris tambahan/tombol kanan), gunakan acuan matters dari baris sebelumnya.
        let mattersValue = row.querySelector(".col-matters textarea")?.value.trim();
        if (mattersValue) {
            currentMatters = mattersValue;
        }

        // Jika dari baris pertama sudah tidak ada matters sama sekali, lewati
        if (!currentMatters) return;

        // Ambil nilai masing-masing kolom pada baris tersebut
        let rowData = {
            hari: row.querySelector(".col-hari input")?.value || "",
            problem: row.querySelector(".col-problem textarea")?.value || "",
            tanggal: row.querySelector(".col-tanggal input")?.value || "",
            pic: row.querySelector(".col-pic input")?.value || "",
            epc: row.querySelector(".col-epc input")?.value || "",
            due: row.querySelector(".col-due input")?.value || "",
            done: row.querySelector(".col-done input")?.value || "",
            status: row.querySelector(".col-status select")?.value || "",
            remarks: row.querySelector(".col-remarks textarea")?.value || ""
        };

        let key = currentMatters.toLowerCase();

        if (!dataToSaveMap.has(key)) {
            // Ini adalah pendataan pertama kali untuk Matters ini (Data Utama)
            dataToSaveMap.set(key, {
                matters: currentMatters,
                timestamp: new Date().toISOString(),
                tahun: typeof tahun !== 'undefined' ? tahun : "",
                bulan: typeof month !== 'undefined' ? month : "",
                minggu: typeof week !== 'undefined' ? week : "",
                hariNama: typeof day !== 'undefined' ? day : "",
                // Simpan atribut baris pertama langsung di luar agar tabel tetap bisa di-load dengan cara lama
                ...rowData,
                // Siapkan wadah (array) untuk menyatukan baris utama dan baris tambahannya nanti
                subItems: [rowData]
            });
        } else {
            // Ini eksekusi untuk baris tambahan (tombol kanan). 
            // Data dimasukkan ke data Matters yang sudah ada.
            let existing = dataToSaveMap.get(key);
            existing.subItems.push(rowData); // Masukkan ke dalam array subItems
            
            // Gabungkan teks secara langsung agar saat di-load ulang tetap menyatu di satu baris
            if(rowData.problem) existing.problem += "\n---\n" + rowData.problem;
            if(rowData.pic) existing.pic += ", " + rowData.pic;
            if(rowData.epc) existing.epc += ", " + rowData.epc;
            if(rowData.due) existing.due += ", " + rowData.due;
            if(rowData.done) existing.done += ", " + rowData.done;
            if(rowData.status) existing.status = rowData.status; // Update ke status baris terakhir
            if(rowData.remarks) existing.remarks += "\n---\n" + rowData.remarks;
        }
    });

    if (dataToSaveMap.size === 0) {
        alert("Tidak ada data yang valid untuk disimpan (Matters harus diisi).");
        return;
    }

    try {
        // Ambil semua dokumen yang sudah ada dari Firestore
        const querySnapshot = await getDocs(collection(db, "mom"));
        let existingMap = new Map(); // key: matters lowercase, value: doc id

        querySnapshot.forEach(doc => {
            let mattersExist = doc.data().matters?.toLowerCase().trim();
            if (mattersExist) {
                existingMap.set(mattersExist, doc.id);
            }
        });

        // Proses setiap data yang sudah di-group (Nyatu): update jika sudah ada, else tambah baru
        for (let [key, data] of dataToSaveMap.entries()) {
            if (existingMap.has(key)) {
                // Update dokumen yang sudah ada dengan data yang sudah di-merge
                let docId = existingMap.get(key);
                await updateDoc(doc(db, "mom", docId), data);
                console.log(`Updated (Merged): ${data.matters}`);
            } else {
                // Tambah dokumen baru
                await addDoc(collection(db, "mom"), data);
                console.log(`Added (Merged): ${data.matters}`);
            }
        }

        alert(`Berhasil menyimpan ${dataToSaveMap.size} grup Matters ke Cloud (Data tambahan berhasil disatukan).`);
        
        // Refresh tampilan
        if (typeof window.loadHariIni === 'function') window.loadHariIni();
    } catch (error) {
        console.error("Error menyimpan data: ", error);
        alert("Gagal menyimpan ke Cloud. Periksa koneksi dan izin database.");
    }
};

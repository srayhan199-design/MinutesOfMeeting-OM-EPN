// ================= SIMPAN KE CLOUD DENGAN MERGE BERDASARKAN MATTERS =================
window.simpanKeCloud = async function() {
    if (isSummaryMode) {
        alert("Tidak bisa menyimpan dalam mode Global Summary. Kembali ke mode harian terlebih dahulu.");
        return;
    }

    // Kumpulkan data dari tabel
    let rows = document.querySelectorAll("#momTable tbody tr");
    let dataToSave = [];

    rows.forEach(row => {
        if (row.style.display === "none") return;
        
        let matters = row.querySelector(".col-matters textarea")?.value.trim();
        if (!matters) return; // Abaikan baris tanpa matters

        let data = {
            matters: matters,
            hari: row.querySelector(".col-hari input")?.value || "",
            problem: row.querySelector(".col-problem textarea")?.value || "",
            tanggal: row.querySelector(".col-tanggal input")?.value || "",
            pic: row.querySelector(".col-pic input")?.value || "",
            epc: row.querySelector(".col-epc input")?.value || "",
            due: row.querySelector(".col-due input")?.value || "",
            done: row.querySelector(".col-done input")?.value || "",
            status: row.querySelector(".col-status select")?.value || "",
            remarks: row.querySelector(".col-remarks textarea")?.value || "",
            timestamp: new Date().toISOString(),
            tahun: tahun,
            bulan: month,
            minggu: week,
            hariNama: day
        };
        dataToSave.push(data);
    });

    if (dataToSave.length === 0) {
        alert("Tidak ada data yang valid untuk disimpan (Matters harus diisi).");
        return;
    }

    try {
        // Ambil semua dokumen yang sudah ada dari Firestore
        const querySnapshot = await getDocs(collection(db, "mom"));
        let existingMap = new Map(); // key: matters lowercase, value: doc id

        querySnapshot.forEach(docSnap => {
            let mattersExist = docSnap.data().matters?.toLowerCase().trim();
            if (mattersExist) {
                existingMap.set(mattersExist, docSnap.id);
            }
        });

        // Proses setiap data: update jika matters sudah ada, else tambah baru
        for (let data of dataToSave) {
            let key = data.matters.toLowerCase().trim();

            if (existingMap.has(key)) {
                // ================= PERUBAHAN DI SINI =================
                let docId = existingMap.get(key);
                const docRef = doc(db, "mom", docId);
                const docSnap = await getDoc(docRef);

                let oldData = docSnap.data();
                let history = oldData.history || [];

                history.push(data);

                await updateDoc(docRef, {
                    history: history
                });

                console.log(`Merged: ${data.matters}`);
                // ================= END PERUBAHAN =================

            } else {
                // ================= PERUBAHAN DI SINI =================
                await addDoc(collection(db, "mom"), {
                    matters: data.matters,
                    history: [data]
                });

                console.log(`Added: ${data.matters}`);
                // ================= END PERUBAHAN =================
            }
        }

        alert(`Berhasil menyimpan ${dataToSave.length} data (duplikat matters digabung).`);
        
        // Optional: refresh tampilan jika perlu
        if (typeof window.loadHariIni === 'function') window.loadHariIni();

    } catch (error) {
        console.error("Error menyimpan data: ", error);
        alert("Gagal menyimpan ke Cloud. Periksa koneksi dan izin database.");
    }
};
// jsx/getImageForApi.jsx

// Ganti seluruh isi file ini dengan logika ekspor gambar Anda yang sebenarnya.

#target photoshop



    (function () { // IIFE untuk mengembalikan nilai langsung

        // $.writeln("[getImageForApi.jsx] Mulai eksekusi."); // Untuk debug di ESTK

        // alert("getImageForApi.jsx (Versi Ekspor Asli) dipanggil!"); // Hapus atau komentari alert ini setelah tes awal



        if (app.documents.length === 0) {

            // $.writeln("[getImageForApi.jsx] Error: Tidak ada dokumen yang terbuka.");

            return "Error: Tidak ada dokumen yang terbuka.";

        }



        try {

            var originalDoc = app.activeDocument;

            // $.writeln("[getImageForApi.jsx] Dokumen aktif: " + originalDoc.name);



            var tempDir = Folder.temp;

            if (!tempDir.exists) {

                tempDir.create();

            }

            // $.writeln("[getImageForApi.jsx] Folder temporary: " + tempDir.fsName);



            var tempFileName = "ps_cep_ai_export_" + new Date().getTime() + ".png"; // Nama file lebih spesifik

            var tempFile = new File(tempDir.fsName + "/" + tempFileName);

            // $.writeln("[getImageForApi.jsx] Path file target: " + tempFile.fsName);



            var duplicatedDoc = originalDoc.duplicate();

            // $.writeln("[getImageForApi.jsx] Dokumen diduplikasi.");



            if (duplicatedDoc.layers.length > 1 && !duplicatedDoc.activeLayer.isBackgroundLayer) {

                try {

                    // $.writeln("[getImageForApi.jsx] Mencoba meratakan dokumen duplikat...");

                    duplicatedDoc.flatten();

                    // $.writeln("[getImageForApi.jsx] Dokumen duplikat diratakan.");

                } catch (e) {

                    // $.writeln("[getImageForApi.jsx] Peringatan: Gagal meratakan duplikat - " + e.message);

                    // Lanjutkan meskipun flatten gagal, model mungkin masih bisa memprosesnya.

                }

            }



            var pngSaveOptions = new PNGSaveOptions();

            pngSaveOptions.compression = 1; // Kompresi minimal, lebih cepat dari 0 di beberapa kasus, atau 6 untuk ukuran lebih kecil

            pngSaveOptions.interlaced = false;



            duplicatedDoc.saveAs(tempFile, pngSaveOptions, true, Extension.LOWERCASE);

            // $.writeln("[getImageForApi.jsx] Dokumen duplikat disimpan sebagai PNG.");



            duplicatedDoc.close(SaveOptions.DONOTSAVECHANGES);

            // $.writeln("[getImageForApi.jsx] Dokumen duplikat ditutup.");



            // $.writeln("[getImageForApi.jsx] Mengembalikan path: " + tempFile.fsName);

            return tempFile.fsName;



        } catch (e) {

            // $.writeln("[getImageForApi.jsx] Terjadi ERROR: " + e.message + " (Baris: " + e.line + ")");

            if (typeof duplicatedDoc !== 'undefined' && !duplicatedDoc.closed) {

                try {

                    duplicatedDoc.close(SaveOptions.DONOTSAVECHANGES);

                } catch (closeError) { /* Abaikan error saat menutup */ }

            }

            return "Error dalam getImageForApi.jsx: " + e.message + " (Baris: " + e.line + ")";

        }

    })();


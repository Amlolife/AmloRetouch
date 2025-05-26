// js/panel.js

var csInterfaceInstance;

// --- Constants ---
const PIXABAY_API_KEY = "50490128-ddeb018f7a02d192c75d39a95"; // Replace with your Pixabay API Key
const PIXABAY_PER_PAGE = 50;
const AMLO_LIFE_URL = "http://amloactions.carrd.co";

// --- Element IDs ---
const AI_BLEMISH_BUTTON_ID = "btnTestAI";
const REMOVAL_BUTTON_ID = "btnRemoval";
const RETOUCH_BUTTON_ID = "btnRetouch";
const SKIN_BRIGHTENING_BUTTON_ID = "btnSkinBrightening";
const TEETH_WHITENING_BUTTON_ID = "btnTeethWhitening";
const WET_LIPS_BUTTON_ID = "btnWetLips";
const REMOVE_OIL_BUTTON_ID = "btnRemoveOil";
const SKIN_TONE_BUTTON_ID = "btnSkinTone";

const SHOW_COPYRIGHT_BUTTON_ID = "btnShowCopyright";
const GO_BACK_BUTTON_ID = "btnGoBack";
const MAIN_PANEL_ID = "mainPanelContent";
const COPYRIGHT_PANEL_ID = "copyrightPanelContent";

const SHOW_PIXABAY_BUTTON_ID = "btnShowPixabay";
const GO_BACK_PIXABAY_BUTTON_ID = "btnGoBackPixabay"; // Matched HTML
const PIXABAY_PANEL_ID = "pixabayPanelContent";
const PIXABAY_SEARCH_INPUT_ID = "pixabaySearchInput";
const PIXABAY_SEARCH_BUTTON_ID = "btnPixabaySearch";
const PIXABAY_RESULTS_ID = "pixabayResults";
const PIXABAY_IMPORT_CURRENT_ID = "btnImportCurrent";
const PIXABAY_IMPORT_NEW_ID = "btnImportNew";
const PIXABAY_STATUS_ID = "pixabayStatusMessage";
const PIXABAY_PREV_BUTTON_ID = "btnPrevPage";
const PIXABAY_NEXT_BUTTON_ID = "btnNextPage";
const PIXABAY_PAGE_INFO_ID = "pixabayPageInfo";

// NEW: Radio button IDs (though we'll use querySelector for the group)
const PIXABAY_TYPE_PHOTO_ID = "pixabayTypePhoto";
const PIXABAY_TYPE_ILLUSTRATION_ID = "pixabayTypeIllustration";
const PIXABAY_TYPE_VECTOR_ID = "pixabayTypeVector";

// --- Pixabay State ---
let selectedPixabayImage = { previewURL: null, largeImageURL: null, id: null };
let pixabayCurrentPage = 1;
let pixabayCurrentQuery = '';
let pixabayTotalHits = 0;

// --- Status & Loading Functions [Keep As Is] ---
function updateAIStatus(message, statusType) {
    const statusEl = document.getElementById('statusMessage');
    updateStatus(statusEl, message, statusType);
}
function updatePixabayStatus(message, statusType) {
    const statusEl = document.getElementById(PIXABAY_STATUS_ID);
    updateStatus(statusEl, message, statusType);
}
function updateStatus(element, message, statusType) {
    if (element) {
        element.textContent = message;
        let color = 'var(--text-muted-color)';
        switch (statusType) {
            case 'success': color = 'var(--accent-color)'; break;
            case 'error': color = 'var(--danger-color)'; break;
            case 'progress': color = 'var(--warning-color)'; break;
            case 'info': default: color = 'var(--text-muted-color)'; break;
        }
        element.style.color = color;
    } else { console.log(`[STATUS UPDATE] ${message}`); }
}
function setButtonLoadingState(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isLoading) {
            button.classList.add("loading");
            button.disabled = true;
        } else {
            button.classList.remove("loading");
            if (buttonId !== PIXABAY_PREV_BUTTON_ID && buttonId !== PIXABAY_NEXT_BUTTON_ID) {
                button.disabled = false;
            } else {
                button.disabled = false; // Let updatePaginationControls handle final state
            }
        }
    } else { console.warn(`[PANEL.JS WARN] setButtonLoadingState: Tombol dengan ID '${buttonId}' tidak ditemukan.`); }
}

// --- JSX Execution Functions [Keep As Is] ---
function executeSimpleJsxAction(buttonId, jsxFileName, actionName) {
    console.log(`[PANEL.JS LOG] Tombol '${actionName}' diklik. Memanggil ${jsxFileName}...`);
    if (!csInterfaceInstance) { updateAIStatus("KESALAHAN: Komponen panel inti tidak tersedia.", 'error'); return; }
    setButtonLoadingState(buttonId, true);
    updateAIStatus(`${actionName}: Memproses...`, 'progress');
    const extensionPath = csInterfaceInstance.getSystemPath("extension");
    const jsxFilePath = `${extensionPath}/jsx/${jsxFileName}`.replace(/\\/g, '/');
    const scriptToRun = `try { var jsxFile = new File("${jsxFilePath}"); if(jsxFile.exists){ $.evalFile(jsxFile); "${actionName} sukses dieksekusi."; } else { throw new Error("File JSX (${jsxFileName}) tidak ditemukan di path: ${jsxFilePath}"); } } catch(e) { "ERROR: " + e.toString(); };`;
    csInterfaceInstance.evalScript(scriptToRun, (result) => {
        setButtonLoadingState(buttonId, false);
        if (typeof result === 'string' && result.toUpperCase().startsWith("ERROR:")) {
            updateAIStatus(`KESALAHAN (${actionName}): ${result.substring(7)}`, 'error');
        } else if (typeof result === 'string' && result.includes("tidak ditemukan")) {
            updateAIStatus(`KESALAHAN (${actionName}): File skrip tidak ditemukan.`, 'error');
        } else {
            const successMessage = (typeof result === 'string' && result.trim() !== "" && !result.toUpperCase().startsWith("ERROR:")) ? result : `${actionName}: Tindakan berhasil diterapkan.`;
            updateAIStatus(successMessage, 'success');
        }
    });
}
function executePixabayImportJsx(base64Data, importType, fileName) {
    console.log(`[PANEL.JS LOG] Importing Pixabay image (${importType})...`);
    if (!csInterfaceInstance) { updatePixabayStatus("KESALAHAN: Komponen panel inti tidak tersedia.", 'error'); return; }
    setButtonLoadingState(PIXABAY_IMPORT_CURRENT_ID, true);
    setButtonLoadingState(PIXABAY_IMPORT_NEW_ID, true);
    updatePixabayStatus(`Mengimpor gambar...`, 'progress');
    const extensionPath = csInterfaceInstance.getSystemPath("extension");
    const jsxFilePath = `${extensionPath}/jsx/importImage.jsx`.replace(/\\/g, '/');
    const tempPath = csInterfaceInstance.getSystemPath('userData') + "/AmloPanelCache";
    window.cep.fs.makedir(tempPath);
    const base64FilePath = `${tempPath}/${fileName}.b64`.replace(/\\/g, '/');
    const writeResult = window.cep.fs.writeFile(base64FilePath, base64Data);
    if (writeResult.err === 0) {
        console.log("Base64 temp file written: " + base64FilePath);
        const jsxImportScript = `
            try {
                var jsxFile = new File("${jsxFilePath}");
                if(jsxFile.exists) {
                    $.evalFile(jsxFile);
                    var result = importFromBase64File("${base64FilePath}", "${importType}", "${fileName}");
                    result;
                } else {
                    throw new Error("File JSX (importImage.jsx) tidak ditemukan.");
                }
            } catch(e) { "ERROR: " + e.toString(); }`;
        csInterfaceInstance.evalScript(jsxImportScript, (jsxResult) => {
            setButtonLoadingState(PIXABAY_IMPORT_CURRENT_ID, false);
            setButtonLoadingState(PIXABAY_IMPORT_NEW_ID, false);
            if (typeof jsxResult === 'string' && jsxResult.toUpperCase().startsWith("ERROR:")) {
                updatePixabayStatus(`KESALAHAN Impor: ${jsxResult.substring(7)}`, 'error');
            } else {
                updatePixabayStatus(`Gambar berhasil diimpor!`, 'success');
            }
            window.cep.fs.deleteFile(base64FilePath);
        });
    } else {
        updatePixabayStatus(`KESALAHAN: Tidak bisa menyimpan file sementara. Error code: ${writeResult.err}`, 'error');
        setButtonLoadingState(PIXABAY_IMPORT_CURRENT_ID, false);
        setButtonLoadingState(PIXABAY_IMPORT_NEW_ID, false);
    }
}

// --- Navigation Functions ---
function showPanel(panelToShowId) {
    const mainPanel = document.getElementById(MAIN_PANEL_ID);
    const copyrightPanel = document.getElementById(COPYRIGHT_PANEL_ID);
    const pixabayPanel = document.getElementById(PIXABAY_PANEL_ID);
    const infoButton = document.getElementById(SHOW_COPYRIGHT_BUTTON_ID);
    const pixabayButton = document.getElementById(SHOW_PIXABAY_BUTTON_ID);
    const backButton = document.getElementById(GO_BACK_BUTTON_ID); // Ensure it's defined
    const backPixabayButton = document.getElementById(GO_BACK_PIXABAY_BUTTON_ID); // Ensure it's defined


    // Hide all panels
    mainPanel.classList.add('hidden');
    copyrightPanel.classList.add('hidden');
    pixabayPanel.classList.add('hidden');

    // Hide all back buttons
    backButton.classList.add('hidden');
    backPixabayButton.classList.add('hidden');

    // Hide top-right buttons initially
    infoButton.classList.add('hidden');
    pixabayButton.classList.add('hidden');

    // Show the requested panel and appropriate buttons
    if (panelToShowId === MAIN_PANEL_ID) {
        mainPanel.classList.remove('hidden');
        infoButton.classList.remove('hidden');
        pixabayButton.classList.remove('hidden');
    } else if (panelToShowId === COPYRIGHT_PANEL_ID) {
        copyrightPanel.classList.remove('hidden');
        backButton.classList.remove('hidden'); // Show copyright back button
    } else if (panelToShowId === PIXABAY_PANEL_ID) {
        pixabayPanel.classList.remove('hidden');
        backPixabayButton.classList.remove('hidden'); // Show pixabay back button
    } else {
        console.error("[PANEL.JS ERROR] Unknown panel ID:", panelToShowId);
        mainPanel.classList.remove('hidden'); // Default to main
        infoButton.classList.remove('hidden');
        pixabayButton.classList.remove('hidden');
    }
}


// --- Pixabay Functions ---

// *** NEW: Function to get selected image type ***
function getSelectedImageType() {
    const selectedRadio = document.querySelector('input[name="imageType"]:checked');
    return selectedRadio ? selectedRadio.value : 'photo'; // Default to 'photo'
}

// *** MODIFIED: triggerPixabaySearch ***
function triggerPixabaySearch(isNewSearch = false) {
    const queryInput = document.getElementById(PIXABAY_SEARCH_INPUT_ID);
    if (isNewSearch) {
        const query = queryInput.value.trim();
        if (!query) { updatePixabayStatus("Masukkan kata kunci pencarian.", 'warning'); return; }
        pixabayCurrentQuery = query;
        pixabayCurrentPage = 1;
    }
    if (!pixabayCurrentQuery) { updatePixabayStatus("Tidak ada kata kunci untuk dicari.", 'warning'); return; }
    if (PIXABAY_API_KEY === "YOUR_API_KEY_HERE" || !PIXABAY_API_KEY) { // Check for placeholder
        updatePixabayStatus("KESALAHAN: Kunci API Pixabay belum diatur di panel.js!", 'error');
        alert("PENTING: Anda harus memasukkan Kunci API Pixabay Anda di file js/panel.js agar fitur ini berfungsi.");
        return;
    }

    // *** Get selected image type ***
    const imageType = getSelectedImageType();

    updatePixabayStatus(`Mencari "${pixabayCurrentQuery}" (${imageType}, Hal ${pixabayCurrentPage})...`, 'progress');
    setButtonLoadingState(PIXABAY_SEARCH_BUTTON_ID, true);
    setButtonLoadingState(PIXABAY_PREV_BUTTON_ID, true);
    setButtonLoadingState(PIXABAY_NEXT_BUTTON_ID, true);
    document.getElementById(PIXABAY_RESULTS_ID).innerHTML = '';
    deselectPixabayImage();

    // *** Updated URL with imageType ***
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(pixabayCurrentQuery)}&image_type=${imageType}&safesearch=true&per_page=${PIXABAY_PER_PAGE}&page=${pixabayCurrentPage}`;

    fetch(url)
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
        })
        .then(data => {
            setButtonLoadingState(PIXABAY_SEARCH_BUTTON_ID, false);
            // Let updatePaginationControls handle these based on results
            // setButtonLoadingState(PIXABAY_PREV_BUTTON_ID, false);
            // setButtonLoadingState(PIXABAY_NEXT_BUTTON_ID, false);
            pixabayTotalHits = data.totalHits || 0;
            if (data.hits && data.hits.length > 0) {
                displayPixabayResults(data.hits);
                updatePixabayStatus(`Menampilkan hasil untuk "${pixabayCurrentQuery}".`, 'success');
            } else {
                updatePixabayStatus(`Tidak ada hasil (atau halaman) untuk "${pixabayCurrentQuery}".`, 'info');
                pixabayTotalHits = 0;
            }
            updatePaginationControls(); // This will set final button states
        })
        .catch(error => {
            console.error("Pixabay Search Error:", error);
            updatePixabayStatus(`KESALAHAN: Gagal mencari - ${error.message}`, 'error');
            setButtonLoadingState(PIXABAY_SEARCH_BUTTON_ID, false);
            pixabayTotalHits = 0;
            updatePaginationControls(); // Ensure buttons are updated on error too
        });
}

// --- [displayPixabayResults, deselectPixabayImage, blobToBase64, handleImport - Keep As Is] ---
function displayPixabayResults(hits) {
    const resultsDiv = document.getElementById(PIXABAY_RESULTS_ID);
    resultsDiv.innerHTML = '';
    hits.forEach(hit => {
        const img = document.createElement('img');
        img.src = hit.previewURL;
        img.title = `By ${hit.user} | Tags: ${hit.tags}`;
        img.dataset.largeUrl = hit.largeImageURL;
        img.dataset.id = hit.id;
        img.alt = hit.tags;
        img.addEventListener('click', () => {
            document.querySelectorAll('#pixabayResults img.selected').forEach(el => {
                el.classList.remove('selected');
            });
            img.classList.add('selected');
            selectedPixabayImage.previewURL = img.src;
            selectedPixabayImage.largeImageURL = img.dataset.largeUrl;
            selectedPixabayImage.id = img.dataset.id;
            document.getElementById(PIXABAY_IMPORT_CURRENT_ID).disabled = false;
            document.getElementById(PIXABAY_IMPORT_NEW_ID).disabled = false;
            updatePixabayStatus(`Gambar dipilih. Siap untuk diimpor.`, 'info');
        });
        resultsDiv.appendChild(img);
    });
}
function deselectPixabayImage() {
    document.querySelectorAll('#pixabayResults img.selected').forEach(el => {
        el.classList.remove('selected');
    });
    selectedPixabayImage = { previewURL: null, largeImageURL: null, id: null };
    document.getElementById(PIXABAY_IMPORT_CURRENT_ID).disabled = true;
    document.getElementById(PIXABAY_IMPORT_NEW_ID).disabled = true;
}
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
async function handleImport(importType) {
    if (!selectedPixabayImage.largeImageURL) { updatePixabayStatus("Pilih gambar terlebih dahulu.", 'warning'); return; }
    updatePixabayStatus("Mengunduh gambar...", 'progress');
    setButtonLoadingState(PIXABAY_IMPORT_CURRENT_ID, true);
    setButtonLoadingState(PIXABAY_IMPORT_NEW_ID, true);
    try {
        const response = await fetch(selectedPixabayImage.largeImageURL);
        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
        const blob = await response.blob();
        const base64Data = await blobToBase64(blob);
        if (base64Data) {
            const fileName = `pixabay_${selectedPixabayImage.id}.jpg`;
            executePixabayImportJsx(base64Data, importType, fileName);
        } else { throw new Error("Gagal mengonversi gambar ke Base64."); }
    } catch (error) {
        console.error("Import Error:", error);
        updatePixabayStatus(`KESALAHAN Impor: ${error.message}`, 'error');
        setButtonLoadingState(PIXABAY_IMPORT_CURRENT_ID, false);
        setButtonLoadingState(PIXABAY_IMPORT_NEW_ID, false);
    }
}

// --- [updatePaginationControls - MODIFIED to ensure buttons are re-enabled correctly] ---
function updatePaginationControls() {
    const prevBtn = document.getElementById(PIXABAY_PREV_BUTTON_ID);
    const nextBtn = document.getElementById(PIXABAY_NEXT_BUTTON_ID);
    const pageInfo = document.getElementById(PIXABAY_PAGE_INFO_ID);

    if (!prevBtn || !nextBtn || !pageInfo) return;

    // Ensure buttons are not stuck loading
    setButtonLoadingState(PIXABAY_PREV_BUTTON_ID, false);
    setButtonLoadingState(PIXABAY_NEXT_BUTTON_ID, false);

    if (pixabayTotalHits === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = '';
        return;
    }
    prevBtn.disabled = (pixabayCurrentPage <= 1);
    nextBtn.disabled = (pixabayCurrentPage * PIXABAY_PER_PAGE >= pixabayTotalHits);
    const startNum = ((pixabayCurrentPage - 1) * PIXABAY_PER_PAGE) + 1;
    const endNum = Math.min(pixabayCurrentPage * PIXABAY_PER_PAGE, pixabayTotalHits);
    pageInfo.textContent = `${startNum}-${endNum} of ${pixabayTotalHits}`;
}

// --- AI Blemish Button Logic [Keep As Is] ---
function initializeAiBlemishButtonLogic() {
    console.log("[PANEL.JS LOG] initializeAiBlemishButtonLogic() dipanggil.");
    const aiButton = document.getElementById(AI_BLEMISH_BUTTON_ID);
    if (aiButton) {
        aiButton.addEventListener("click", async () => {
            console.log("[PANEL.JS LOG] Tombol 'Remove Blemishes' diklik. Memulai alur AI...");
            if (!csInterfaceInstance) {
                updateAIStatus("KESALAHAN: Komponen panel inti tidak tersedia.", 'error'); return;
            }
            setButtonLoadingState(AI_BLEMISH_BUTTON_ID, true);
            updateAIStatus("Memproses gambar: Tahap 1 - Ekstraksi data...", 'progress');
            const extensionPath = csInterfaceInstance.getSystemPath("extension");
            const jsxExportFilePath = (extensionPath + "/jsx/getImageForApi.jsx").replace(/\\/g, '/');
            const scriptToRunExport = `
                try {
                    var jsxFile = new File("${jsxExportFilePath}");
                    if(jsxFile.exists){ $.evalFile(jsxFile); }
                    else { throw new Error("File JSX (getImageForApi.jsx) tidak ditemukan di path: ${jsxExportFilePath}"); }
                } catch(e) { "ERROR saat mengevaluasi getImageForApi.jsx: " + e.toString(); }`;
            csInterfaceInstance.evalScript(scriptToRunExport, (exportedPathOrError) => {
                const resultFromExportJSX = typeof exportedPathOrError === 'string' ? exportedPathOrError.trim() : "";
                if (resultFromExportJSX.toLowerCase().startsWith("error:") || resultFromExportJSX.includes("tidak ditemukan")) {
                    updateAIStatus("KESALAHAN: Gagal mengekspor data gambar. " + resultFromExportJSX, 'error');
                    setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false); return;
                }
                if (!resultFromExportJSX) {
                    updateAIStatus("KESALAHAN: Path data gambar yang diterima tidak valid.", 'error');
                    setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false); return;
                }
                const sanitizedImagePath = resultFromExportJSX.replace(/\\/g, '/');
                updateAIStatus("Ekstraksi Data Gambar Berhasil.", 'success');
                updateAIStatus("Analisis Gambar: Tahap 2 - Proses Deteksi Objek...", 'progress');
                try {
                    const { exec } = require("child_process");
                    const pythonScriptPath = `${extensionPath}/ai-server/detect.py`.replace(/\\/g, '/');
                    const pythonExecutable = "python";
                    const command = `"${pythonExecutable}" "${pythonScriptPath}" "${sanitizedImagePath}"`;
                    console.log("[PANEL.JS LOG] Executing command: " + command);
                    const cwdPath = `${extensionPath}/ai-server`.replace(/\\/g, '/');
                    console.log("[PANEL.JS LOG] CWD for exec: " + cwdPath);
                    exec(command, { cwd: cwdPath }, (error, stdout, stderr) => {
                        if (error) {
                            updateAIStatus(`KESALAHAN: Eksekusi skrip analisis gagal. ${error.message}`, 'error');
                            console.error(`[PANEL.JS PYTHON EXEC ERROR]: ${error.message}`);
                            if (stderr) console.error(`[PANEL.JS PYTHON STDERR on error]: ${stderr}`);
                            setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false); return;
                        }
                        if (stderr && stderr.trim() !== "") {
                            console.warn("[PANEL.JS PYTHON STDERR (Warning/Info)]:", stderr.trim());
                        }
                        const pyOutput = stdout.trim();
                        if (!pyOutput) {
                            updateAIStatus("KESALAHAN: Tidak ada respons dari modul analisis Python." + (stderr ? " Detail: " + stderr.trim() : ""), 'error');
                            setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false); return;
                        }
                        updateAIStatus("Menerima hasil analisis, memvalidasi data...", 'progress');
                        try {
                            const detections = JSON.parse(pyOutput);
                            if (detections && detections.length > 0 && detections[0].hasOwnProperty('error')) {
                                updateAIStatus("KESALAHAN pada Modul Analisis Python: " + detections[0].error, 'error');
                                setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false); return;
                            }
                            if (!Array.isArray(detections)) {
                                updateAIStatus("KESALAHAN: Data deteksi dari Python bukan array.", 'error');
                                setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false); return;
                            }
                            const numDetections = detections.length;
                            updateAIStatus(`Analisis Selesai: ${numDetections} objek teridentifikasi.`, 'success');
                            if (numDetections > 0) {
                                updateAIStatus("Tahap Akhir: Mengirim data ke Photoshop...", 'progress');
                                const paramsForProcessingJsx = JSON.stringify({ detections: detections });
                                const jsxProcessFilePath = (extensionPath + "/jsx/processAiDetections.jsx").replace(/\\/g, '/');
                                const escapedParams = paramsForProcessingJsx.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                                const scriptToRunProcess = `
                                    try {
                                        var jsxFile = new File("${jsxProcessFilePath}");
                                        if(jsxFile.exists){
                                            var processFunc = $.evalFile(jsxFile);
                                            var result = processFunc('${escapedParams}');
                                            result;
                                        } else {
                                            throw new Error("File (processAiDetections.jsx) tidak ditemukan: ${jsxProcessFilePath}");
                                        }
                                    } catch(e) { "ERROR saat eval processAiDetections.jsx: " + e.toString(); }`;
                                csInterfaceInstance.evalScript(scriptToRunProcess, (processingResult) => {
                                    const finalMessage = typeof processingResult === 'string' ? processingResult.trim() : "Proses di Photoshop selesai tanpa pesan detail.";
                                    if (finalMessage.toLowerCase().startsWith("error")) {
                                        updateAIStatus("KESALAHAN: Gagal memproses hasil di Photoshop. " + finalMessage, 'error');
                                    } else {
                                        updateAIStatus(finalMessage, 'success');
                                    }
                                    setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false);
                                });
                            } else {
                                updateAIStatus("INFORMASI: Tidak ada objek teridentifikasi untuk diproses lebih lanjut.", 'info');
                                setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false);
                            }
                        } catch (e_parse) {
                            updateAIStatus("KESALAHAN: Gagal memvalidasi data JSON hasil analisis. " + e_parse.message + ". Output Python: " + pyOutput.substring(0, 200), 'error');
                            console.error("Python output that failed parsing: ", pyOutput);
                            setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false);
                        }
                    });
                } catch (e_require) {
                    updateAIStatus(`KESALAHAN: Gagal memuat modul Node.js (child_process). Pastikan Node.js diaktifkan di manifest.xml. Error: ${e_require.message}`, 'error');
                    console.error("[PANEL.JS REQUIRE ERROR]:", e_require);
                    setButtonLoadingState(AI_BLEMISH_BUTTON_ID, false);
                }
            });
        });
        console.log("[PANEL.JS LOG] Event listener untuk " + AI_BLEMISH_BUTTON_ID + " telah ditambahkan.");
    } else {
        console.warn(`[PANEL.JS WARN] Tombol ${AI_BLEMISH_BUTTON_ID} tidak ditemukan.`);
        updateAIStatus("KESALAHAN: Tombol utama AI tidak ditemukan.", 'error');
    }
}

// --- Function to open URL [Keep As Is] ---
function openAmloLife(event) {
    event.preventDefault();
    console.log(`[PANEL.JS LOG] Opening URL: ${AMLO_LIFE_URL}`);
    if (csInterfaceInstance) {
        csInterfaceInstance.openURLInDefaultBrowser(AMLO_LIFE_URL);
    } else {
        window.open(AMLO_LIFE_URL, '_blank');
        alert("CSInterface not found. Opening in a new tab.");
    }
}

// --- Main Initialization Function ---
function initializePanelEnvironment() {
    console.log("[PANEL.JS LOG] initializePanelEnvironment() dipanggil.");
    if (typeof CSInterface !== 'undefined') {
        csInterfaceInstance = new CSInterface();
        console.log("[PANEL.JS LOG] CSInterface BERHASIL diinisialisasi.");

        initializeAiBlemishButtonLogic();

        const simpleActionButtons = [
            { id: REMOVAL_BUTTON_ID, jsx: "Removal.jsx", name: "Removal" },
            { id: RETOUCH_BUTTON_ID, jsx: "Retouch.jsx", name: "Retouch" },
            { id: SKIN_BRIGHTENING_BUTTON_ID, jsx: "SkinBrightening.jsx", name: "Skin Brightening" },
            { id: TEETH_WHITENING_BUTTON_ID, jsx: "TeethWhitening.jsx", name: "Teeth Whitening" },
            { id: WET_LIPS_BUTTON_ID, jsx: "WetLips.jsx", name: "Wet Lips" },
            { id: REMOVE_OIL_BUTTON_ID, jsx: "removeoil.jsx", name: "Remove Oil" },
            { id: SKIN_TONE_BUTTON_ID, jsx: "skintone.jsx", name: "Skin Tone" }
        ];

        simpleActionButtons.forEach(btnConfig => {
            const buttonElement = document.getElementById(btnConfig.id);
            if (buttonElement) {
                buttonElement.addEventListener("click", () => {
                    executeSimpleJsxAction(btnConfig.id, btnConfig.jsx, btnConfig.name);
                });
                console.log(`[PANEL.JS LOG] Listener added for ${btnConfig.id}`);
            } else {
                console.warn(`[PANEL.JS WARN] Tombol ${btnConfig.id} tidak ditemukan.`);
            }
        });

        // --- Setup Navigation Listeners ---
        const infoButton = document.getElementById(SHOW_COPYRIGHT_BUTTON_ID);
        const backButton = document.getElementById(GO_BACK_BUTTON_ID);
        const pixabayButton = document.getElementById(SHOW_PIXABAY_BUTTON_ID);
        const backPixabayButton = document.getElementById(GO_BACK_PIXABAY_BUTTON_ID);

        // Make sure these buttons exist before adding listeners
        if (infoButton) infoButton.addEventListener("click", () => showPanel(COPYRIGHT_PANEL_ID));
        if (backButton) backButton.addEventListener("click", () => showPanel(MAIN_PANEL_ID));
        if (pixabayButton) pixabayButton.addEventListener("click", () => showPanel(PIXABAY_PANEL_ID));
        if (backPixabayButton) backPixabayButton.addEventListener("click", () => showPanel(MAIN_PANEL_ID));


        // --- Setup Pixabay Listeners ---
        const pixabaySearchBtn = document.getElementById(PIXABAY_SEARCH_BUTTON_ID);
        const pixabayInput = document.getElementById(PIXABAY_SEARCH_INPUT_ID);
        const importCurrentBtn = document.getElementById(PIXABAY_IMPORT_CURRENT_ID);
        const importNewBtn = document.getElementById(PIXABAY_IMPORT_NEW_ID);
        const prevBtn = document.getElementById(PIXABAY_PREV_BUTTON_ID);
        const nextBtn = document.getElementById(PIXABAY_NEXT_BUTTON_ID);

        if (pixabaySearchBtn) pixabaySearchBtn.addEventListener("click", () => triggerPixabaySearch(true));
        if (pixabayInput) pixabayInput.addEventListener("keypress", (e) => { if (e.key === 'Enter') triggerPixabaySearch(true); });
        if (importCurrentBtn) importCurrentBtn.addEventListener("click", () => handleImport('current'));
        if (importNewBtn) importNewBtn.addEventListener("click", () => handleImport('new'));
        if (prevBtn) prevBtn.addEventListener("click", () => { if (pixabayCurrentPage > 1 && !prevBtn.disabled) { pixabayCurrentPage--; triggerPixabaySearch(false); } });
        if (nextBtn) nextBtn.addEventListener("click", () => { if (!nextBtn.disabled) { pixabayCurrentPage++; triggerPixabaySearch(false); } });

        // --- Add AMLO.LIFE Link Listeners ---
        document.querySelectorAll('a[href="http://amloactions.carrd.co"]').forEach(link => {
            link.addEventListener("click", openAmloLife);
            console.log("[PANEL.JS LOG] Carrd.co link listener added.");
        });

        // --- Set Initial State ---
        showPanel(MAIN_PANEL_ID); // Start with the main panel
        updateAIStatus("System Ready. Pilih tindakan.", 'info');
        updatePaginationControls(); // Initial call to set pagination state
        console.log("[PANEL.JS LOG] Panel Initialization Complete.");

    } else {
        console.error("[PANEL.JS FATAL ERROR] CSInterface TIDAK TERDEFINISI.");
        updateAIStatus("KESALAHAN KRITIS: Gagal memuat panel.", 'error');
        document.querySelectorAll('.btn, .icon-btn').forEach(btn => btn.disabled = true);
    }
}

// Initialize after DOM is loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePanelEnvironment);
} else {
    initializePanelEnvironment();
}
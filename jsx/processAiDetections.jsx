// jsx/processAiDetections.jsx

#target photoshop

// Helper function
function createShapeRegion(coords) {
    var x1 = coords[0];
    var y1 = coords[1];
    var x2 = coords[2];
    var y2 = coords[3];
    return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
}

// Global flag (using standard ASCII)
if (typeof app.amloAiPanelActionsLoaded === 'undefined') {
    app.amloAiPanelActionsLoaded = false;
}

function mainProcessDetections(paramsStringFromPanel) {
    if (app.documents.length === 0) {
        return "Error: Tidak ada dokumen yang terbuka untuk diproses.";
    }

    var doc = app.activeDocument;
    var params;

    try {
        // Using eval is risky, but common. Ensure input is trusted/sanitized.
        // It's crucial that the string passed is exactly '( { ... } )'
        params = eval('(' + paramsStringFromPanel + ')');
    } catch (e) {
        return "Error (JSX): Gagal parsing parameter JSON. " + e.message + ". Input: " + paramsStringFromPanel.substring(0, 100);
    }

    if (!params || typeof params.detections !== 'object' || params.detections === null || typeof params.detections.length === 'undefined') {
        return "Error (JSX): Format 'detections' tidak valid. Harusnya array.";
    }

    // Convert array-like object to a proper array for easier iteration
    var detections = [];
    for (var k = 0; k < params.detections.length; k++) {
        if (params.detections[k]) {
            detections.push(params.detections[k]);
        }
    }

    var numDetections = detections.length;

    if (numDetections === 0) {
        return "Info (JSX): Tidak ada deteksi yang diterima untuk diproses.";
    }

    var selectionsMadeCount = 0;
    var actionsRunSuccessfully = 0;
    var errorMessages = [];
    var classCounts = {};
    var targetLayer;

    var ACTION_SET_NAME_IN_ATN = "amloai";
    var ACTION_NAME_IN_ATN = "CONTENT";
    var ATN_FILE_NAME = "amloai.atn";

    var FEATHER_AMOUNT_PX = 0;
    var EXPANSION_PX = 1;

    try {
        // Load Action Set if not loaded
        if (!app.amloAiPanelActionsLoaded) {
            try {
                var jsxFile = new File($.fileName);
                var jsxFolder = jsxFile.parent;
                var extensionFolder = jsxFolder.parent;
                var atnFilePath = extensionFolder.fsName + "/actions/" + ATN_FILE_NAME;
                var atnFile = new File(atnFilePath);

                if (atnFile.exists) {
                    app.load(atnFile);
                    app.amloAiPanelActionsLoaded = true;
                } else {
                    errorMessages.push("KRITIS: File Action '" + ATN_FILE_NAME + "' tidak ditemukan di '" + atnFile.fsName + "'.");
                }
            } catch (e_load_action) {
                errorMessages.push("KRITIS: Gagal memuat Action Set. Error: " + e_load_action.message);
            }
        }

        // Prepare Layer
        try {
            var originalLayerName = doc.activeLayer.name;
            targetLayer = doc.activeLayer.duplicate();
            targetLayer.name = originalLayerName + " (AI Processed)";
            doc.activeLayer = targetLayer;
            if (targetLayer.isBackgroundLayer) targetLayer.isBackgroundLayer = false;
            if (targetLayer.allLocked) targetLayer.allLocked = false;
            if (targetLayer.pixelsLocked) targetLayer.pixelsLocked = false;
            if (targetLayer.kind === LayerKind.SMARTOBJECT) {
                try { targetLayer.rasterize(RasterizeType.ENTIRELAYER); }
                catch (e_raster) { errorMessages.push("Peringatan: Gagal rasterize: " + e_raster.message); }
            }
        } catch (e_layer) {
            errorMessages.push("Info: Gagal duplikasi layer. Error: " + e_layer.message + ". Menggunakan layer aktif.");
            targetLayer = doc.activeLayer; // Fallback
        }

        try { doc.selection.deselect(); } catch (e_deselect_init) { /* ignore */ }

        // Create Combined Selection
        var allRegions = [];
        for (var i = 0; i < numDetections; i++) {
            var detection = detections[i];
            if (!detection || !detection.box_xyxy || detection.box_xyxy.length !== 4) continue;

            var x1 = parseFloat(detection.box_xyxy[0]), y1 = parseFloat(detection.box_xyxy[1]);
            var x2 = parseFloat(detection.box_xyxy[2]), y2 = parseFloat(detection.box_xyxy[3]);

            x1 = Math.max(0, x1 - EXPANSION_PX);
            y1 = Math.max(0, y1 - EXPANSION_PX);
            x2 = Math.min(doc.width.value - 1, x2 + EXPANSION_PX);
            y2 = Math.min(doc.height.value - 1, y2 + EXPANSION_PX);

            if ((x2 - x1) < 1 || (y2 - y1) < 1) continue;

            allRegions.push(createShapeRegion([x1, y1, x2, y2]));
            selectionsMadeCount++;
            var className = detection.class_name || "Unknown";
            classCounts[className] = (classCounts[className] || 0) + 1;
        }

        // Run Action
        if (allRegions.length > 0) {
            try {
                doc.selection.select(allRegions[0], SelectionType.REPLACE, FEATHER_AMOUNT_PX, true);
                for (var r = 1; r < allRegions.length; r++) {
                    doc.selection.select(allRegions[r], SelectionType.EXTEND, FEATHER_AMOUNT_PX, true);
                }

                var finalSelectionBounds;
                try { finalSelectionBounds = doc.selection.bounds; } catch (e) { /* no selection */ }

                if (finalSelectionBounds && app.amloAiPanelActionsLoaded) {
                    app.doAction(ACTION_NAME_IN_ATN, ACTION_SET_NAME_IN_ATN);
                    actionsRunSuccessfully = 1;
                    try { doc.selection.deselect(); } catch (e_deselect) { } // Deselect after action
                } else if (!app.amloAiPanelActionsLoaded) {
                    errorMessages.push("Action Set tidak dimuat, healing dilewati. Seleksi tetap aktif.");
                } else {
                    errorMessages.push("Gagal membuat seleksi akhir, Action tidak dijalankan.");
                }
            } catch (e_action_run) {
                errorMessages.push("Error saat membuat seleksi atau menjalankan Action: " + e_action_run.message);
                try { doc.selection.deselect(); } catch (ignore) { }
            }
        }

    } catch (e_main) {
        errorMessages.push("Error utama: " + e_main.message);
    }

    // Build Result Message
    var resultMessage = "";
    if (actionsRunSuccessfully > 0) resultMessage = "Action '" + ACTION_NAME_IN_ATN + "' dijalankan pada " + selectionsMadeCount + " area.";
    else if (selectionsMadeCount > 0) resultMessage = selectionsMadeCount + " area diseleksi. Action otomatis tidak berjalan.";
    else resultMessage = "Tidak ada area valid yang diproses.";

    var classSummary = [];
    for (var cName in classCounts) { classSummary.push(classCounts[cName] + " " + cName); }
    if (classSummary.length > 0) resultMessage += " Rincian: " + classSummary.join(", ") + ".";
    if (errorMessages.length > 0) resultMessage += " Info/Error: " + errorMessages.join("; ");

    return resultMessage;
}

mainProcessDetections; // Make the function available
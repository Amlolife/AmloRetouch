#target photoshop

function main() {
    if (!app.documents.length) {
        alert("Please open a document before running this script.");
        return;
    }

    // Helper function to convert a string to a character ID (charID)
    function cTID(s) { return charIDToTypeID(s); }
    // Helper function to convert a string to a string ID (stringID)
    function sTID(s) { return stringIDToTypeID(s); }

    // --- Layer Creation and Initial Processing ---
    var idMkNewLayer = cTID("Mk  ");
    var descNewLayer = new ActionDescriptor();
    var refNewLayer = new ActionReference();
    refNewLayer.putClass(cTID("Lyr "));
    descNewLayer.putReference(cTID("null"), refNewLayer);
    executeAction(idMkNewLayer, descNewLayer, DialogModes.NO);

    var idMrgVStampVisible = cTID("MrgV");
    var descStampVisible = new ActionDescriptor();
    descStampVisible.putBoolean(cTID("Dplc"), true);
    executeAction(idMrgVStampVisible, descStampVisible, DialogModes.NO);

    var idCpTLLayerViaCopy = cTID("CpTL");
    executeAction(idCpTLLayerViaCopy, undefined, DialogModes.NO);

    // --- Define TEKSTUR KULIT Layer ---
    // We will get the final layer objects by name later, before grouping.
    var descRenameL1 = new ActionDescriptor();
    var refRenameL1 = new ActionReference();
    refRenameL1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    descRenameL1.putReference(cTID("null"), refRenameL1);
    var descNameL1 = new ActionDescriptor();
    descNameL1.putString(cTID("Nm  "), "TEKSTUR KULIT");
    descRenameL1.putObject(cTID("T   "), cTID("Lyr "), descNameL1);
    executeAction(cTID("setd"), descRenameL1, DialogModes.NO);
    // app.activeDocument.activeLayer is now "TEKSTUR KULIT"

    executeAction(sTID("newPlacedLayer"), undefined, DialogModes.NO);
    var descHighPassL1 = new ActionDescriptor();
    descHighPassL1.putUnitDouble(cTID("Rds "), cTID("#Pxl"), 1.800000);
    executeAction(cTID("HghP"), descHighPassL1, DialogModes.NO);

    var descBlendModeL1 = new ActionDescriptor();
    var refBlendModeL1 = new ActionReference();
    refBlendModeL1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    descBlendModeL1.putReference(cTID("null"), refBlendModeL1);
    var descBlendPropsL1 = new ActionDescriptor();
    descBlendPropsL1.putEnumerated(cTID("Md  "), cTID("BlnM"), sTID("linearLight"));
    descBlendModeL1.putObject(cTID("T   "), cTID("Lyr "), descBlendPropsL1);
    executeAction(cTID("setd"), descBlendModeL1, DialogModes.NO);


    // --- Define WARNA KULIT Layer ---
    var descSelectPrevL2 = new ActionDescriptor();
    var refSelectPrevL2 = new ActionReference();
    refSelectPrevL2.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Bckw"));
    descSelectPrevL2.putReference(cTID("null"), refSelectPrevL2);
    executeAction(cTID("slct"), descSelectPrevL2, DialogModes.NO);
    // app.activeDocument.activeLayer is now the layer below "TEKSTUR KULIT"

    var descRenameL2 = new ActionDescriptor();
    var refRenameL2 = new ActionReference();
    refRenameL2.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    descRenameL2.putReference(cTID("null"), refRenameL2);
    var descNameL2 = new ActionDescriptor();
    descNameL2.putString(cTID("Nm  "), "WARNA KULIT");
    descRenameL2.putObject(cTID("T   "), cTID("Lyr "), descNameL2);
    executeAction(cTID("setd"), descRenameL2, DialogModes.NO);
    // app.activeDocument.activeLayer is now "WARNA KULIT"

    executeAction(sTID("newPlacedLayer"), undefined, DialogModes.NO);
    var descMedianL2 = new ActionDescriptor();
    descMedianL2.putUnitDouble(cTID("Rds "), cTID("#Pxl"), 60.000000);
    executeAction(cTID("Mdn "), descMedianL2, DialogModes.NO);


    // --- Define Texture Layer ---
    // Create a new layer for Texture. It will be created above the currently active "WARNA KULIT" layer.
    var descNewLayerL3 = new ActionDescriptor();
    var refNewLayerL3 = new ActionReference();
    refNewLayerL3.putClass(cTID("Lyr "));
    descNewLayerL3.putReference(cTID("null"), refNewLayerL3);
    var descPropsL3 = new ActionDescriptor();
    descPropsL3.putString(cTID("Nm  "), "Texture");
    descPropsL3.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Ovrl"));
    descPropsL3.putBoolean(cTID("FlNt"), true);
    descNewLayerL3.putObject(cTID("Usng"), cTID("Lyr "), descPropsL3);
    executeAction(cTID("Mk  "), descNewLayerL3, DialogModes.NO);
    // app.activeDocument.activeLayer is now "Texture"

    executeAction(sTID("newPlacedLayer"), undefined, DialogModes.NO);
    var descAddNoiseL3 = new ActionDescriptor();
    descAddNoiseL3.putEnumerated(cTID("Dstr"), cTID("Dstr"), cTID("Unfr"));
    descAddNoiseL3.putUnitDouble(cTID("Nose"), cTID("#Prc"), 16.320000);
    descAddNoiseL3.putBoolean(cTID("Mnch"), true);
    executeAction(cTID("AdNs"), descAddNoiseL3, DialogModes.NO);

    var descGaussBlurL3 = new ActionDescriptor();
    descGaussBlurL3.putUnitDouble(cTID("Rds "), cTID("#Pxl"), 1.800000);
    executeAction(cTID("GsnB"), descGaussBlurL3, DialogModes.NO);


    // --- Create an Empty Group and Move Layers Into It ---
    var groupLayer;
    try {
        // Re-acquire layer references by name to ensure they are current
        var finalTeksturKulitLayer = null;
        var finalWarnaKulitLayer = null;
        var finalTextureLayer = null;

        try {
            finalTeksturKulitLayer = app.activeDocument.artLayers.getByName("TEKSTUR KULIT");
        } catch (e) {
            alert("Error finding 'TEKSTUR KULIT' layer: " + e);
        }
        try {
            finalWarnaKulitLayer = app.activeDocument.artLayers.getByName("WARNA KULIT");
        } catch (e) {
            alert("Error finding 'WARNA KULIT' layer: " + e);
        }
        try {
            finalTextureLayer = app.activeDocument.artLayers.getByName("Texture");
        } catch (e) {
            alert("Error finding 'Texture' layer: " + e);
        }

        groupLayer = app.activeDocument.layerSets.add();
        groupLayer.name = "AMLO RETOUCH";

        // Move the re-acquired layers. Order: Bottom-most in group first.
        if (finalWarnaKulitLayer) {
            finalWarnaKulitLayer.move(groupLayer, ElementPlacement.INSIDE);
        } else {
            alert("'WARNA KULIT' layer not found or invalid for grouping.");
        }
        if (finalTextureLayer) {
            finalTextureLayer.move(groupLayer, ElementPlacement.INSIDE);
        } else {
            alert("'Texture' layer not found or invalid for grouping.");
        }
        if (finalTeksturKulitLayer) {
            finalTeksturKulitLayer.move(groupLayer, ElementPlacement.INSIDE);
        } else {
            alert("'TEKSTUR KULIT' layer not found or invalid for grouping.");
        }

        app.activeDocument.activeLayer = groupLayer;

    } catch (e) {
        alert("Could not create group or move layers.\nError: " + e);
        return;
    }

    // --- Add & Invert Layer Mask (Add "Hide All" Mask) to the Group ---
    try {
        var idMk = cTID("Mk  ");
        var descAddHideAllMask = new ActionDescriptor();
        var idNw = cTID("Nw  ");
        descAddHideAllMask.putClass(idNw, cTID("Chnl"));
        var idAt = cTID("At  ");
        var refMaskTarget = new ActionReference();
        refMaskTarget.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
        descAddHideAllMask.putReference(idAt, refMaskTarget);
        var idUsng = cTID("Usng");
        descAddHideAllMask.putEnumerated(idUsng, cTID("UsrM"), cTID("HdAl"));
        executeAction(idMk, descAddHideAllMask, DialogModes.NO);

    } catch (e) {
        alert("Gagal saat pembuatan layer mask (Hide All).\n" + (e.message || e.toString()));
        return;
    }

    // --- Select Brush Tool ---
    var descSelectBrush = new ActionDescriptor();
    var refSelectBrush = new ActionReference();
    refSelectBrush.putClass(cTID("PbTl"));
    descSelectBrush.putReference(cTID("null"), refSelectBrush);
    executeAction(cTID("slct"), descSelectBrush, DialogModes.NO);

    alert("Script AMLO RETOUCH process completed.");
}

// Run the main function with error trapping
try {
    main();
} catch (e) {
    alert("Script Error: " + (e.message || e.toString()));
}

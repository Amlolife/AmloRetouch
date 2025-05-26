#target photoshop

/**
 * Creates a Hue/Saturation adjustment layer,
 * targets Yellows, sets Lightness to +88 and Saturation to -10,
 * and then inverts the layer mask.
 */
function createYellowLightnessBoostLayer() {
    // Check if a document is open
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }

    try {
        // =======================================================
        // 1. Create a new Hue/Saturation Adjustment Layer
        // =======================================================
        var idMk = charIDToTypeID("Mk  ");
        var desc1 = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        var ref1 = new ActionReference();
        var idAdjL = charIDToTypeID("AdjL");
        ref1.putClass(idAdjL);
        desc1.putReference(idnull, ref1);
        var idUsng = charIDToTypeID("Usng");
        var desc2 = new ActionDescriptor();
        var idType = charIDToTypeID("Type");
        var desc3 = new ActionDescriptor();
        var idpresetKind = stringIDToTypeID("presetKind");
        var idpresetKindType = stringIDToTypeID("presetKindType");
        var idpresetKindDefault = stringIDToTypeID("presetKindDefault");
        desc3.putEnumerated(idpresetKind, idpresetKindType, idpresetKindDefault);
        var idClrz = charIDToTypeID("Clrz");
        desc3.putBoolean(idClrz, false);
        var idHStr = charIDToTypeID("HStr");
        desc2.putObject(idType, idHStr, desc3);
        var idAdjL = charIDToTypeID("AdjL");
        desc1.putObject(idUsng, idAdjL, desc2);
        executeAction(idMk, desc1, DialogModes.NO);

        // =======================================================
        // 2. Set the Hue/Saturation values (Target Yellows)
        // =======================================================
        var idsetd = charIDToTypeID("setd");
        var desc4 = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        var ref2 = new ActionReference();
        var idAdjL = charIDToTypeID("AdjL");
        var idOrdn = charIDToTypeID("Ordn");
        var idTrgt = charIDToTypeID("Trgt");
        ref2.putEnumerated(idAdjL, idOrdn, idTrgt);
        desc4.putReference(idnull, ref2);
        var idT = charIDToTypeID("T   ");
        var desc5 = new ActionDescriptor();
        var idpresetKind = stringIDToTypeID("presetKind");
        var idpresetKindType = stringIDToTypeID("presetKindType");
        var idpresetKindCustom = stringIDToTypeID("presetKindCustom");
        desc5.putEnumerated(idpresetKind, idpresetKindType, idpresetKindCustom);
        var idAdjs = charIDToTypeID("Adjs");
        var list1 = new ActionList();
        var desc6 = new ActionDescriptor();
        var idLclR = charIDToTypeID("LclR");
        desc6.putInteger(idLclR, 2); // 2 = Yellows
        var idBgnR = charIDToTypeID("BgnR");
        desc6.putInteger(idBgnR, 15);
        var idBgnS = charIDToTypeID("BgnS");
        desc6.putInteger(idBgnS, 45);
        var idEndS = charIDToTypeID("EndS");
        desc6.putInteger(idEndS, 75);
        var idEndR = charIDToTypeID("EndR");
        desc6.putInteger(idEndR, 105);
        var idH = charIDToTypeID("H   ");
        desc6.putInteger(idH, 0); // Hue = 0
        var idStrt = charIDToTypeID("Strt");
        desc6.putInteger(idStrt, -10); // Saturation = -10
        var idLght = charIDToTypeID("Lght");
        desc6.putInteger(idLght, 88); // Lightness = +88
        var idHsttwo = charIDToTypeID("Hst2");
        list1.putObject(idHsttwo, desc6);
        desc5.putList(idAdjs, list1);
        var idHStr = charIDToTypeID("HStr");
        desc4.putObject(idT, idHStr, desc5);
        executeAction(idsetd, desc4, DialogModes.NO);

        // =======================================================
        // 3. Select the Layer Mask (Important for Invert)
        // =======================================================
        var idslct = charIDToTypeID("slct");
        var desc7 = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        var ref3 = new ActionReference();
        var idChnl = charIDToTypeID("Chnl");
        var idChnl = charIDToTypeID("Chnl");
        var idMsk = charIDToTypeID("Msk ");
        ref3.putEnumerated(idChnl, idChnl, idMsk);
        desc7.putReference(idnull, ref3);
        var idMkVs = charIDToTypeID("MkVs");
        desc7.putBoolean(idMkVs, false);
        executeAction(idslct, desc7, DialogModes.NO);

        // =======================================================
        // 4. Invert the Layer Mask
        // =======================================================
        var idInvr = charIDToTypeID("Invr");
        executeAction(idInvr, undefined, DialogModes.NO);

    } catch (e) {
        alert("An error occurred: " + e);
    }
}

// --- How to use it: ---
// Simply call the function when you need it.
// For example, in your panel.js, you would call a JSX file that contains
// this function and executes it. Or, you can run this directly in Photoshop's
// File > Scripts > Browse... menu.

createYellowLightnessBoostLayer(); // Call the function to run it
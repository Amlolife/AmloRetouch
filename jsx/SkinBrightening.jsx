// amloScreenMask.jsx
function amloScreenMask() {
    // 1) Duplicate the current layer
    var idCpTL = charIDToTypeID("CpTL");
    executeAction(idCpTL, undefined, DialogModes.NO);

    // 2) Change its blending mode to Screen
    var idsetd = charIDToTypeID("setd");
    var desc = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref.putEnumerated(idLyr, idOrdn, idTrgt);
    desc.putReference(idnull, ref);
    var idT = charIDToTypeID("T   ");
    var desc2 = new ActionDescriptor();
    var idMd = charIDToTypeID("Md  ");
    var idBlnM = charIDToTypeID("BlnM");
    var idScrn = charIDToTypeID("Scrn");
    desc2.putEnumerated(idMd, idBlnM, idScrn);
    desc.putObject(idT, idLyr, desc2);
    executeAction(idsetd, desc, DialogModes.NO);

    // 3) Add a layer mask (Hide All)
    var idMk = charIDToTypeID("Mk  ");
    var desc3 = new ActionDescriptor();
    var idNw = charIDToTypeID("Nw  ");
    var idChnl = charIDToTypeID("Chnl");
    desc3.putClass(idNw, idChnl);
    var idAt = charIDToTypeID("At  ");
    var ref2 = new ActionReference();
    ref2.putEnumerated(idChnl, idChnl, charIDToTypeID("Msk "));
    desc3.putReference(idAt, ref2);
    var idUsng = charIDToTypeID("Usng");
    var idUsrM = charIDToTypeID("UsrM");
    var idHdAl = charIDToTypeID("HdAl");
    desc3.putEnumerated(idUsng, idUsrM, idHdAl);
    executeAction(idMk, desc3, DialogModes.NO);
}

// Execute the function
amloScreenMask();

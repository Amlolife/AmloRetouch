// jsx/importImage.jsx

#target photoshop

// Function to decode Base64 - MUST exist in JSX context
if (typeof String.prototype.decode === 'undefined') {
    String.prototype.decode = function () {
        var e = {}, i, b = 0, c, x, l = 0, a, r = '', w = String.fromCharCode, L = this.length;
        var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (i = 0; i < 64; i++) { e[A.charAt(i)] = i; }
        for (x = 0; x < L; x++) {
            c = e[this.charAt(x)];
            b = (b << 6) + c;
            l += 6;
            while (l >= 8) {
                ((a = (b >>> (l -= 8)) & 0xff) || (x < (L - 2))) && (r += w(a));
            }
        }
        return r;
    };
}

// Main function called from panel.js
function importFromBase64File(base64FilePath, importType, originalFileName) {
    try {
        var base64File = new File(base64FilePath);
        if (!base64File.exists) {
            return "ERROR: Temporary Base64 file not found: " + base64FilePath;
        }

        base64File.open("r");
        var base64Data = base64File.read();
        base64File.close();

        if (!base64Data || base64Data.length < 100) {
            return "ERROR: Could not read Base64 data or data is too small.";
        }

        var decodedData = base64Data.decode();
        if (!decodedData) {
            return "ERROR: Failed to decode Base64 data.";
        }

        var tempFolder = Folder.temp;
        var tempFile = new File(tempFolder + "/" + originalFileName);

        tempFile.encoding = "BINARY";
        tempFile.open("w");
        tempFile.write(decodedData);
        tempFile.close();

        if (!tempFile.exists) {
            return "ERROR: Failed to write temporary image file.";
        }

        var placed = false;
        if (importType === 'new') {
            app.open(tempFile);
            placed = true;
        } else {
            if (app.documents.length > 0) {
                placeFileAsSmartObject(tempFile);
                placed = true;
            } else {
                // No document open, so open in new tab anyway
                app.open(tempFile);
                placed = true;
                // Optionally return a message indicating it was opened new
            }
        }

        // Clean up the temporary image file
        tempFile.remove();

        return placed ? "Image import successful." : "ERROR: Could not place image (check if a document is open for 'Import Here').";

    } catch (e) {
        // Clean up even on error, if possible
        if (tempFile && tempFile.exists) {
            try { tempFile.remove(); } catch (ignore) { }
        }
        return "ERROR: " + e.toString() + " (Line: " + e.line + ")";
    }
}


// Function to place a file as a Smart Object
function placeFileAsSmartObject(fileToPlace) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), fileToPlace);
    desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa")); // FreeTransformCenterState
    var LyrDesc = new ActionDescriptor();
    LyrDesc.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0.000000); // Horizontal
    LyrDesc.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0.000000); // Vertical
    desc.putObject(charIDToTypeID("Ofst"), charIDToTypeID("Ofst"), LyrDesc); // Offset
    desc.putBoolean(charIDToTypeID("Lnkd"), false); // Link vs Embed (false = Embed)
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO); // 'Plc ' is Place Event
}
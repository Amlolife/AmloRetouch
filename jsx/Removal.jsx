// Ensure Photoshop is the target application
#target photoshop

    // Main function to encapsulate the script
    (function () {
        // Alias for stringIDToTypeID
        var s2t = stringIDToTypeID;
        // Alias for charIDToTypeID
        var c2t = charIDToTypeID;

        // Check if a document is open
        if (app.documents.length === 0) {
            alert("Please open a document before running this script.");
            return;
        }

        var activeDoc = app.activeDocument;
        var targetLayer;

        // Check if there is an active layer
        try {
            targetLayer = activeDoc.activeLayer;
            if (!targetLayer) {
                alert("Please select a layer before running this script.");
                return;
            }
        } catch (e) {
            alert("Could not get the active layer. Please ensure a document is active and a layer is selected. Error: " + e);
            return;
        }

        // --- Action 1: Duplicate the active layer ---
        var duplicatedLayer;
        try {
            duplicatedLayer = targetLayer.duplicate();
            activeDoc.activeLayer = duplicatedLayer; // Ensure the duplicated layer is active
            // alert("Layer duplicated. Active layer is now: " + duplicatedLayer.name);
        } catch (e) {
            alert("Error duplicating layer:\n" + e + "\nEnsure a layer is selected and can be duplicated.");
            return; // Stop if this critical step fails
        }

        // --- Action 2: Convert the duplicated layer to a Smart Object ---
        // Using app.runMenuItem for potentially more stable behavior on the active layer
        try {
            app.runMenuItem(s2t('newPlacedLayer')); // This is the menu command ID for "Convert to Smart Object"
            // alert("Active layer converted to Smart Object. Name: " + activeDoc.activeLayer.name);
        } catch (e) {
            alert("Error executing 'Convert to Smart Object' (via menu item):\n" + e);
            return; // Stop if this critical step fails
        }

        // --- Action 3: Dust & Scratches Filter (DstS) ---
        // Parameters from your log: Radius 13, Threshold 28
        try {
            var desc4 = new ActionDescriptor();
            desc4.putInteger(c2t("Rds "), 13); // Radius
            desc4.putInteger(c2t("Thsh"), 28); // Threshold
            executeAction(c2t("DstS"), desc4, DialogModes.NO);
        } catch (e) {
            alert("Error applying 'Dust & Scratches' filter:\n" + e);
        }

        // --- Action 4: Add Layer Mask (Mk  ) - Hide All ---
        try {
            var desc5 = new ActionDescriptor();
            var ref1 = new ActionReference();

            desc5.putClass(c2t("Nw  "), c2t("Chnl")); // New: Channel
            ref1.putEnumerated(c2t("Chnl"), c2t("Chnl"), c2t("Msk ")); // At: Channel > Mask
            desc5.putReference(c2t("At  "), ref1);
            desc5.putEnumerated(c2t("Usng"), c2t("UsrM"), c2t("HdAl")); // Using: User Mask > Hide All
            executeAction(c2t("Mk  "), desc5, DialogModes.NO);
        } catch (e) {
            alert("Error adding Layer Mask (Hide All):\n" + e);
        }

        // --- Action 5: Select Move Tool ---
        try {
            var desc6 = new ActionDescriptor();
            var ref2 = new ActionReference();
            ref2.putClass(s2t("moveTool"));
            desc6.putReference(c2t("null"), ref2);
            executeAction(c2t("slct"), desc6, DialogModes.NO);
        } catch (e) {
            alert("Error selecting Move Tool:\n" + e);
        }

        // --- Action 6: Select Paintbrush Tool ---
        try {
            var desc7 = new ActionDescriptor();
            var ref3 = new ActionReference();
            ref3.putClass(c2t("PbTl")); // Paintbrush Tool
            desc7.putReference(c2t("null"), ref3);
            executeAction(c2t("slct"), desc7, DialogModes.NO);
        } catch (e) {
            alert("Error selecting Paintbrush Tool:\n" + e);
        }

        // alert("Script finished!"); // Optional

    })(); // End of script wrapper
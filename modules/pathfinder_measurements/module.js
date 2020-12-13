pfMeasurements = new Map();

//TODO: icons
Events.on("addModeButtons", event => {
    event.addButton(new ExtendedModeButton(new ModeButton("line", "Measurements", () => StateMain.mode instanceof CanvasModeMeasurements, () => {
            // restore/keep existing state when clicking main button
            var type = "LINE";
            var reset = true;
            var step = 0;
            if(pfMeasurements.has(ServerData.localProfile.id)) {
                type = pfMeasurements.get(ServerData.localProfile.id).type;
                reset = false;
                if(pfMeasurements.get(ServerData.localProfile.id).x1 != undefined) step = 1;
                if(pfMeasurements.get(ServerData.localProfile.id).x2 != undefined) step = 2;
            }
            
            // enter detected state
            if(type == undefined || type == null) type = "LINE";
            event.panel.setMode(new CanvasModeMeasurements(type, reset, step))
        }), 0, [
            new ModeButton("line", "Measure Line", () => StateMain.mode instanceof CanvasModeMeasurements && StateMain.mode.type == "LINE", () => event.panel.setMode(new CanvasModeMeasurements("LINE", true))),
            new ModeButton("circle", "Measure Circle", () => StateMain.mode instanceof CanvasModeMeasurements && StateMain.mode.type == "CIRCLE", () => event.panel.setMode(new CanvasModeMeasurements("CIRCLE", true))),
            new ModeButton("cone", "Measure Cone", () => StateMain.mode instanceof CanvasModeMeasurements && StateMain.mode.type == "CONE", () => event.panel.setMode(new CanvasModeMeasurements("CONE", true))),
            new ModeButton("trash", "Delete Measurement", () => false, () => { if(!(StateMain.mode instanceof CanvasModeMeasurements)) event.panel.setMode(new CanvasModeMeasurements("LINE", true)); StateMain.mode.deleteOwnMeasurement(); event.panel.setMode(new CanvasModeEntities("token", event.panel.currentLayer)); }),
            new ModeButton("trashAll", "Delete All Measurements", () => false, () => { if(!(StateMain.mode instanceof CanvasModeMeasurements)) event.panel.setMode(new CanvasModeMeasurements("LINE", true)); StateMain.mode.deleteAllMeasurements(); event.panel.setMode(new CanvasModeEntities("token", event.panel.currentLayer)); })
        ])
    );
});

Events.on("addRenderLayers", event => {
    event.addRenderLayer(new CanvasRenderLayerMeasurements(1900));
});

// track measurement state based on action commands
Events.on("actionCommand", event => {
    if(event.command == "PF_RESET_MEASUREMENT") {
        if(event.gm && event.modified) {
            pfMeasurements.clear();
        } else {
            pfMeasurements.delete(event.sender);
        }
    } else if(event.command == "PF_MEASUREMENT") {
        var measurement = pfMeasurements.get(event.sender);
        if(measurement == null || measurement == undefined) measurement = {};
        
        measurement.map = event.id;
        measurement.type = event.text;
        if(event.modified) {
            measurement.x1 = event.x;
            measurement.y1 = event.y;
        } else {
            measurement.x2 = event.x;
            measurement.y2 = event.y;
        }
        
        pfMeasurements.set(event.sender, measurement);
    }
});

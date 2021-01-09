import { Measurements } from './measurements.js';
import { CanvasRenderLayerMeasurements } from './canvas/renderlayer/canvas-renderlayer-measurements.js';
import { CanvasModeMeasurements } from './canvas/mode/canvas-mode-measurements.js';

import { Events } from '../../../core/common/events.js';
import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';
import { Client } from '../../../core/client/app.js';
import { StateMain } from '../../../core/client/state/state-main.js';
import { CanvasModeEntities } from '../../../core/client/canvas/mode/canvas-mode-entities.js';
import { ServerData } from '../../../core/client/server-data.js';


Events.on('addModeButtons', event => {
    event.addButton(new ModeButtonExtended(new ModeButton('/modules/pathfinder_measurements/files/img/gui/line', 'Measurements', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeMeasurements, () => {
            // restore/keep existing state when clicking main button
            var type = 'LINE';
            var reset = true;
            var step = 0;
            if(Measurements.has(ServerData.localProfile.getID())) {
                type = Measurements.get(ServerData.localProfile.getID()).type;
                reset = false;
                if(Measurements.get(ServerData.localProfile.getID()).x1 != undefined) step = 1;
                if(Measurements.get(ServerData.localProfile.getID()).x2 != undefined) step = 2;
            }
            
            // enter detected state
            if(type == undefined || type == null) type = 'LINE';
            event.panel.setMode(new CanvasModeMeasurements(type, reset, step))
        }), 0, [
            new ModeButton('/modules/pathfinder_measurements/files/img/gui/line', 'Measure Line', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeMeasurements && Client.getState().getMode().type == 'LINE', () => event.panel.setMode(new CanvasModeMeasurements('LINE', true))),
            new ModeButton('/modules/pathfinder_measurements/files/img/gui/circle', 'Measure Circle', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeMeasurements && Client.getState().getMode().type == 'CIRCLE', () => event.panel.setMode(new CanvasModeMeasurements('CIRCLE', true))),
            new ModeButton('/modules/pathfinder_measurements/files/img/gui/cone', 'Measure Cone', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeMeasurements && Client.getState().getMode().type == 'CONE', () => event.panel.setMode(new CanvasModeMeasurements('CONE', true))),
            new ModeButton('/modules/pathfinder_measurements/files/img/gui/trash', 'Delete Measurement', () => false, () => { if(!(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeMeasurements)) event.panel.setMode(new CanvasModeMeasurements('LINE', true)); Client.getState().getMode().deleteOwnMeasurement(); event.panel.setMode(new CanvasModeEntities('token', event.panel.currentLayer)); }),
            new ModeButton('/modules/pathfinder_measurements/files/img/gui/trashAll', 'Delete All Measurements', () => false, () => { if(!(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeMeasurements)) event.panel.setMode(new CanvasModeMeasurements('LINE', true)); Client.getState().getMode().deleteAllMeasurements(); event.panel.setMode(new CanvasModeEntities('token', event.panel.currentLayer)); })
        ])
    );
});

Events.on('addRenderLayers', event => {
    event.addRenderLayer(new CanvasRenderLayerMeasurements(1900));
});

// track measurement state based on action commands
Events.on('actionCommand', event => {
    if(event.getCommand() == 'PF_MEASUREMENT_RESET') {
        if(event.isGM() && event.isModified()) {
            Measurements.clear();
        } else {
            Measurements.delete(event.getSender());
        }
    } else if(event.getCommand() == 'PF_MEASUREMENT') {
        var measurement = Measurements.get(event.getSender());
        if(measurement == null || measurement == undefined) measurement = {};
        
        measurement.map = event.getID();
        measurement.type = event.getText();
        if(event.modified) {
            measurement.x1 = event.getX();
            measurement.y1 = event.getY();
        } else {
            measurement.x2 = event.getX();
            measurement.y2 = event.getY();
        }
        
        Measurements.set(event.getSender(), measurement);
    }
});

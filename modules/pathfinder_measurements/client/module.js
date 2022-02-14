import { Measurements } from './measurements.js';
import { CanvasRenderLayerMeasurements } from './canvas/renderlayer/canvas-renderlayer-measurements.js';
import { CanvasModeMeasurements } from './canvas/mode/canvas-mode-measurements.js';

import { Events } from '../../../core/common/events.js';
import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';
import { Client } from '../../../core/client/client.js';
import { CanvasModeEntities } from '../../../core/client/canvas/mode/canvas-mode-entities.js';
import { ServerData } from '../../../core/client/server-data.js';


Events.on('addModeButtons', event => {
    event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/pathfinder_measurements/files/img/gui/line', 'Measurements', () => Client.getState().getMode() instanceof CanvasModeMeasurements, () => {
        // restore/keep existing state when clicking main button
        var type = 'LINE';
        var reset = true;
        var step = 0;
        if (Measurements.has(ServerData.localProfile.getID())) {
            type = Measurements.get(ServerData.localProfile.getID()).type;
            reset = false;
            if (Measurements.get(ServerData.localProfile.getID()).x1 != undefined) step = 1;
            if (Measurements.get(ServerData.localProfile.getID()).x2 != undefined) step = 2;
        }

        // enter detected state
        if (type == undefined || type == null) type = 'LINE';
        Client.getState().setMode(new CanvasModeMeasurements(type, reset, step))
    }), 0, [
        new ModeButton('/modules/pathfinder_measurements/files/img/gui/line', 'Measure Line', () => Client.getState().getMode() instanceof CanvasModeMeasurements && Client.getState().getMode().type == 'LINE', () => Client.getState().setMode(new CanvasModeMeasurements('LINE', true))),
        new ModeButton('/modules/pathfinder_measurements/files/img/gui/circle', 'Measure Circle', () => Client.getState().getMode() instanceof CanvasModeMeasurements && Client.getState().getMode().type == 'CIRCLE', () => Client.getState().setMode(new CanvasModeMeasurements('CIRCLE', true))),
        new ModeButton('/modules/pathfinder_measurements/files/img/gui/cone', 'Measure Cone', () => Client.getState().getMode() instanceof CanvasModeMeasurements && Client.getState().getMode().type == 'CONE', () => Client.getState().setMode(new CanvasModeMeasurements('CONE', true))),
        new ModeButton('/modules/pathfinder_measurements/files/img/gui/trash', 'Delete Measurement', () => false, () => { if (!(Client.getState().getMode() instanceof CanvasModeMeasurements)) Client.getState().setMode(new CanvasModeMeasurements('LINE', true)); Client.getState().getMode().deleteOwnMeasurement(); Client.getState().setMode(new CanvasModeEntities('token')); }),
        new ModeButton('/modules/pathfinder_measurements/files/img/gui/trashAll', 'Delete All Measurements', () => false, () => { if (!(Client.getState().getMode() instanceof CanvasModeMeasurements)) Client.getState().setMode(new CanvasModeMeasurements('LINE', true)); Client.getState().getMode().deleteAllMeasurements(); Client.getState().setMode(new CanvasModeEntities('token')); })
    ])
    );
});

Events.on('addRenderLayers', event => {
    event.data.addRenderLayer(new CanvasRenderLayerMeasurements(1900));
});

// track measurement state based on action commands
Events.on('actionCommand', event => {
    if (event.data.getCommand() == 'PF_MEASUREMENT_RESET') {
        if (event.data.isGM() && event.data.isModified()) {
            Measurements.clear();
        } else {
            Measurements.delete(event.data.getSender());
        }
    } else if (event.data.getCommand() == 'PF_MEASUREMENT') {
        var measurement = Measurements.get(event.data.getSender());
        if (measurement == null || measurement == undefined) measurement = {};

        measurement.map = event.data.getID();
        measurement.type = event.data.getText();
        if (event.data.modified) {
            measurement.x1 = event.data.getX();
            measurement.y1 = event.data.getY();
        } else {
            measurement.x2 = event.data.getX();
            measurement.y2 = event.data.getY();
        }

        Measurements.set(event.data.getSender(), measurement);
    }
});

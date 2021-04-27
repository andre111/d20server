import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';
import { ServerData } from '../../../core/client/server-data.js';
import { MapUtils } from '../../../core/client/util/maputil.js';
import { Client } from '../../../core/client/app.js';
import { StateMain } from '../../../core/client/state/state-main.js';
import { CanvasModeEntities } from '../../../core/client/canvas/mode/canvas-mode-entities.js';
import { CanvasWindowColorInput } from '../../../core/client/canvas/window/canvas-window-color-input.js';

import { Events } from '../../../core/common/events.js';
import { Layer } from '../../../core/common/constants.js';

import { CanvasModeDrawingsGlobals, CanvasModeDrawings } from './canvas/mode/canvas-mode-drawings.js';
import { CanvasRenderLayerDrawings } from './canvas/renderlayer/canvas-renderlayer-drawings.js';
import { CanvasEntityRendererDrawing } from './canvas/entityrenderer/canvas-entityrenderer-drawing.js';

Events.on('addModeButtons', event => {
    CanvasModeDrawingsGlobals.color = '#' + (ServerData.localProfile.getColor() & 0x00FFFFFF).toString(16).padStart(6, '0');
    
    event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/drawing/files/img/gui/brush', 'Draw Shapes', () => (Client.getState().getMode() instanceof CanvasModeDrawings || (Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'drawing')), () => Client.getState().setMode(new CanvasModeDrawings('DRAW_RECT'))), 0, [
            new ModeButton('/modules/drawing/files/img/gui/cursor', 'Edit Drawings', () => Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'drawing', () => Client.getState().setMode(new CanvasModeEntities('drawing'))),
            new ModeButton('/modules/drawing/files/img/gui/rect', 'Draw Rectangles', () => Client.getState().getMode() instanceof CanvasModeDrawings && Client.getState().getMode().action == 'DRAW_RECT', () => Client.getState().setMode(new CanvasModeDrawings('DRAW_RECT'))),
            new ModeButton('/modules/drawing/files/img/gui/oval', 'Draw Ovals', () => Client.getState().getMode() instanceof CanvasModeDrawings && Client.getState().getMode().action == 'DRAW_OVAL', () => Client.getState().setMode(new CanvasModeDrawings('DRAW_OVAL'))),
            new ModeButton('/modules/drawing/files/img/gui/text', 'Write Text', () => Client.getState().getMode() instanceof CanvasModeDrawings && Client.getState().getMode().action == 'WRITE_TEXT', () => Client.getState().setMode(new CanvasModeDrawings('WRITE_TEXT'))),
            new ModeButton('/modules/drawing/files/img/gui/trash', 'Delete Drawings', () => Client.getState().getMode() instanceof CanvasModeDrawings && Client.getState().getMode().action == 'DELETE', () => Client.getState().setMode(new CanvasModeDrawings('DELETE'))),
            new ModeButton('/modules/drawing/files/img/gui/trashAll', 'Delete All Drawings', () => false, () => { if(!(Client.getState().getMode() instanceof CanvasModeDrawings)) Client.getState().setMode(new CanvasModeDrawings('DELETE')); Client.getState().getMode().deleteAllDrawings(); }),
            new ModeButton('/core/files/img/gui/x_empty', 'Select Color', (mb) => { mb.button.style.background = CanvasModeDrawingsGlobals.color; return false; }, () => { 
                new CanvasWindowColorInput('Select Drawing Color', CanvasModeDrawingsGlobals.color, color => { 
                    if(color) CanvasModeDrawingsGlobals.color = color; 
                    Events.trigger('updateModeState');
                }) 
            })
        ])
    );
});

Events.on('updateModeState', event => {
    var allowDrawing = false;
    var map = MapUtils.currentMap();
    if(map && (ServerData.isGM() || map.getBoolean('playersCanDraw'))) allowDrawing = true;
    if(!allowDrawing && (Client.getState().getMode() instanceof CanvasModeDrawings || (Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'drawing'))) {
        Client.getState().setMode(new CanvasModeEntities('token'));
    }
});

Events.on('addRenderLayers', event => {
    event.data.addRenderLayer(new CanvasRenderLayerDrawings(-900, Layer.BACKGROUND));
    event.data.addRenderLayer(new CanvasRenderLayerDrawings(1100, Layer.MAIN));
    event.data.addRenderLayer(new CanvasRenderLayerDrawings(2100, Layer.GMOVERLAY, 0.5, true));
});

Events.on('addEntityRenderers', event => {
    event.data.addEntityRenderer('drawing', new CanvasEntityRendererDrawing());
});

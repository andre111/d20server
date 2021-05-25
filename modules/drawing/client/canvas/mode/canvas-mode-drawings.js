import { Client } from '../../../../../core/client/client.js';
import { CanvasMode } from '../../../../../core/client/canvas/canvas-mode.js';
import { CanvasWindowConfirm } from '../../../../../core/client/canvas/window/canvas-window-confirm.js';
import { CanvasWindowInput } from '../../../../../core/client/canvas/window/canvas-window-input.js';
import { ServerData } from '../../../../../core/client/server-data.js';
import { MapUtils } from '../../../../../core/client/util/maputil.js';

import { Entity } from '../../../../../core/common/common.js';
import { EntityManagers } from '../../../../../core/common/entity/entity-managers.js';

import { DrawingRenderer } from '../../renderer/drawing-renderer.js';

export const CanvasModeDrawingsGlobals = {
    color: '#FFFFFF'
}

export class CanvasModeDrawings extends CanvasMode {
    constructor(action) {
        super();
        
        this.action = action;
        
        this.startX = 0;
        this.startY = 0;
        this.currentDrawing = null;
    }
    
    init() {
    }

    exit() {
    }
    
    renderOverlay(ctx) {
        if(this.currentDrawing != null) {
            DrawingRenderer.renderDrawing(ctx, this.currentDrawing);
        }
    }

    actionPerformed(action) {
    }
    
    mousePressed(e) {
		// left click
        if(e.which == 1) {
            this.xStart = e.xm;
            this.yStart = e.ym;
            
            var map = MapUtils.currentMap();
            if(map == null || map == undefined) return;
            
            switch(this.action) {
            case 'DRAW_RECT':
                this.currentDrawing = this.newDrawing(ServerData.localProfile, map, this.xStart-1, this.yStart-1, 2, 2, 0, e.shiftKey ? 'rectOutline' : 'rect', CanvasModeDrawingsGlobals.color);
                break;
            case 'DRAW_OVAL':
                this.currentDrawing = this.newDrawing(ServerData.localProfile, map, this.xStart-1, this.yStart-1, 2, 2, 0, e.shiftKey ? 'ovalOutline' : 'oval', CanvasModeDrawingsGlobals.color);
                break;
            case 'WRITE_TEXT':
                new CanvasWindowInput(null, 'Add Text', 'Enter Text: ', '', text => {
                    if(text != null && text != undefined && text != '') {
                        EntityManagers.get('drawing').add(this.newDrawing(ServerData.localProfile, map, this.xStart-16, this.yStart-16, DrawingRenderer.getTextWidth(text)+8, 40, 0, 'text:'+text, CanvasModeDrawingsGlobals.color));
                    }
                });
                break;
            default:
                break;
            }
        }
        
        // right click
        if(e.which == 3) {
            this.currentDrawing = null;
        }
    }
    
    newDrawing(creator, map, x, y, width, height, rotation, shape, color) {
        var drawing = new Entity('drawing');
        
        drawing.setLong('creator', creator.id);
		drawing.setLong('map', map.id);
		
		drawing.setLong('x', x);
		drawing.setLong('y', y);
		drawing.setLong('width', width);
		drawing.setLong('height', height);
		drawing.setDouble('rotation', rotation);
		drawing.setLayer('layer', Client.getState().getLayer());
		
		drawing.setString('shape', shape);
		drawing.setColor('color', color);
		
		return drawing;
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
            this.updateCurrentDrawing(e.xm, e.ym, e.ctrlKey, e.shiftKey);
            if(this.currentDrawing != null) {
                EntityManagers.get('drawing').add(this.currentDrawing);
                this.currentDrawing = null;
            }
        }
    }
    
    mouseDragged(e) {
		// update current Drawing
		this.updateCurrentDrawing(e.xm, e.ym, e.ctrlKey, e.shiftKey);
    }
    
    updateCurrentDrawing(xCurrent, yCurrent, forceSquare, modified) {
        if(this.currentDrawing != null) {
            var xDiff = xCurrent - this.xStart;
            var yDiff = yCurrent - this.yStart;
            var x, y, width, height;
            
            switch(this.action) {
            case 'DRAW_RECT':
                if(forceSquare) {
                    if(Math.abs(xDiff) > Math.abs(yDiff)) yCurrent = Math.trunc(this.yStart + Math.sign(yDiff) * Math.abs(xDiff));
                    else xCurrent = Math.trunc(this.xStart + Math.sign(xDiff) * Math.abs(yDiff));
                    
                    xDiff = xCurrent - this.xStart;
                    yDiff = yCurrent - this.yStart;
                }
                x = (this.xStart + xCurrent) / 2;
				y = (this.yStart + yCurrent) / 2;
				width = Math.abs(xDiff);
				height = Math.abs(yDiff);
				this.currentDrawing.setString('shape', modified ? 'rectOutline' : 'rect');
                break;
            case 'DRAW_OVAL':
                xDiff = Math.abs(xDiff);
				yDiff = Math.abs(yDiff);
				if(forceSquare) {
					xDiff = yDiff = Math.max(xDiff, yDiff);
				}
				x = this.xStart;
				y = this.yStart;
				width = xDiff*2;
				height = yDiff*2;
				this.currentDrawing.setString('shape', modified ? 'ovalOutline' : 'oval');
                break;
            default:
                return;
            }
            
			this.currentDrawing.setLong('x', x);
			this.currentDrawing.setLong('y', y);
			this.currentDrawing.setLong('width', width);
			this.currentDrawing.setLong('height', height);
        }
    }
    
    static deleteAllDrawings() {
        new CanvasWindowConfirm(null, 'Delete Drawings', 'Delete all (accessible) drawings on the current layer?', () => {
            const drawings = MapUtils.currentEntitiesInLayer('drawing', Client.getState().getLayer()).filter(drawing => drawing.canEdit(ServerData.localProfile));
            for(const drawing of drawings) {
                EntityManagers.get('drawing').remove(drawing.id);
            }
        });
    }
}

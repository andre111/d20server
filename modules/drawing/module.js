ModuleManager.registerModule({
    onEvent: function(type, event) {
        switch(type) {
        case "addModeButtons":
            event.addButton(new ExtendedModeButton(new ModeButton("brush", "Draw Shapes", () => (StateMain.mode instanceof CanvasModeDrawings || (StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "drawing")), () => event.panel.setMode(new CanvasModeDrawings(event.panel.currentLayer, "DRAW_RECT"))), 0, [
                    new ModeButton("cursor", "Edit Drawings", () => StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "drawing", () => event.panel.setMode(new CanvasModeEntities("drawing", event.panel.currentLayer))),
                    new ModeButton("rect", "Draw Rectangles", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "DRAW_RECT", () => event.panel.setMode(new CanvasModeDrawings(event.panel.currentLayer, "DRAW_RECT"))),
                    new ModeButton("oval", "Draw Ovals", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "DRAW_OVAL", () => event.panel.setMode(new CanvasModeDrawings(event.panel.currentLayer, "DRAW_OVAL"))),
                    new ModeButton("text", "Write Text", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "WRITE_TEXT", () => event.panel.setMode(new CanvasModeDrawings(event.panel.currentLayer, "WRITE_TEXT"))),
                    new ModeButton("trash", "Delete Drawings", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "DELETE", () => event.panel.setMode(new CanvasModeDrawings(event.panel.currentLayer, "DELETE"))),
                    new ModeButton("trashAll", "Delete All Drawings", () => false, () => { event.panel.setMode(new CanvasModeDrawings(event.panel.currentLayer, "DELETE")); StateMain.mode.deleteAllDrawings(); event.panel.updateState(); }),
                    new ModeButton("x_empty", "Select Color", (mb) => { mb.button.style.backgroundColor = CanvasModeDrawingsGlobals.color; return false; }, () => { 
                        new CanvasWindowColorInput("Select Drawing Color", CanvasModeDrawingsGlobals.color, color => { 
                            if(color != null && color != undefined) { 
                                CanvasModeDrawingsGlobals.color = color; event.panel.updateState(); 
                            }
                        }) 
                    })
                ])
            );
            break;
        case "addRenderLayers":
            event.addRenderLayer(new CanvasRenderLayerDrawings(-900, Layer.BACKGROUND));
            event.addRenderLayer(new CanvasRenderLayerDrawings(1100, Layer.MAIN));
            event.addRenderLayer(new CanvasRenderLayerDrawings(2100, Layer.GMOVERLAY, 0.5, true));
            break;
        case "addEntityRenderers":
            event.addEntityRenderer("drawing", new CanvasEntityRendererDrawing());
            break;
        case "updateModeState":
            var allowDrawing = false;
            var map = MapUtils.currentMap();
            if(map != null && map != undefined && (ServerData.isGM() || map.prop("playersCanDraw").getBoolean())) allowDrawing = true;
            if(!allowDrawing && (StateMain.mode instanceof CanvasModeDrawings || (StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "drawing"))) {
                StateMain.mode = new CanvasModeEntities("token", event.panel.currentLayer);
            }
            break;
        default:
            break;
        }
    }
});

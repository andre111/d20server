class ModeButton {
    constructor(iconName, tooltip, activeCheck, action) {
        this.iconName = iconName;
        this.tooltip = tooltip;
        this.activeCheck = activeCheck;
        this.action = action;
        
        // init html elements
        this.button = document.createElement("button");
        this.button.className = "mode-button";
        this.button.title = tooltip;
        this.button.onclick = action;
        this.icon = document.createElement("img");
        this.button.appendChild(this.icon);
    }
    
    shrink() {
        this.button.className = "mode-sub-button"
    }
    
    updateState() {
        if(this.activeCheck(this)) {
            this.icon.src = "/public/img/gui/"+this.iconName+"Active.png";
            return true;
        } else {
            this.icon.src = "/public/img/gui/"+this.iconName+".png";
            return false;
        }
    }
}

class ExtendedModeButton {
    constructor(mainButton, margin, subButtons) {
        this.mainButton = mainButton;
        this.subButtons = subButtons;
        
        // init html elements
        this.container = document.createElement("div");
        this.container.appendChild(this.mainButton.button);
        if(margin > 0) {
            this.mainButton.button.style.marginTop = margin+"px";
        }
        if(this.subButtons != null && this.subButtons != undefined) {
            var p = document.createElement("p");
            p.className = "mode-sub-panel";
            this.container.appendChild(p);
            
            for(var subButton of this.subButtons) {
                subButton.shrink();
                p.appendChild(subButton.button);
            }
        }
    }
    
    updateState() {
        var active = this.mainButton.updateState();
        if(this.subButtons != null && this.subButtons != undefined) {
            for(var subButton of this.subButtons) {
                subButton.updateState();
                subButton.button.style.display = active ? "inline-block" : "none";
            }
        }
    }
}

class ModePanel {
    constructor() {
        this.currentLayer = Layer.MAIN;
        this.showLayerButtons = false;
        
        // create buttons
        this.buttons = [];
        this.buttons.push(new ExtendedModeButton(new ModeButton("cursor", "Edit Tokens", () => false, () => {}), 0)); //TODO: implement
        if(ServerData.isGM()) {
            this.buttons.push(new ExtendedModeButton(new ModeButton("wall", "Edit Walls", () => StateMain.mode instanceof CanvasModeWalls, () => this.setMode(new CanvasModeWalls())), 0));
        }
        
        // drawing mode
        this.buttons.push(new ExtendedModeButton(new ModeButton("brush", "Draw Shapes", () => (StateMain.mode instanceof CanvasModeDrawings /*|| ... */), () => this.setMode(new CanvasModeDrawings(this.currentLayer))), 0, [ //TODO: implement
                new ModeButton("cursor", "Edit Drawings", () => false, () => {}), //TODO: implement
                new ModeButton("rect", "Draw Rectangles", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "DRAW_RECT", () => { this.setMode(new CanvasModeDrawings(this.currentLayer)); StateMain.mode.action = "DRAW_RECT"; this.updateState(); }),
                new ModeButton("oval", "Draw Ovals", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "DRAW_OVAL", () => { this.setMode(new CanvasModeDrawings(this.currentLayer)); StateMain.mode.action = "DRAW_OVAL"; this.updateState(); }),
                new ModeButton("text", "Write Text", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "WRITE_TEXT", () => { this.setMode(new CanvasModeDrawings(this.currentLayer)); StateMain.mode.action = "WRITE_TEXT"; this.updateState(); }),
                new ModeButton("trash", "Delete Drawings", () => StateMain.mode instanceof CanvasModeDrawings && StateMain.mode.action == "DELETE", () => { this.setMode(new CanvasModeDrawings(this.currentLayer)); StateMain.mode.action = "DELETE"; this.updateState(); }),
                new ModeButton("trashAll", "Delete All Drawings", () => false, () => { this.setMode(new CanvasModeDrawings(this.currentLayer)); StateMain.mode.deleteAllDrawings(); this.updateState(); }),
                new ModeButton("x_empty", "Select Color", (mb) => { mb.button.style.backgroundColor = CanvasModeDrawingsGlobals.color; return false; }, () => { 
                    new CanvasWindowColorInput("Select Drawing Color", CanvasModeDrawingsGlobals.color, color => { 
                        if(color != null && color != undefined) { 
                            CanvasModeDrawingsGlobals.color = color; this.updateState(); 
                        }
                    }) 
                })
            ])
        );
        
        if(ServerData.isGM()) {
            // select view
            this.buttons.push(new ExtendedModeButton(new ModeButton("layers", "Select Layer", () => this.showLayerButtons, () => { this.showLayerButtons = !this.showLayerButtons; this.updateState(); }), 0, [
                    new ModeButton("bg", "Background Layer", () => this.currentLayer == Layer.BACKGROUND, () => this.setLayer(Layer.BACKGROUND)),
                    new ModeButton("token", "Token Layer", () => this.currentLayer == Layer.MAIN, () => this.setLayer(Layer.MAIN)),
                    new ModeButton("gm", "GM Overlay Layer", () => this.currentLayer == Layer.GMOVERLAY, () => this.setLayer(Layer.GMOVERLAY))
                ])
            );
            
            // select layer
            this.buttons.push(new ExtendedModeButton(new ModeButton("viewGM", "GM-View", () => !StateMain.view.isPlayerView(), () => this.setView(true)), 8));
            this.buttons.push(new ExtendedModeButton(new ModeButton("viewPlayer", "Player-View", () => StateMain.view.isPlayerView(), () => this.setView(false)), 0)); //TODO: implement
        }
        
        // init html elements
        this.container = document.createElement("div");
        this.container.className = "mode-panel";
        document.body.appendChild(this.container);
        for(var button of this.buttons) {
            this.container.appendChild(button.container);
        }
        this.updateState();
    }
    
    updateState() {
        // check for invalid modes and switch out
        var allowDrawing = false;
        var map = MapUtils.currentMap();
        if(map != null && map != undefined && (ServerData.isGM() || map.prop("playersCanDraw").getBoolean())) allowDrawing = true;
        if(!allowDrawing && StateMain.mode instanceof CanvasModeDrawings) {
            StateMain.mode = new CanvasMode(); //TODO: use CanvasModeEntities here
        }
        
        // update buttons
        for(var button of this.buttons) {
            button.updateState();
        }
    }
    
    setMode(mode) {
        StateMain.mode = mode;
        mode.init();
        this.updateState();
    }
    
    setLayer(layer) {
        this.currentLayer = layer;
        this.showLayerButtons = false;
        StateMain.mode.setLayer(layer);
        this.updateState();
    }
    
    setView(asGM) {
        if(asGM) {
            StateMain.view = new CanvasView(ServerData.localProfile, false, false, false, true);
        } else {
            //TODO: implement player selector and replace below test code
            StateMain.view = new CanvasView(ServerData.localProfile, true, true, true, false);
        }
        this.updateState();
    }
}

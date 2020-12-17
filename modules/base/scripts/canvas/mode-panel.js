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
        var event = {
            panel: this,
            addButton: button => { 
                if(!(button instanceof ExtendedModeButton)) throw "Invalid parameters, can only add ExtendedModeButton objects!";
                this.buttons.push(button); 
            }
        };
        Events.trigger("addModeButtons", event);
        
        // add core buttons
        if(ServerData.isGM()) {
            // select layer
            this.buttons.push(new ExtendedModeButton(new ModeButton("layers", "Select Layer", () => this.showLayerButtons, () => { this.showLayerButtons = !this.showLayerButtons; this.updateState(); }), 0, [
                    new ModeButton("bg", "Background Layer", () => this.currentLayer == Layer.BACKGROUND, () => this.setLayer(Layer.BACKGROUND)),
                    new ModeButton("token", "Token Layer", () => this.currentLayer == Layer.MAIN, () => this.setLayer(Layer.MAIN)),
                    new ModeButton("gm", "GM Overlay Layer", () => this.currentLayer == Layer.GMOVERLAY, () => this.setLayer(Layer.GMOVERLAY))
                ])
            );
            
            // select view
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
        
        // add callback
        ServerData.currentMap.addObserver(() => this.updateState());
    }
    
    updateState() {
        // check for invalid modes and switch out
        var event = {
            panel: this
        };
        Events.trigger("updateModeState", event);
        
        // update buttons
        for(var button of this.buttons) {
            button.updateState();
        }
    }
    
    setMode(mode) {
        if(StateMain.mode) StateMain.mode.exit();
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
            this.updateState();
        } else {
            new CanvasWindowChoose("profile", null, id => {
                if(id > 0) {
                    StateMain.view = new CanvasView(ServerData.profiles.get().get(id), true, true, true, false);
                    FOWRenderer.reset();
                    this.updateState();
                }
            });
        }
    }
}

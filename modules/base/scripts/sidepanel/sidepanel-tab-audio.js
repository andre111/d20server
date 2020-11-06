class MusicPlayer {
    constructor(parent) {
        this.audio = document.createElement("audio");
        this.audio.controls = true;
        this.audio.loop = true;
        parent.appendChild(this.audio);
        
        this.currentID = -1;
        this.lastUpdate = -1;
        
        // handle updating other clients
        Events.on("frameEnd", () => this.updateState());
        this.audio.onpause = () => {
            if(ServerData.isGM()) {
                var msg = {
                    msg: "ActionCommand",
                    command: "PAUSE_MUSIC"
                };
                MessageService.send(msg);
            }
        };
        this.audio.onplay = () => {
            if(ServerData.isGM()) {
                var msg = {
                    msg: "ActionCommand",
                    command: "PLAY_MUSIC",
                    id: this.currentID,
                    x: -1
                };
                MessageService.send(msg);
            }
        };
        
        // listen to commands
        Events.on("actionCommand", evt => {
            if(!evt.gm) return; // only accept commands from gm
            
            switch(evt.command) {
            case "LOAD_MUSIC":
                this.serverDoLoad(evt.id);
                break;
            case "PLAY_MUSIC":
                this.serverDoPlay(evt.id, evt.x);
                break;
            case "PAUSE_MUSIC":
                this.serverDoPause();
                break;
            case "STOP_MUSIC":
                this.serverDoStop();
                break;
            }
        });
    }
    
    load(id) {
        var msg = {
            msg: "ActionCommand",
            command: "STOP_MUSIC"
        };
        MessageService.send(msg);
        msg = {
            msg: "ActionCommand",
            command: "LOAD_MUSIC",
            id: id
        };
        MessageService.send(msg);
    }
    
    updateState() {
        // calculate time
        var now = Date.now();
        var elapsed = now - this.lastUpdate;
        
        // update when at correct time
        if(elapsed > 1000) {
            this.lastUpdate = now - (elapsed % 1000);
            
            if(ServerData.isGM()) {
                if(!this.audio.paused) {
                    var time = Math.trunc(this.audio.currentTime * 44100);
                    var msg = {
                        msg: "ActionCommand",
                        command: "PLAY_MUSIC",
                        id: this.currentID,
                        x: time
                    };
                    MessageService.send(msg);
                }
            }
        }
    }
    
    serverDoLoad(id) {
        if(this.currentID == id) return;
        this.currentID = id;
        this.audio.src = "/audio/"+id;
    }
    
    serverDoPlay(id, time) {
        this.serverDoLoad(id);
        if(this.audio.paused) this.audio.play();
        
        if(time < 0) return;
        var targetTime = time / 44100;
        if(Math.abs(this.audio.currentTime - targetTime) > 1) {
            this.audio.currentTime = targetTime;
        }
    }
    
    serverDoPause() {
        this.audio.pause();
    }
    
    serverDoStop() {
        this.audio.pause();
    }
}

class SidepanelTabAudio extends SidepanelTab {
    constructor() {
        super("Audio", "audio", ServerData.isGM());
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content max-content max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-audio", ValueProviders.get("audio"));
        EntityManagers.get("audio").addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "Apply to Token", () => this.doApplyToToken());
        GuiUtils.createButton(buttonPanel1, "Load in Player", () => this.doLoadInPlayer());
        
        var buttonPanel2 = document.createElement("div");
        this.tab.appendChild(buttonPanel2);
        GuiUtils.createButton(buttonPanel2, "Rename", () => this.doRename());
        GuiUtils.createButton(buttonPanel2, "Upload Audio", () => this.doUploadAudio());
        GuiUtils.createButton(buttonPanel2, "Remove Audio", () => this.doRemoveAudio());
        
        // create player
        var playerPanel = document.createElement("div");
        GuiUtils.makeBordered(playerPanel, "Music Player");
        this.tab.appendChild(playerPanel);
        this.musicPlayer = new MusicPlayer(playerPanel);
    }
    
    doApplyToToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            if(StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "token") {
                if(StateMain.mode.activeEntities.length == 1) {
                    var reference = StateMain.mode.activeEntities[0];
                    reference.prop("audioID").setLong(id);
                    reference.performUpdate();
                }
            }
        }
    }
    
    doLoadInPlayer() {
        var id = this.tree.getSelectedValue();
        if(id) {
            this.musicPlayer.load(id);
        }
    }
    
    doRename() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var reference = EntityReference.create(EntityManagers.get("audio").find(id));
            
            new CanvasWindowInput("Rename Audio", "Enter Audio Name:", reference.getName(), name => {
                if(name) {
                    reference.prop("name").setString(name);
                    reference.performUpdate();
                }
            });
        }
    }
    
    doUploadAudio() {
        new CanvasWindowUpload("Upload Audio", "audio/ogg", "/upload/audio");
    }
    
    doRemoveAudio() {
        var id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm("Confirm removal", "Are you sure you want to remove the audio: "+EntityManagers.get("audio").find(id).getName()+"?", () => {
                EntityManagers.get("audio").remove(id);
            });
        }
    }
}

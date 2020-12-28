StateSignIn = {
    playerList: null,
    accessKeyField: null,
    observer: null,
    
    init: function() {
        // create signin div
        var div = document.createElement("div");
        div.id = "signin";
        div.className = "full-overlay fancy-bg";
        document.body.appendChild(div);
        
        // create signin elements
        var fieldset = GuiUtils.createBorderedSet("Login", "400px", "auto");
        div.appendChild(fieldset);
        
        StateSignIn.playerList = document.createElement("select");
        StateSignIn.playerList.id = "signin-playerlist"
        StateSignIn.playerList.className = "login-field";
        fieldset.appendChild(StateSignIn.playerList);
        var labelElement = document.createElement("label");
        labelElement.htmlFor = "signin-playerlist";
        labelElement.innerHTML = "Player";
        fieldset.appendChild(labelElement);
        fieldset.appendChild(document.createElement("br"));
        
        StateSignIn.accessKeyField = GuiUtils.createInput(fieldset, "password", "Access-Key");
        StateSignIn.accessKeyField.className = "login-field";
        fieldset.appendChild(document.createElement("br"));
        
        var b = document.createElement("button");
        b.innerHTML = "Sign In";
        b.className = "login-field";
        b.onclick = StateSignIn.doSignIn;
        fieldset.appendChild(b);
        
        // add player list observer
        StateSignIn.observer = () => StateSignIn.onPlayerList();
        ServerData.profiles.addObserver(StateSignIn.observer);
        
        // send player list request
        var msg = {
            msg: "RequestAccounts"
        };
        MessageService.send(msg);
    },
    
    exit: function() {
        ServerData.profiles.removeObserver(StateSignIn.observer);
        
        var div = document.getElementById("signin");
        div.parentElement.removeChild(div);
    },
    
    onPlayerList: function() {
        StateSignIn.playerList.innerHTML = null;
        for(const [key, profile] of ServerData.profiles.get().entries()) {
            var opt = document.createElement("option");
            opt.innerHTML = profile.username;
            if(profile.connected) opt.disabled = true;
            StateSignIn.playerList.appendChild(opt);
        }
    },
    
    doSignIn: function() {
        var msg = {
            msg: "SignIn",
            appVersion: _g.VERSION,
            username: StateSignIn.playerList.value,
            password: StateSignIn.accessKeyField.value
        };
        MessageService.send(msg);
    }
}

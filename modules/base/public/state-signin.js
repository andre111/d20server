StateSignIn = {
    emailField: null,
    accessKeyField: null,
    
    init: function() {
        // create signin div
        var div = document.createElement("div");
        div.id = "signin";
        div.className = "full-overlay";
        document.body.appendChild(div);
        
        // create signin elements
        var fieldset = GuiUtils.createBorderedSet("Login", "400px");
        
        emailField = GuiUtils.createInput(fieldset, "text", "E-Mail");
        fieldset.appendChild(document.createElement("br"));
        accessKeyField = GuiUtils.createInput(fieldset, "password", "Access-Key");
        fieldset.appendChild(document.createElement("br"));
        
        var b = document.createElement("button");
        b.innerHTML = "Sign In";
        b.onclick = StateSignIn.doSignIn;
        fieldset.appendChild(b);
        
        div.appendChild(fieldset);
    },
    
    exit: function() {
        var div = document.getElementById("signin");
        div.parentElement.removeChild(div);
    },
    
    doSignIn: function() {
        var msg = {
            msg: "SignIn",
            appVersion: _g.VERSION,
            email: emailField.value,
            password: accessKeyField.value
        };
        MessageService.send(msg);
    }
}

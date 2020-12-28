StateLoading = {
    init: function() {
        // create loading div
        var div = document.createElement("div");
        div.id = "loading";
        div.className = "full-overlay fancy-bg";
        document.body.appendChild(div);
        
        // create loading bar
        var fieldset = GuiUtils.createBorderedSet("Loading", "400px", "auto");
        div.appendChild(fieldset);
        
        StateLoading.progressBar = document.createElement("div");
        fieldset.appendChild(StateLoading.progressBar);
        
        var labelContainer = document.createElement("div");
        labelContainer.style.display = "inline-flex";
        labelContainer.style.justifyContent = "center";
        labelContainer.style.alignItems = "center";
        labelContainer.style.position = "absolute";
        labelContainer.style.top = "0";
        labelContainer.style.left = "0";
        labelContainer.style.width = "100%";
        labelContainer.style.height = "100%";
        StateLoading.progressBar.appendChild(labelContainer);
        
        StateLoading.progressLabel = document.createElement("div");
        labelContainer.appendChild(StateLoading.progressLabel);
        
        StateLoading.amount = 1;
        StateLoading.current = 0;
        $(StateLoading.progressBar).progressbar({
            value: 0,
            change: function() {
                StateLoading.progressLabel.innerHTML = Math.round($(StateLoading.progressBar).progressbar("value"))+"%";
            }
        })
    },
    
    increase() {
        StateLoading.current++;
        $(StateLoading.progressBar).progressbar("value", StateLoading.current / StateLoading.amount * 100);
    },
    
    exit: function() {
        var div = document.getElementById("loading");
        div.parentElement.removeChild(div);
    }
}

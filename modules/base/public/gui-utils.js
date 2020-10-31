GuiUtils = {
    _nextID: 0,
    
    createInput: function(container, type, label) {
        var id = "i"+(GuiUtils._nextID++);
        
        var inputElement = document.createElement("input");
        inputElement.id = id;
        inputElement.type = type;
        container.appendChild(inputElement);
        
        var labelElement = document.createElement("label");
        labelElement.htmlFor = id;
        labelElement.innerHTML = label;
        container.appendChild(labelElement);
        
        return inputElement;
    },
    
    createBorderedSet: function(label, fixedWidth, fixedHeight) {
        var fieldset = document.createElement("fieldset");
        if(fixedWidth) {
            fieldset.style.width = fixedWidth;
        }
        if(fixedHeight) {
            fieldset.style.height = fixedHeight;
        }
        
        var legend = document.createElement("legend");
        legend.innerHTML = label;
        fieldset.appendChild(legend);
        
        return fieldset;
    }
}

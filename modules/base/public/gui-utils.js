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
    
    createBorderedSet: function(label, fixedWidth) {
        var fieldset = document.createElement("fieldset");
        if(fixedWidth) {
            fieldset.style.width = fixedWidth;
        }
        
        var legend = document.createElement("legend");
        legend.innerHTML = label;
        fieldset.appendChild(legend);
        
        return fieldset;
    }
}

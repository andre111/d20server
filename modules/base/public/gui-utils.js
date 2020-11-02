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
    
    createButton: function(container, text, onclick) {
        var button = document.createElement("button");
        button.innerHTML = text;
        button.onclick = onclick;
        container.appendChild(button);
        return button;
    },
    
    //TODO: do not use? fieldsets seem to be annoying to layout
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
    },
    
    makeBordered: function(container, label) {
        container.className += " bordered";
        var h1 = document.createElement("h1");
        h1.className = "border-title";
        h1.innerHTML = label ? label : "?";
        container.appendChild(h1);
    },
    
    // makes children elements hoverable (requires "hoverable" class and a child with "onhover" class)
    makeHoverable: function(element) {
        $(element).find(".hoverable").hover(function(e) {
            var onhover = $(this).find(".onhover");
            var width = onhover.width();
            var height = onhover.height();
            var x = e.clientX - width/2;
            var y = e.clientY;
            
            if(x+width > window.innerWidth) x = window.innerWidth - width;
            if(y+height > window.innerHeight) y = window.innerHeight - height;
            
            onhover.css("left", x+"px");
            onhover.css("top", y+"px");
        });
    }
}

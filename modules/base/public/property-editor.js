//TODO: implement all the different property editors
function createPropertyEditor(tab, type, name, label) {
    return new PropertyEditor(name);
}

class PropertyEditor {
    constructor(name) {
        this.name = name;
        this.forceDisable = false;
        this.reloading = false;
        this.changeListeners = [];
        
        this.container = document.createElement("div");
        this.container.className = "property-editor";
        this.editComponent = this.initContent();
        
        //TODO: remove test stuff
        if(this.editComponent == null || this.editComponent == undefined) {
            this.editComponent = document.createElement("input");
            var label = document.createElement("label");
            label.innerHTML = "{"+name+"}";
            this.container.appendChild(label);
        }
    }
    
    getContainer() {
        return this.container;
    }
    
    getEditComponent() {
        return this.editComponent;
    }
    
    setForceDisable(forceDisable) {
        this.forceDisable = forceDisable;
    }
    
    addChangeListener(listener) {
        this.changeListeners.push(listener);
    }
    
    //TODO: call onChange on changes, duh
    onChange() {
        if(this.reloading) return;
        
        for(var listener of this.changeListeners) {
            listener();
        }
    }
    
    reload(reference, accessLevel) {
        // determine property
        var property = reference.prop(this.name);
        if(property == null || property == undefined) {
            this.container.style.visibility = "hidden";
            return;
        }
        
        // update state
        this.editComponent.style.visibility = property.canView(accessLevel) ? "visible" : "hidden";
        this.editComponent.disabled = !property.canEdit(accessLevel) || this.forceDisable;
        
        // update value
        this.reloading = true;
        this.reloadValue(property);
        this.reloading = false;
    }
    
    apply(reference, accessLevel) {
        // determine property
        var property = reference.prop(this.name);
        if(property == null || property == undefined) return;
        if(!property.canEdit(accessLevel)) return;
        if(this.editComponent.disabled) return;
        if(this.forceDisable) return;
        
        // apply value
        this.applyValue(property);
    }
    
    initContent() {};
    reloadValue(property) {}
    applyValue(property) {}
}

//TODO: NORMAL EDITORS
//-----------------------------------------------------------------------------------

//TODO: SPECIAL CASE EDITORS
//-----------------------------------------------------------------------------------
class MultiLineStringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name);
    }
    
    //TODO...
}

class EntityReferencePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType) {
        super(name);
    }
    
    //TODO...
}

class ImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name);
    }
    
    //TODO...
}

class ReferencedImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, referenceProperty) {
        super(name);
    }
    
    //TODO...
}

class StringSelectionPropertyEditor extends PropertyEditor {
    constructor(tab, name, label, values) {
        super(name);
    }
    
    //TODO...
}

class LongListPropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, allowDuplicates) {
        super(name);
    }
    
    //TODO...
    //TODO: Also move the code that is in EditEntityTab in the old client to in here (namely ValueProvider creation, open button and special renders)
}

class PropertyAccessEditor extends PropertyEditor {
    constructor(tab, names, label) {
        super("");
    }
    
    initContent() {
        //TODO...
    }
    
    reload(reference, accessLevel) {
        //TODO...
    }
    
    apply(reference, accessLevel) {
        //TODO...
    }
}

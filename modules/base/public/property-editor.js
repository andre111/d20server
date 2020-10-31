//TODO: implement all the different property editors (missing: STRING_MAP + EntityReference, Image, LongList)
//TODO: some stuff (especially the ones using fieldsets -> MultiLineString, ReferencedImage, ...) might need some layouting work
function createPropertyEditor(tab, type, name, label) {
    switch(type) {
    case Type.STRING:
        return new StringPropertyEditor(tab, name, label);
    case Type.LONG:
        return new LongPropertyEditor(tab, name, label);
    case Type.BOOLEAN:
        return new BooleanPropertyEditor(tab, name, label);
    case Type.DOUBLE:
        return new DoublePropertyEditor(tab, name, label);
    case Type.STRING_MAP:
        return new StringMapPropertyEditor(tab, name, label);
    case Type.LAYER:
        return new LayerPropertyEditor(tab, name, label);
    case Type.LIGHT:
        return new LightPropertyEditor(tab, name, label);
    case Type.EFFECT:
        return new EffectPropertyEditor(tab, name, label);
    case Type.COLOR:
        return new ColorPropertyEditor(tab, name, label);
    case Type.ACCESS:
        return new AccessPropertyEditor(tab, name, label);
    default:
        throw "No PropertyEditor Implementation for type: "+type;
    }
}

class PropertyEditor {
    constructor(name, type, label) {
        this.name = name;
        this.forceDisable = false;
        this.reloading = false;
        this.changeListeners = [];
        
        this.container = document.createElement("div");
        this.editComponent = this.initContent(label);
        
        //TODO: remove test stuff
        if(this.editComponent == null || this.editComponent == undefined) {
            this.editComponent = document.createElement("input");
            var label = document.createElement("label");
            label.innerHTML = "{"+name+"}";
            this.container.appendChild(label);
        }
        
        this.editComponent.classList.add("property-editor");
        this.editComponent.title = "Property: "+name+" - Type: "+type;
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
        this.container.style.visibility = property.canView(accessLevel) ? "visible" : "hidden";
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
    
    addLabel(text, fixedWidth) {
        if(text == null || text == undefined || text == "") return;
        
        //TODO: this seems like it could be done a bit neater
        var label = document.createElement("label");
        label.innerHTML = text;
        label.style.display = "inline-block";
        if(fixedWidth) label.style.width = fixedWidth;
        this.container.appendChild(label);
    }
    
    initContent(label) {};
    reloadValue(property) {}
    applyValue(property) {}
}

//TODO: NORMAL EDITORS
//-----------------------------------------------------------------------------------
class StringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        this.textField = document.createElement("input");
        this.textField.type = "text";
        this.container.appendChild(this.textField);
        this.addLabel(label);
        
        this.textField.onchange = () => this.onChange();
        
        return this.textField;
    }
    
    reloadValue(property) {
        this.textField.value = property.getString();
    }
    
    applyValue(property) {
        property.setString(this.textField.value);
    }
}

class LongPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.LONG, label);
    }
    
    initContent(label) {
        this.spinner = document.createElement("input");
        this.spinner.type = "number";
        this.container.appendChild(this.spinner);
        this.addLabel(label);
        
        this.spinner.onchange = () => this.onChange();
        
        return this.spinner;
    }
    
    reloadValue(property) {
        this.spinner.value = property.getLong();
    }
    
    applyValue(property) {
        var value = this.spinner.valueAsNumber;
        if(value != NaN) property.setLong(Math.trunc(value));
    }
}

class BooleanPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.BOOLEAN, label);
        
        /* override default style size TODO: make this use css aswell */
        this.checkBox.style.width = this.checkBox.style.height = "24px";
    }
    
    initContent(label) {
        this.checkBox = document.createElement("input");
        this.checkBox.type = "checkbox";
        this.checkBox.style.margin = "0";
        this.container.appendChild(this.checkBox);
        this.addLabel(label);
        
        this.checkBox.onchange = () => this.onChange();
        
        return this.checkBox;
    }
    
    reloadValue(property) {
        this.checkBox.checked = property.getBoolean();
    }
    
    applyValue(property) {
        property.setBoolean(this.checkBox.checked);
    }
}

class DoublePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.DOUBLE, label);
    }
    
    initContent(label) {
        this.spinner = document.createElement("input");
        this.spinner.type = "number";
        this.container.appendChild(this.spinner);
        this.addLabel(label);
        
        this.spinner.onchange = () => this.onChange();
        
        return this.spinner;
    }
    
    reloadValue(property) {
        this.spinner.value = property.getDouble();
    }
    
    applyValue(property) {
        var value = this.spinner.valueAsNumber;
        if(value != NaN) property.setDouble(value);
    }
}

class StringMapPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING_MAP, label);
    }
    
    //TODO...
}

class LayerPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.LAYER, label);
    }
    
    initContent(label) {
        this.select = document.createElement("select");
        var values = [ Layer.BACKGROUND, Layer.MAIN, Layer.GMOVERLAY ];
        for(var value of values) {
            var option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getLayer();
    }
    
    applyValue(property) {
        property.setLayer(this.select.value);
    }
}

class LightPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.LIGHT, label);
    }
    
    initContent(label) {
        this.select = document.createElement("select");
        var values = [ Light.DARK, Light.DIM, Light.BRIGHT ];
        for(var value of values) {
            var option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getLight();
    }
    
    applyValue(property) {
        property.setLight(this.select.value);
    }
}

class EffectPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.EFFECT, label);
    }
    
    initContent(label) {
        this.select = document.createElement("select");
        var values = [ Effect.NONE, Effect.FOG, Effect.RAIN_LIGHT, Effect.RAIN_HEAVY, Effect.RAIN_STORM, Effect.SNOW ];
        for(var value of values) {
            var option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getEffect();
    }
    
    applyValue(property) {
        property.setEffect(this.select.value);
    }
}

class ColorPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.COLOR, label);
    }
    
    initContent(label) {
        this.input = document.createElement("input");
        this.input.type = "color";
        this.container.appendChild(this.input);
        this.addLabel(label);
        
        this.input.onchange = () => this.onChange();
        
        return this.input;
    }
    
    reloadValue(property) {
        this.input.value = property.getColor();
    }
    
    applyValue(property) {
        property.setColor(this.input.value);
    }
}

class AccessPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.ACCESS, label);
    }
    
    initContent(label) {
        this.select = document.createElement("select");
        var values = [ Access.EVERYONE, Access.CONTROLLING_PLAYER, Access.GM ];
        for(var value of values) {
            var option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getAccessValue();
    }
    
    applyValue(property) {
        property.setAccessValue(this.select.value);
    }
}


//TODO: SPECIAL CASE EDITORS
//-----------------------------------------------------------------------------------
class MultiLineStringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        //TODO: this might need some wrangling to get to behave how I would like it to (fill available space, including textArea)
        var set = GuiUtils.createBorderedSet(label);
        this.container.appendChild(set);
        
        this.textArea = document.createElement("textarea");
        set.appendChild(this.textArea);
        //this.container.appendChild(this.textArea);
        
        this.textArea.onchange = () => this.onChange();
        
        //return this.textArea;
        return set;
    }
    
    reloadValue(property) {
        this.textArea.value = property.getString();
    }
    
    applyValue(property) {
        property.setString(this.textArea.value);
    }
}

class EntityReferencePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType) {
        super(name, Type.LONG, label);
    }
    
    //TODO...
}

class ImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.LONG, label);
    }
    
    //TODO...
}

class ReferencedImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, referenceProperty) {
        super(name, Type.LONG, label);
        
        this.referenceType = referenceType;
        this.referenceProperty = referenceProperty;
    }
    
    initContent(label) {
        //TODO: this might need some wrangling to get to behave how I would like it to (fill available space, including textArea)
        this.set = GuiUtils.createBorderedSet(label);
        this.container.appendChild(this.set);
        
        this.image = document.createElement("image");
        this.set.appendChild(this.image);
        
        return this.set;
    }
    
    reloadValue(property) {
        var imageID = 0;
        var referencedEntity = EntityManagers.get(this.referenceType).find(property.getLong());
        if(referencedEntity != null && referencedEntity != undefined) {
            imageID = referencedEntity.prop(this.referenceProperty).getLong();
        }
        
        // replace image (just changing the src is not enough)
        this.set.removeChild(this.image);
        this.image = new Image();
        this.image.src = "/image/"+imageID;
        this.image.style.width = "100%";
        this.image.style.height = "100%";
        this.image.style.objectFit = "contain";
        this.set.appendChild(this.image);
    }
    
    applyValue(property) {
    }
}

class StringSelectionPropertyEditor extends PropertyEditor {
    constructor(tab, name, label, values) {
        super(name, Type.STRING, label);
        
        // load values
        for(const [key, value] of Object.entries(values)) {
            var option = document.createElement("option");
            option.value = key;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
    }
    
    initContent(label) {
        this.select = document.createElement("select");
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onChange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getString();
    }
    
    applyValue(property) {
        property.setString(this.select.value);
    }
}

class LongListPropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, allowDuplicates) {
        super(name, Type.LONG_LIST, label);
    }
    
    //TODO...
    //TODO: Also move the code that is in EditEntityTab in the old client to in here (namely ValueProvider creation, open button and special renders)
}

class PropertyAccessEditor extends PropertyEditor {
    constructor(tab, names, label) {
        super("", Type.ACCESS, label);
        
        this.propertyNames = names;
    }
    
    initContent(label) {
        this.addLabel(label, "200px");
        
        /*var content = document.createElement("div");
        content.style.float = "right";
        this.container.appendChild(content);
        var oldContainer = this.container;
        this.container = content;*/
        
        this.addLabel("  View: ");
        this.viewSelect = document.createElement("select");
        this.viewSelect.style.display = "inline-block";
        var values = [ Access.EVERYONE, Access.CONTROLLING_PLAYER, Access.GM ];
        for(var value of values) {
            var option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            this.viewSelect.appendChild(option);
        }
        this.container.appendChild(this.viewSelect);
        
        this.addLabel("  Edit: ");
        this.editSelect = document.createElement("select");
        this.editSelect.style.display = "inline-block";
        var values = [ Access.EVERYONE, Access.CONTROLLING_PLAYER, Access.GM ];
        for(var value of values) {
            var option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            this.editSelect.appendChild(option);
        }
        this.container.appendChild(this.editSelect);
        
        //this.container = oldContainer;
        
        return document.createElement("div");
    }
    
    reload(reference, accessLevel) {
        // allow GM only
		this.viewSelect.disabled = accessLevel != Access.GM;
		this.editSelect.disabled = accessLevel != Access.GM;
        
        // update value (select highest access from all properties)
        var viewAccess = Access.EVERYONE;
        var editAccess = Access.EVERYONE;
        for(var propertyName of this.propertyNames) {
            var property = reference.prop(propertyName);
            if(property != null && property != undefined) {
                if(!Access.matches(property.getViewAccess(), viewAccess)) viewAccess = property.getViewAccess();
                if(!Access.matches(property.getEditAccess(), editAccess)) editAccess = property.getEditAccess();
            }
        }
        
        this.viewSelect.value = viewAccess;
        this.editSelect.value = editAccess;
    }
    
    apply(reference, accessLevel) {
		// allow GM only
		if(accessLevel != Access.GM) return;
        
		// apply value
        for(var propertyName of this.propertyNames) {
            var property = reference.prop(propertyName);
            if(property != null && property != undefined) {
                property.setViewAccess(this.viewSelect.value);
                property.setEditAccess(this.editSelect.value);
            }
        }
    }
}

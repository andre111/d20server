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
        
        this.valueMap = {};
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        this.container.style.overflow = "auto";
        
        this.list = document.createElement("select");
        this.list.size = 8;
        this.list.style.width = "calc(100% - 10px)";
        this.container.appendChild(this.list);
        
        var buttonPanel = document.createElement("div");
        this.addEntry = document.createElement("button");
        this.addEntry.innerHTML = "Add";
        this.addEntry.onclick = () => this.doAdd();
        buttonPanel.appendChild(this.addEntry);
        this.renameEntry = document.createElement("button");
        this.renameEntry.innerHTML = "Rename";
        this.renameEntry.onclick = () => this.doRename();
        buttonPanel.appendChild(this.renameEntry);
        this.removeEntry = document.createElement("button");
        this.removeEntry.innerHTML = "Remove";
        this.removeEntry.onclick = () => this.doRemove();
        buttonPanel.appendChild(this.removeEntry);
        this.container.appendChild(buttonPanel);
        
        this.editor = document.createElement("textarea");
        this.editor.style.width = "calc(100% - 10px)";
        this.editor.style.height = "250px";
        this.editor.style.overflow = "auto";
        this.editor.style.resize = "none";
        this.container.appendChild(this.editor);
        
        // functionality
        this.list.onchange = () => {
            if(this.list.selectedIndex >= 0) {
                this.editor.value = this.valueMap[this.list.value];
                this.editor.disabled = false;
            } else {
                this.editor.value = "";
                this.editor.disabled = true;
            }
        };
        this.editor.onkeyup = () => {
            if(this.list.selectedIndex >= 0) {
                this.valueMap[this.list.value] = this.editor.value;
                this.onChange();
            }
        };
        
        return this.editor;
    }
    
    reload(reference, accessLevel) {
        super.reload(reference, accessLevel);
        
        // determine property
		var property = reference.prop(this.name);
		if(property == null) return;

		// update state
		this.list.disabled = !property.canEdit(accessLevel);
		this.editor.disabled = !property.canEdit(accessLevel);
		this.addEntry.disabled = !property.canEdit(accessLevel);
		this.renameEntry.disabled = !property.canEdit(accessLevel);
		this.removeEntry.disabled = !property.canEdit(accessLevel);
    }
    
    reloadValue(property) {
        this.valueMap = property.getStringMap();
        this.reloadFromMap();
    }
    
    applyValue(property) {
        property.setStringMap(this.valueMap);
    }
    
    reloadFromMap() {
        this.list.innerHTML = "";
        for(var key of Object.keys(this.valueMap)) {
            var option = document.createElement("option");
            option.innerHTML = key;
            this.list.appendChild(option);
        }
        this.list.selectedIndex = -1;
        this.editor.value = "";
    }
    
    doAdd() {
        new CanvasWindowInput("Enter Name:", "", "", name => {
            if(name && this.valueMap[name] == undefined) {
                this.valueMap[name] = "";
                this.reloadFromMap();
            }
        });
    }
    
    doRename() {
        if(this.list.selectedIndex >= 0) {
            var oldName = this.list.value;
            new CanvasWindowInput("Enter Name:", "", oldName, name => {
                if(name && this.valueMap[name] == undefined) {
                    var value = this.valueMap[oldName];
                    delete this.valueMap[oldName];
                    this.valueMap[name] = value;
                    this.reloadFromMap();
                }
            });
        }
    }
    
    doRemove() {
        if(this.list.selectedIndex >= 0) {
            delete this.valueMap[this.list.value];
            this.reloadFromMap();
        }
    }
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


// SPECIAL CASE EDITORS
//-----------------------------------------------------------------------------------
class MultiLineStringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.textArea = document.createElement("textarea");
        this.textArea.style.width = "calc(100% - 6px)";
        this.textArea.style.height = "calc(100% - 6px)";
        this.textArea.style.overflow = "auto";
        this.textArea.style.resize = "none";
        this.textArea.style.fontFamily = "monospace";
        this.container.appendChild(this.textArea);
        
        this.textArea.onchange = () => this.onChange();
        
        return this.textArea;
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
        
        this.referenceType = referenceType;
        this.currentEntityID = -1;
    }
    
    initContent(label) {
        this.button = document.createElement("button");
        this.button.onclick = () => this.doSelectEntity();
        this.container.appendChild(this.button);
        return this.button;
    }
    
    reloadValue(property) {
        this.currentEntityID = property.getLong();
        this.updateButtonText();
    }
    
    applyValue(property) {
        property.setLong(this.currentEntityID);
    }
    
    updateButtonText() {
        var entity = EntityManagers.get(this.referenceType).find(this.currentEntityID);
        this.button.innerHTML = (entity != null && entity != undefined) ? entity.getName() : "<none>";
    }
    
    doSelectEntity() {
        new CanvasWindowChoose(this.referenceType, null, id => {
            console.log(id);
            this.currentEntityID = id;
            this.updateButtonText();
        });
    }
}

class ImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.LONG, label);
        
        this.imageID = -1;
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.image = document.createElement("image");
        this.container.onclick = () => this.doEditImage();
        this.container.appendChild(this.image);
        
        this.input = document.createElement("input");
        
        return this.input;
    }
    
    reloadValue(property) {
        this.imageID = property.getLong();
        this.reloadImage();
    }
    
    applyValue(property) {
        property.setLong(this.imageID);
    }
    
    reloadImage() {
        // replace image (just changing the src is not enough)
        if(this.image != null) this.container.removeChild(this.image);
        if(this.imageID > 0) {
            this.image = new Image();
            this.image.src = "/image/"+this.imageID;
            this.image.style.width = "100%";
            this.image.style.height = "100%";
            this.image.style.objectFit = "contain";
            this.container.appendChild(this.image);
        } else {
            this.image = null;
        }
    }
    
    doEditImage() {
        if(!this.input.disabled) {
            new CanvasWindowChoose("image", null, id => {
                this.imageID = id;
                this.reloadImage();
            });
        }
    }
}

class ReferencedImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, referenceProperty) {
        super(name, Type.LONG, label);
        
        this.referenceType = referenceType;
        this.referenceProperty = referenceProperty;
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.image = document.createElement("image");
        this.container.appendChild(this.image);
        
        return this.image;
    }
    
    reloadValue(property) {
        var imageID = 0;
        var referencedEntity = EntityManagers.get(this.referenceType).find(property.getLong());
        if(referencedEntity != null && referencedEntity != undefined) {
            imageID = referencedEntity.prop(this.referenceProperty).getLong();
        }
        
        // replace image (just changing the src is not enough)
        if(this.image != null) this.container.removeChild(this.image);
        if(imageID > 0) {
            this.image = new Image();
            this.image.src = "/image/"+imageID;
            this.image.style.width = "100%";
            this.image.style.height = "100%";
            this.image.style.objectFit = "contain";
            this.container.appendChild(this.image);
        } else {
            this.image = null;
        }
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
        
        this.referenceType = referenceType;
        this.allowDuplicates = allowDuplicates;
        
        this.valueList = [];
        this.valueProvider = ValueProviders.get(this.referenceType);
        
        GuiUtils.makeBordered(this.container, label);
        this.container.style.overflow = "auto";
        
        this.tree = new SearchableIDTree(this.container, null, this.valueProvider);
        if(referenceType != "profile") this.addButton("Open", false, () => this.doOpen());
        this.addButton("Add", false, () => this.doAdd());
        this.addButton("Remove", false, () => this.doRemove());
    }
    
    addButton(text, disableable, callback) {
        var button = document.createElement("button");
        button.innerHTML = text;
        button.onclick = callback;
        this.tree.getSearchPanel().appendChild(button);
    }
    
    initContent(label) {
        return document.createElement("div");
    }
    
    //TODO...
    reload(reference, accessLevel) {
        super.reload(reference, accessLevel);
        
        // determine property
		var property = reference.prop(name);
		if(property == null || property == undefined) return;

		// update state
        //TODO...
    }
    
    reloadValue(property) {
        this.valueList = property.getLongList();
        this.reloadTree();
    }
    
    applyValue(property) {
        property.setLongList(this.valueList);
    }
    
    reloadTree() {
        var entries = new Map();
        for(var i=0; i<this.valueList.length; i++) {
            entries.set(i, this.valueProvider.getValue(this.valueList[i]));
        }
        
        this.tree.reload(entries);
        this.tree.expandAll();
    }
    
    doOpen() {
        var entry = this.tree.getSelectedValue();
        if(entry != null) {
            var entity = EntityManagers.get(this.referenceType).find(this.valueList[entry]);
            if(entity != null && entity != undefined) {
                new CanvasWindowEditEntity(EntityReference.create(entity));
            }
        }
    }
    
    doAdd() {
        new CanvasWindowChoose(this.referenceType, null, id => {
            if(id == null || id <= 0) return;
            
            if(this.allowDuplicates || !this.valueList.includes(id)) {
                this.valueList.push(id);
                this.reloadTree();
            }
        });
    }
    
    doRemove() {
        var entry = this.tree.getSelectedValue();
        if(entry != null) {
            this.valueList.splice(entry, 1);
            this.reloadTree();
        }
    }
}

class PropertyAccessEditor extends PropertyEditor {
    constructor(tab, names, label) {
        super("", Type.ACCESS, label);
        
        this.propertyNames = names;
    }
    
    initContent(label) {
        this.addLabel(label, "200px");
        
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

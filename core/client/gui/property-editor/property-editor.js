export class PropertyEditor {
    constructor(name, type, label) {
        this.name = name;
        this.forceDisable = false;
        this.reloading = false;
        this.changed = false;
        this.changeListeners = [];
        
        this.container = document.createElement('div');
        this.editComponent = this.initContent(label);
        
        if(this.editComponent == null || this.editComponent == undefined) {
            this.editComponent = document.createElement('input');
            var label = document.createElement('label');
            label.innerHTML = '{'+name+'}';
            this.container.appendChild(label);
        }
        
        this.editComponent.classList.add('property-editor');
        this.editComponent.title = 'Property: '+name+' - Type: '+type;
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
        this.changed = true;
        
        for(const listener of this.changeListeners) {
            listener();
        }
    }
    
    reload(reference, accessLevel) {
        // determine property
        if(!reference.has(this.name)) {
            this.container.style.visibility = 'hidden';
            return;
        }
        
        // update state
        this.container.style.visibility = reference.canViewProperty(this.name, accessLevel) ? 'visible' : 'hidden';
        this.editComponent.style.visibility = reference.canViewProperty(this.name, accessLevel) ? 'visible' : 'hidden';
        this.editComponent.disabled = !reference.canEditProperty(this.name, accessLevel) || this.forceDisable;
        
        // update value
        this.reloading = true;
        this.reloadValue(reference, this.name);
        this.reloading = false;
        this.changed = false;
    }
    
    apply(reference, accessLevel) {
        // do nothing if nothing changed -> optimizes response times
        if(!this.changed) return;
        this.changed = false;

        // determine property
        if(!reference.has(this.name)) return;
        if(!reference.canEditProperty(this.name, accessLevel)) return;
        if(this.editComponent.disabled) return;
        if(this.forceDisable) return;
        
        // apply value
        this.applyValue(reference, this.name);
    }
    
    addLabel(text, fixedWidth) {
        if(text == null || text == undefined || text == '') return;
        
        //TODO: this seems like it could be done a bit neater
        const label = document.createElement('label');
        label.innerHTML = text;
        label.style.display = 'inline-block';
        if(fixedWidth) label.style.width = fixedWidth;
        this.container.appendChild(label);
    }
    
    initContent(label) { throw new Error('Cannot call abstract function'); }
    reloadValue(reference, name) { throw new Error('Cannot call abstract function'); }
    applyValue(reference, name) { throw new Error('Cannot call abstract function'); }
    onDestroy() {}
}

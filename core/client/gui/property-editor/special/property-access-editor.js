import { PropertyEditor } from '../property-editor.js';
import { Type, Access } from '../../../../common/constants.js';

export class PropertyAccessEditor extends PropertyEditor {
    constructor(tab, names, label) {
        super('', Type.ACCESS, label);
        
        this.propertyNames = names;
    }
    
    initContent(label) {
        this.addLabel(label, '200px');
        
        const values = [ Access.EVERYONE, Access.CONTROLLING_PLAYER, Access.GM ];

        this.addLabel('  View: ');
        this.viewSelect = document.createElement('select');
        this.viewSelect.style.display = 'inline-block';
        for(const value of values) {
            var option = document.createElement('option');
            option.value = value;
            option.innerHTML = value;
            this.viewSelect.appendChild(option);
        }
        this.container.appendChild(this.viewSelect);
        
        this.addLabel('  Edit: ');
        this.editSelect = document.createElement('select');
        this.editSelect.style.display = 'inline-block';
        for(const value of values) {
            var option = document.createElement('option');
            option.value = value;
            option.innerHTML = value;
            this.editSelect.appendChild(option);
        }
        this.container.appendChild(this.editSelect);
        
        return document.createElement('div');
    }
    
    reload(reference, accessLevel) {
        // allow GM only
		this.viewSelect.disabled = accessLevel != Access.GM;
		this.editSelect.disabled = accessLevel != Access.GM;
        
        // update value (select highest access from all properties)
        var viewAccess = Access.EVERYONE;
        var editAccess = Access.EVERYONE;
        for(const propertyName of this.propertyNames) {
            const property = reference.prop(propertyName);
            if(property) {
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
        for(const propertyName of this.propertyNames) {
            const property = reference.prop(propertyName);
            if(property) {
                property.setViewAccess(this.viewSelect.value);
                property.setEditAccess(this.editSelect.value);
            }
        }
    }
}

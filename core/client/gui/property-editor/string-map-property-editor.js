import { PropertyEditor } from './property-editor.js';
import { CanvasWindowInput } from '../../canvas/window/canvas-window-input.js';
import { GuiUtils } from '../../util/guiutil.js';

import { Type } from '../../../common/constants.js';

export class StringMapPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING_MAP, label);
        
        this.valueMap = {};
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        this.container.style.overflow = 'auto';
        
        this.list = document.createElement('select');
        this.list.size = 8;
        this.list.style.width = '100%';
        this.container.appendChild(this.list);
        
        var buttonPanel = document.createElement('div');
        this.addEntry = document.createElement('button');
        this.addEntry.innerHTML = 'Add';
        this.addEntry.onclick = () => this.doAdd();
        buttonPanel.appendChild(this.addEntry);
        this.renameEntry = document.createElement('button');
        this.renameEntry.innerHTML = 'Rename';
        this.renameEntry.onclick = () => this.doRename();
        buttonPanel.appendChild(this.renameEntry);
        this.removeEntry = document.createElement('button');
        this.removeEntry.innerHTML = 'Remove';
        this.removeEntry.onclick = () => this.doRemove();
        buttonPanel.appendChild(this.removeEntry);
        this.container.appendChild(buttonPanel);
        
        this.editor = document.createElement('textarea');
        this.editor.style.width = '100%';
        this.editor.style.height = '250px';
        this.editor.style.overflow = 'auto';
        this.editor.style.resize = 'none';
        this.container.appendChild(this.editor);
        
        // functionality
        this.list.onchange = () => {
            if(this.list.selectedIndex >= 0) {
                this.editor.value = this.valueMap[this.list.value];
                this.editor.disabled = false;
            } else {
                this.editor.value = '';
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
        this.list.innerHTML = '';
        for(var key of Object.keys(this.valueMap)) {
            var option = document.createElement('option');
            option.innerHTML = key;
            this.list.appendChild(option);
        }
        this.list.selectedIndex = -1;
        this.editor.value = '';
    }
    
    doAdd() {
        new CanvasWindowInput('Enter Name:', '', '', name => {
            if(name && this.valueMap[name] == undefined) {
                this.valueMap[name] = '';
                this.reloadFromMap();
            }
        });
    }
    
    doRename() {
        if(this.list.selectedIndex >= 0) {
            var oldName = this.list.value;
            new CanvasWindowInput('Enter Name:', '', oldName, name => {
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

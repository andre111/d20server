import { PropertyEditor } from './property-editor.js';
import { CanvasWindowInput } from '../../canvas/window/canvas-window-input.js';

import { Type } from '../../../common/constants.js';

export class StringMapPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.STRING_MAP, label);
        
        this.valueMap = {};
    }
    
    initContent(label) {
        this.container.style.overflow = 'auto';
        this.container.style.height = 'calc(100% - 18px)';
        
        this.list = document.createElement('select');
        this.list.size = 8;
        this.list.style.width = '100%';
        this.list.style.height = '130px';
        this.container.appendChild(this.list);
        
        var buttonPanel = document.createElement('div');
        this.addEntry = document.createElement('button');
        this.addEntry.innerText = 'Add';
        this.addEntry.style.width = '33.33%';
        this.addEntry.onclick = () => this.doAdd();
        buttonPanel.appendChild(this.addEntry);
        this.renameEntry = document.createElement('button');
        this.renameEntry.innerText = 'Rename';
        this.renameEntry.style.width = '33.33%';
        this.renameEntry.onclick = () => this.doRename();
        buttonPanel.appendChild(this.renameEntry);
        this.removeEntry = document.createElement('button');
        this.removeEntry.innerText = 'Remove';
        this.removeEntry.style.width = '33.33%';
        this.removeEntry.onclick = () => this.doRemove();
        buttonPanel.appendChild(this.removeEntry);
        this.container.appendChild(buttonPanel);
        
        this.editor = document.createElement('textarea');
        this.editor.style.width = '100%';
        this.editor.style.height = 'calc(100% - 154px)';
        this.editor.style.overflow = 'auto';
        this.editor.style.whiteSpace = 'nowrap';
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
		if(!reference.has(this.name)) return;
        const canEdit = reference.canEditProperty(this.name, accessLevel);

		// update state
		this.list.disabled = !canEdit;
		this.editor.disabled = !canEdit;
		this.addEntry.disabled = !canEdit;
		this.renameEntry.disabled = !canEdit;
		this.removeEntry.disabled = !canEdit;
    }
    
    reloadValue(reference, name) {
        this.valueMap = reference.getStringMap(name);
        this.reloadFromMap();
    }
    
    applyValue(reference, name) {
        reference.setStringMap(name, this.valueMap);
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
                this.onChange();
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
                    this.onChange();
                    this.reloadFromMap();
                }
            });
        }
    }
    
    doRemove() {
        if(this.list.selectedIndex >= 0) {
            delete this.valueMap[this.list.value];
            this.onChange();
            this.reloadFromMap();
        }
    }
}

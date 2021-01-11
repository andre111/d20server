import { PropertyEditor } from '../property-editor.js';
import { SearchableIDTree } from '../../../gui/searchable-id-tree.js';
import { getValueProvider } from '../../../gui/value-providers.js';
import { CanvasWindowChoose } from '../../../canvas/window/canvas-window-choose.js';
import { CanvasWindowEditEntity } from '../../../canvas/window/canvas-window-edit-entity.js';
import { EntityReference } from '../../../entity/entity-reference.js';
import { GuiUtils } from '../../../util/guiutil.js';

import { Type } from '../../../../common/constants.js';
import { EntityManagers } from '../../../../common/entity/entity-managers.js';


export class LongListPropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, allowDuplicates) {
        super(name, Type.LONG_LIST, label);
        
        this.referenceType = referenceType;
        this.allowDuplicates = allowDuplicates;
        
        this.valueList = [];
        this.valueProvider = getValueProvider(this.referenceType);
        
        GuiUtils.makeBordered(this.container, label);
        this.container.style.overflow = 'auto';
        
        this.tree = new SearchableIDTree(this.container, null, this.valueProvider);
        if(referenceType != 'profile') this.addButton('Open', false, () => this.doOpen());
        this.addButton('Add', false, () => this.doAdd());
        this.addButton('Remove', false, () => this.doRemove());
    }
    
    addButton(text, disableable, callback) {
        var button = document.createElement('button');
        button.innerHTML = text;
        button.onclick = callback;
        this.tree.getSearchPanel().appendChild(button);
    }
    
    initContent(label) {
        return document.createElement('div');
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
        var entries = {};
        for(var i=0; i<this.valueList.length; i++) {
            entries[String(i)] = this.valueProvider.getValue(this.valueList[i]);
        }
        
        this.tree.reload(entries);
        this.tree.expandAll();
    }
    
    doOpen() {
        var entry = this.tree.getSelectedValue();
        if(entry != null) {
            var entity = EntityManagers.get(this.referenceType).find(this.valueList[entry]);
            if(entity != null && entity != undefined) {
                new CanvasWindowEditEntity(new EntityReference(entity));
            }
        }
    }
    
    doAdd() {
        new CanvasWindowChoose(this.referenceType, id => {
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

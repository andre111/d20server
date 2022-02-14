import { PropertyEditor } from '../property-editor.js';
import { SearchableIDTree } from '../../../gui/searchable-id-tree.js';
import { getValueProvider } from '../../../gui/value-providers.js';
import { CanvasWindowChoose } from '../../../canvas/window/canvas-window-choose.js';

import { Type } from '../../../../common/constants.js';
import { EntityManagers } from '../../../../common/entity/entity-managers.js';
import { Events } from '../../../../common/events.js';


export class LongListPropertyEditor extends PropertyEditor {
    constructor(name, label, referenceType, allowDuplicates) {
        super(name, Type.LONG_LIST, label);

        this.referenceType = referenceType;
        this.allowDuplicates = allowDuplicates;

        this.valueList = [];
        this.valueProvider = getValueProvider(this.referenceType);

        this.container.style.overflow = 'auto';

        this.tree = new SearchableIDTree(this.container, null, this.valueProvider, () => this.doOpen());

        this.buttonCount = (referenceType != 'profile') ? 3 : 2;
        if (referenceType != 'profile') this.addButton('Open', false, () => this.doOpen());
        this.addButton('Add', false, () => this.doAdd());
        this.addButton('Remove', false, () => this.doRemove());
    }

    addButton(text, disableable, callback) {
        var button = document.createElement('button');
        button.style.width = 100 / this.buttonCount + '%';
        button.innerHTML = text;
        button.onclick = callback;
        this.tree.getSearchPanel().appendChild(button);
    }

    initContent(label) {
        return document.createElement('div');
    }

    //TODO disable edit access if not allowed

    reloadValue(reference, name) {
        this.valueList = reference.getLongList(name);
        this.reloadTree();
    }

    applyValue(reference, name) {
        reference.setLongList(name, this.valueList);
    }

    reloadTree() {
        var entries = {};
        for (var i = 0; i < this.valueList.length; i++) {
            entries[String(i)] = this.valueProvider.getValue(this.valueList[i]);
        }

        this.tree.reload(entries);
        this.tree.expandAll();
    }

    doOpen() {
        if (this.referenceType == 'profile') return;

        const entry = this.tree.getSelectedValue();
        if (entry != null) {
            const entity = EntityManagers.get(this.referenceType).find(this.valueList[entry]);
            if (entity) Events.trigger('openEntity', { entity: entity, parentWindow: this.window }, true);
        }
    }

    doAdd() {
        new CanvasWindowChoose(this.window, this.referenceType, id => {
            if (id == null || id <= 0) return;

            if (this.allowDuplicates || !this.valueList.includes(id)) {
                this.valueList.push(id);
                this.reloadTree();
                this.onChange();
            }
        });
    }

    doRemove() {
        const entry = this.tree.getSelectedValue();
        if (entry != null) {
            this.valueList.splice(entry, 1);
            this.reloadTree();
            this.onChange();
        }
    }
}

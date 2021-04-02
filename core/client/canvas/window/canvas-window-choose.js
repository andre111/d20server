import { CanvasWindow } from '../canvas-window.js';
import { getValueProvider } from '../../gui/value-providers.js';
import { SearchableIDTree } from '../../gui/searchable-id-tree.js';

export class CanvasWindowChoose extends CanvasWindow {
    #callback;
    #tree;

    constructor(type, callback) {
        super('Select '+type, true);

        this.#callback = callback;
       
        this.#tree = new SearchableIDTree(this.frame, null, getValueProvider(type), () => this.onChoose());
        
        $(this.frame).dialog('option', 'buttons', [
            {
                text: 'Ok',
                click: () => this.onChoose()
            },
            {
                text: 'Cancel',
                click: () => $(this.frame).dialog('close')
            }
        ]);
    }

    onChoose() {
        const choosen = this.#tree.getSelectedValue();
        if(choosen != null && choosen != undefined) {
            this.#callback(Number(choosen));
        } else {
            this.#callback(-1);
        }
        $(this.frame).dialog('close');
    }
}

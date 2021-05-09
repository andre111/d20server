import { CanvasWindow } from '../canvas-window.js';
import { getValueProvider } from '../../gui/value-providers.js';
import { SearchableIDTree } from '../../gui/searchable-id-tree.js';
import { I18N } from '../../../common/util/i18n.js';

export class CanvasWindowChoose extends CanvasWindow {
    #callback;
    #tree;

    constructor(parent, type, callback) {
        super(parent, 'Select '+type, true);

        this.#callback = callback;
       
        this.#tree = new SearchableIDTree(this.content, null, getValueProvider(type), () => this.onChoose());
        this.#tree.getContainer().style.overflow = 'auto';
        this.#tree.getContainer().style.height = 'calc(100% - 23px)';

        this.addButton(I18N.get('global.ok', 'Ok'), () => {
            this.onChoose();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.close();
        });
        this.setDimensions(300, 500);
        this.center();
    }

    onChoose() {
        const choosen = this.#tree.getSelectedValue();
        if(choosen != null && choosen != undefined) {
            this.#callback(Number(choosen));
        } else {
            this.#callback(-1);
        }
        this.close();
    }
}

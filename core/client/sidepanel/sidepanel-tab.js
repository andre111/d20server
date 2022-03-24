// @ts-check
import { I18N } from '../../common/util/i18n.js';

export class SidepanelTab {
    #key;
    #visible;
    #icon;

    #tab;

    constructor(key, visible, icon) {
        this.#key = key;
        this.#visible = visible;
        this.#icon = icon;

        this.#tab = document.createElement('div');
        // TODO: make this use a class and css
        this.#tab.style.height = '100%';
        this.#tab.style.padding = '4px';
        this.#tab.style.overflow = 'auto';
    }

    getName() {
        return I18N.get('sidepanel.tabs.' + this.#key, this.#key);
    }

    getIcon() {
        return this.#icon ? this.#icon : this.getName();
    }

    isVisible() {
        return this.#visible;
    }

    get tab() {
        return this.#tab;
    }
}

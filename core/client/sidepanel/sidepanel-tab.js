import { ServerData } from '../server-data.js';

export class SidepanelTab {
    name;
    visible;
    tab;

    constructor(name, visible) {
        this.name = name;
        this.visible = visible;

        this.tab = document.createElement('div');
        // TODO: make this dynamically match the correct size, instead of this hard coded hack job (maybe only once I implement my own tab system)
        this.tab.style.height = 'calc(100% - '+String(32*(ServerData.isGM() ? 2 : 1))+'px)'; 
        this.tab.style.overflow = 'auto';
    }

    getName() {
        return this.name;
    }

    isVisible() {
        return this.visible;
    }

    getTab() {
        return this.tab;
    }
}

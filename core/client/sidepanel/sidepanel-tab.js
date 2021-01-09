export class SidepanelTab {
    name;
    visible;
    tab;

    constructor(name, visible) {
        this.name = name;
        this.visible = visible;

        this.tab = document.createElement('div');
        this.tab.style.height = 'calc(100% - 63px)'; //TODO: move to css (use a class for sidepanel tabs)
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

// @ts-check
export class FileAction {
    window;
    name;
    icon;

    button;

    constructor(window, name, icon) {
        this.window = window;
        this.name = name;
        this.icon = icon || 0;

        // create button
        this.button = document.createElement('input');
        this.button.className = 'fileman-button';
        this.button.type = 'button';
        this.button.value = name;
        this.button.style.backgroundPosition = '2px ' + String(-this.icon * 28 + 2) + 'px';
    }

    getName() {
        return this.name;
    }

    getIcon() {
        return this.icon;
    }

    getButton() {
        return this.button;
    }

    showWithoutFile() {
        return false;
    }

    shouldShowFor(file) { throw new Error('Cannot call abstract function'); }
    applyTo(file) { throw new Error('Cannot call abstract function'); }
}

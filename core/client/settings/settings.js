import { CanvasWindowSettings } from '../canvas/window/canvas-window-settings.js';
import { SettingsPage } from './settings-page.js';

export class Settings {
    static #pages = {};
    static #loading = false;
    static #window;

    static openWindow() {
        if(!Settings.#window || Settings.#window.closed) {
            Settings.#window = new CanvasWindowSettings();
        }
    }

    static createPage(internalName, displayName) {
        if(Settings.#pages[internalName]) throw new Error(`Duplicated settings page name: ${internalName}`);
        return Settings.#pages[internalName] = new SettingsPage(displayName);
    }

    static save() {
        if(Settings.#loading) return;

        // get values as plain object
        var obj = {};
        for(const [name, page] of Object.entries(Settings.#pages)) {
            obj[name] = page.toObject();
        }

        // load (but override) old values
        const js = localStorage.getItem('settings');
        if(js) {
            const oldObj = JSON.parse(js);
            obj = Object.assign(oldObj, obj);
        }

        // and store
        localStorage.setItem('settings', JSON.stringify(obj));
    }

    static load() {
        Settings.#loading = true;

        const js = localStorage.getItem('settings');
        if(js) {
            const obj = JSON.parse(js);

            for(const [name, page] of Object.entries(Settings.#pages)) {
                if(obj[name]) page.fromObject(obj[name]);
            }
        }

        Settings.#loading = false;
    }

    static get pages() {
        return Object.values(Settings.#pages);
    }
    
    constructor() {
    }
}

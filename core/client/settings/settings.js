// @ts-check
import { Events } from '../../common/events.js';
import { CanvasWindowSettings } from '../canvas/window/canvas-window-settings.js';
import { ServerData } from '../server-data.js';
import { ModuleSettings } from './module-settings.js';
import { ServerConfigSettings } from './server-config-settings.js';
import { SettingsEntryNumberRange } from './settings-entry-number-range.js';
import { SettingsEntryToggle } from './settings-entry-toggle.js';
import { SettingsPage } from './settings-page.js';

export class Settings {
    static #pages = {};
    static #loading = false;
    static #loaded = false;
    static #window;

    static openWindow() {
        if (!Settings.#window || Settings.#window.closed) {
            Settings.#window = new CanvasWindowSettings();
        }
    }

    static createPage(internalName, displayName) {
        if (Settings.#pages[internalName]) throw new Error(`Duplicated settings page name: ${internalName}`);
        return Settings.#pages[internalName] = new SettingsPage(internalName, displayName);
    }

    static save() {
        if (Settings.#loading) return;
        if (!Settings.#loaded) return;

        // get values as plain object
        var obj = {};
        for (const [name, page] of Object.entries(Settings.#pages)) {
            obj[name] = page.toObject();
        }

        // load (but override) old values
        const js = localStorage.getItem('settings');
        if (js) {
            const oldObj = JSON.parse(js);
            obj = Object.assign(oldObj, obj);
        }

        // and store
        localStorage.setItem('settings', JSON.stringify(obj));
    }

    static load() {
        Settings.#loading = true;

        const js = localStorage.getItem('settings');
        if (js) {
            const obj = JSON.parse(js);

            for (const [name, page] of Object.entries(Settings.#pages)) {
                if (obj[name]) page.fromObject(obj[name]);
            }
        }

        Settings.#loading = false;
        Settings.#loaded = true;
    }

    static get pages() {
        return Object.values(Settings.#pages);
    }

    static getVolume(volumeSetting) {
        return (SETTING_GLOBAL_VOLUME.value / 100) * (volumeSetting.value / 100);
    }

    static addVolumeSettingListener(volumeSetting, listener) {
        volumeSetting.addListener(listener);
        SETTING_GLOBAL_VOLUME.addListener(listener);
    }

    constructor() {
    }
}

// Default Settings
export const SETTING_GLOBAL_VOLUME = new SettingsEntryNumberRange('settings.volume.global', 'Global Volume', 100, 0, 100);
export const SETTING_WEATHER_VOLUME = new SettingsEntryNumberRange('settings.volume.weather', 'Weather Volume', 100, 0, 100);
export const SETTING_PAGE_AUDIO = Settings.createPage('audio', 'Audio');
SETTING_PAGE_AUDIO.addEntry('volume', SETTING_GLOBAL_VOLUME);
SETTING_PAGE_AUDIO.addEntry('weather_volume', SETTING_WEATHER_VOLUME);

export const SETTING_SHOW_CONTROLLS_BAR = new SettingsEntryToggle('settings.showcontrollsbar', 'Show Controlls Bar', true);
export const SETTING_PAGE_CLIENT = Settings.createPage('client', 'Client');
SETTING_PAGE_CLIENT.addEntry('showcontrollsbar', SETTING_SHOW_CONTROLLS_BAR);

Events.on('enterMainState', event => {
    if (ServerData.isGM()) {
        ServerConfigSettings.init();
        ModuleSettings.init();
    }
});

// @ts-check
import { Events } from '../events.js';
import { deepMerge, toJson } from './datautil.js';

class I18n {
    #data;

    constructor() {
        this.#data = {};
    }

    mergeObject(obj) {
        this.#data = deepMerge(this.#data, obj);
        Events.trigger('i18nUpdate');
    }

    get(path, def, ...values) {
        var string = this.#data[path] ?? def;
        for (var i = 0; i < values.length; i++) {
            string = string.replace('%' + i, values[i]);
        }
        return string;
    }

    getAsJson() {
        return toJson(this.#data, false);
    }
}
export const I18N = new I18n(); 
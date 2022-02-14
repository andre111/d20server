import { deepMerge, toJson } from './datautil.js';

class I18n {
    #data;

    constructor() {
        this.#data = {};
    }

    mergeObject(obj) {
        this.#data = deepMerge(this.#data, obj);
    }

    get(path, def) {
        const split = path.split('.');

        var parent = this.#data;
        for (var i = 0; i < split.length - 1; i++) {
            parent = parent[split[i]];
            if (!parent) return def;
        }

        return parent[split[split.length - 1]] ?? def;
    }

    getAsJson() {
        return toJson(this.#data, true, false);
    }
}
export const I18N = new I18n(); 
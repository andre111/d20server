import { readJsonFile, saveJsonFile } from './util/fileutil.js';

class Config {
    #data;

    constructor() {
        this.#data = readJsonFile('./config/config.json') ?? {};
    }

    get() {
        return this.#data;
    }

    save() {
        saveJsonFile('./config/config.json', this.#data, true);
    }
}
export const CONFIG = new Config();

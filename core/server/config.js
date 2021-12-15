import { PARAMETERS } from './parameters.js';
import { readJsonFile, saveJsonFile } from './util/fileutil.js';

class Config {
    #data;

    constructor() {
        this.#data = readJsonFile('./'+PARAMETERS.datadir+'/config.json') ?? {};
    }

    get() {
        return this.#data;
    }

    save() {
        saveJsonFile('./'+PARAMETERS.datadir+'/config.json', this.#data, true);
    }
}
export const CONFIG = new Config();

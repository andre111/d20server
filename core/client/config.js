class Config {
    #data;

    constructor() {
        this.#data = {};
    }

    get() {
        return this.#data;
    }
}
export const CONFIG = new Config();

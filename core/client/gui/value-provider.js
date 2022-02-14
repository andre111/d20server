export class ValueProvider {
    constructor() {
    }

    getData() { throw new Error('Cannot call abstract function'); }
    getValue(id) { throw new Error('Cannot call abstract function'); }

    getName(value) { throw new Error('Cannot call abstract function'); }
    getIcon(value) { throw new Error('Cannot call abstract function'); }
    getSubText(value) { return null; }
    getTags(value) { return []; }
}

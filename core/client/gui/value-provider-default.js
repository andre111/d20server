// @ts-check
import { ValueProvider } from './value-provider.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';

export class ValueProviderDefault extends ValueProvider {
    constructor(type) {
        super();

        this.type = type;
    }

    getData() {
        return EntityManagers.get(this.type).map();
    }

    getValue(id) {
        return EntityManagers.get(this.type).find(id);
    }

    getName(value) {
        if (value == null || value == undefined) return '';

        return value.getName();
    }

    getIcon(value) {
        if (value == null || value == undefined) return null;

        if (value.has('imagePath') && value.getString('imagePath') != '') {
            return '/data/files' + value.getString('imagePath');
        }
        return null;
    }
}

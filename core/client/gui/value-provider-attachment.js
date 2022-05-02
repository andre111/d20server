// @ts-check
import { ValueProviderWithPath } from './value-provider-with-path.js';

export class ValueProviderAttachment extends ValueProviderWithPath {
    constructor() {
        super('attachment');
    }

    getSubText(value) {
        if (value == null || value == undefined) return null;

        return value.getString('descShort');
    }

    getTags(value) {
        if (value == null || value == undefined) return [];

        return value.getString('tags').split('\n');
    }
}

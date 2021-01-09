import { ValueProviderDefault } from './value-provider-default.js';

export class ValueProviderImage extends ValueProviderDefault {
    constructor() {
        super('image');
    }
    
    getIcon(value) {
        return '/image/'+value.id;
    }
}

import { ValueProviderDefault } from './value-provider-default.js';

export class ValueProviderActor extends ValueProviderDefault {
    constructor() {
        super('actor');
    }
    
    getIconProperty(value) {
        const token = value.prop('token').getEntity();
        if(token) {
            return token.prop('imagePath');
        }
        return null;
    }
}

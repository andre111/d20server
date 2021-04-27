import { ValueProviderDefault } from './value-provider-default.js';

export class ValueProviderActor extends ValueProviderDefault {
    constructor() {
        super('actor');
    }
    
    getName(value) {
        if(value == null || value == undefined) return '';
        
        return value.getString('path') + value.getName();
    }
}

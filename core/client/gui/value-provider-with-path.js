import { ValueProviderDefault } from './value-provider-default.js';

export class ValueProviderWithPath extends ValueProviderDefault {
    constructor(type) {
        super(type);
    }
    
    getName(value) {
        if(value == null || value == undefined) return '';
        
        return value.getString('path') + value.getName();
    }
}

import { ValueProviderDefault } from './value-provider-default.js';

export class ValueProviderAttachment extends ValueProviderDefault {
    constructor() {
        super('attachment');
    }
    
    getSubText(value) {
        if(value == null || value == undefined) return null;
        
        return value.prop('descShort').getString();
    }
    
    getTags(value) {
        if(value == null || value == undefined) return [];
        
        return value.prop('tags').getString().split('\n');
    }
}

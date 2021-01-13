import { ValueProviderDefault } from './value-provider-default.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';

export class ValueProviderActor extends ValueProviderDefault {
    constructor() {
        super('actor');
    }
    
    getIconProperty(value) {
        var token = EntityManagers.get('token').find(value.prop('defaultToken').getLong());
        if(token) {
            return token.prop('imagePath');
        }
        return null;
    }
}

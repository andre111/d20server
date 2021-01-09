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
        if(value == null || value == undefined) return '';
        
        return value.getName();
    }
    
    getIcon(value) {
        if(value == null || value == undefined) return null;
        
        var property = this.getIconProperty(value);
        if(property && property.getLong() > 0) {
            return '/image/'+property.getLong();
        }
        return null;
    }
    
    getIconProperty(value) {
        return value.prop('imageID');
    }
}

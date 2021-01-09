import { ValueProvider } from './value-provider.js';
import { ServerData } from '../server-data.js';

export class ValueProviderProfile extends ValueProvider {
    constructor() {
        super();
    }
    
    getData() {
        return ServerData.profiles.get();
    }
    
    getValue(id) {
        return ServerData.profiles.get().get(id);
    }
    
    getName(value) {
        if(value == null || value == undefined) return '';
        
        return value.isConnected() ? 'Online/'+value.getUsername() : 'Offline/'+value.getUsername();
    }
    
    getIcon(value) {
        if(value == null || value == undefined) return null;
        
        return '/color/'+value.getColor();
    }
}

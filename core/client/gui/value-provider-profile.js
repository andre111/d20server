import { ValueProvider } from './value-provider.js';
import { ServerData } from '../server-data.js';
import { RenderUtils } from '../util/renderutil.js';

export class ValueProviderProfile extends ValueProvider {
    constructor() {
        super();
    }
    
    getData() {
        // convert map to object as is expected in new code
        const map = {};
        for(const [key, value] of ServerData.profiles.get().entries()) {
            map[String(key)] = value;
        }
        return map;
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
        
        const color = '#' + (Number(value.getColor()) & 0x00FFFFFF).toString(16).padStart(6, '0');
        return RenderUtils.getColorImage(color, 16, 2);
    }
}

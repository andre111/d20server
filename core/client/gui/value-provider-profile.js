import { ValueProvider } from './value-provider.js';
import { ServerData } from '../server-data.js';
import { RenderUtils } from '../util/renderutil.js';

export class ValueProviderProfile extends ValueProvider {
    #includeStatus;

    constructor(includeStatus) {
        super();

        this.#includeStatus = includeStatus;
    }
    
    getData() {
        // convert map to object as is expected in new code
        const map = {};
        for(const [key, value] of ServerData.profiles.entries()) {
            map[String(key)] = value;
        }
        return map;
    }
    
    getValue(id) {
        return ServerData.profiles.get(id);
    }
    
    getName(value) {
        if(value == null || value == undefined) return '';
        
        if(this.#includeStatus) {
            return value.isConnected() ? 'Online/'+value.getUsername() : 'Offline/'+value.getUsername();
        } else {
            return value.getUsername();
        }
    }
    
    getIcon(value) {
        if(value == null || value == undefined) return null;
        
        const color = '#' + (Number(value.getColor()) & 0x00FFFFFF).toString(16).padStart(6, '0');
        return RenderUtils.getColorImage(color, 16, 2);
    }
}

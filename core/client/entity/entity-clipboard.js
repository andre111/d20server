import { EntityReference } from "../../common/entity/entity-reference.js";

var _typedClipboard = new Map();
export const EntityClipboard = {
    setEntities(type, references) {
        _typedClipboard.set(type, []);

        for(const reference of references) {
            // copy/clone underlying entity
            const entity = reference.getModifiedEntity();
            
			// copy EntityReference with required values
            const newReference = new EntityReference(entity);
            newReference.setMouseOffsetX(reference.getMouseOffsetX());
            newReference.setMouseOffsetY(reference.getMouseOffsetY());
            
            _typedClipboard.get(type).push(newReference);
        }
    },

    getEntities: function(type) {
        if(!_typedClipboard.has(type)) return [];
        
        return _typedClipboard.get(type);
    }
}

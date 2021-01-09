import { EntityReference } from "./entity-reference.js";

var _typedClipboard = new Map();
export const EntityClipboard = {
    setEntities(type, references) {
        _typedClipboard.set(type, []);

        for(const reference of references) {
            // copy/clone underlying entity (and reset id)
            const entity = reference.getModifiedEntity();
            entity.resetID();
            
			// copy EntityReference with required values
            const newReference = new EntityReference(entity);
            newReference.setMouseOffsetX(reference.getMouseOffsetX());
            newReference.setMouseOffsetY(reference.getMouseOffsetY());
            
            _typedClipboard.get(entityType).push(newReference);
        }
    },

    getEntities: function(type) {
        if(!_typedClipboard.has(type)) return [];
        
        return _typedClipboard.get(type);
    }
}

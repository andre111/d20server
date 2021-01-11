import { Variable } from './variable.js';
import { Type } from '../../constants.js';
import { EntityManagers } from '../../entity/entity-managers.js';

export class EntityPropertyVariable extends Variable {
    propertyName;
    entityFinder;

    constructor(fullName, propertyName, entityFinder) {
        super(fullName);

        this.propertyName = propertyName;
        this.entityFinder = entityFinder;
    }

    set(context, value) {
        const entity = this.getEntity(context);

        // get property
        const property = entity.prop(this.propertyName);
        if(!property) throw new Error(`No property ${this.propertyName}`);

        // check access
        const accessLevel = entity.getAccessLevel(context.profile);
        if(!property.canEdit(accessLevel)) throw new Error(`No view access to ${this.getFullName()}`);

        // set value (by type)
        switch(property.getType()) {
        case Type.BOOLEAN:
            property.setBoolean(value);
            break;
        case Type.DOUBLE:
            property.setDouble(value);
            break;
        case Type.LAYER:
            property.setLayer(value);
            break;
        case Type.LIGHT:
            property.setLight(value);
            break;
        case Type.LONG:
            property.setLong(value);
            break;
        case Type.LONG_LIST:
            property.setLongList(value);
            break;
        case Type.STRING:
            property.setString(value);
            break;
        case Type.EFFECT:
            property.setEffect(value);
            break;
        case Type.COLOR:
            property.setColor(value);
            break;
        case Type.ACCESS:
            property.setAccessValue(value);
            break;
        default:
            throw new Error(`Missing implementation for type ${property.getType()}`);
        }

        // update
        var map = {};
        map[this.propertyName] = property;
        EntityManagers.get(entity.getType()).updateProperties(entity.getID(), map, accessLevel);
    }

    get(context) {
        const entity = this.getEntity(context);

        // get property
        const property = entity.prop(this.propertyName);
        if(!property) throw new Error(`No property ${this.propertyName}`);

        // check access
        const accessLevel = entity.getAccessLevel(context.profile);
        if(!property.canView(accessLevel)) throw new Error(`No view access to ${this.getFullName()}`);

        // get value (by type)
        switch(property.getType()) {
        case Type.BOOLEAN:
            return property.getBoolean();
        case Type.DOUBLE:
            return property.getDouble();
        case Type.LAYER:
            return property.getLayer();
        case Type.LIGHT:
            return property.getLight();
        case Type.LONG:
            return property.getLong();
        case Type.LONG_LIST:
            return property.getLongList();
        case Type.STRING:
            return property.getString();
        case Type.EFFECT:
            return property.getEffect();
        case Type.COLOR:
            return property.getColor();
        case Type.ACCESS:
            return property.getAccessValue();
        default:
            throw new Error(`Missing implementation for type ${property.getType()}`);
        }
    }

    getEntity(context) {
        return this.entityFinder.findEntity(context);
    }
}

import { Variable } from './variable.js';
import { Type } from '../../constants.js';
import { EntityManagers } from '../../entity/entity-managers.js';

export class EntityPropertyVariable extends Variable {
    #propertyName;
    #entityFinder;

    constructor(fullName, propertyName, entityFinder) {
        super(fullName);

        this.#propertyName = propertyName;
        this.#entityFinder = entityFinder;
    }

    getType(context) {
        const entity = this.getEntity(context);
        if(!entity.has(this.#propertyName)) throw new Error(`No property ${this.#propertyName}`);
        return entity.getPropertyType(this.#propertyName);
    }

    set(context, value) {
        const entity = this.getEntity(context);
        if(!entity.has(this.#propertyName)) throw new Error(`No property ${this.#propertyName}`);

        // check access
        const accessLevel = entity.getAccessLevel(context.profile);
        if(!entity.canEditProperty(this.#propertyName, accessLevel)) throw new Error(`No edit access to ${this.getFullName()}`);

        // set value (by type)
        switch(entity.getPropertyType(this.#propertyName)) {
        case Type.BOOLEAN:
            entity.setBoolean(this.#propertyName, value);
            break;
        case Type.DOUBLE:
            entity.setDouble(this.#propertyName, value);
            break;
        case Type.LAYER:
            entity.setLayer(this.#propertyName, value);
            break;
        case Type.LIGHT:
            entity.setLight(this.#propertyName, value);
            break;
        case Type.LONG:
            entity.setLong(this.#propertyName, value);
            break;
        case Type.LONG_LIST:
            entity.setLongList(this.#propertyName, value);
            break;
        case Type.STRING:
            entity.setString(this.#propertyName, value);
            break;
        case Type.EFFECT:
            entity.setEffect(this.#propertyName, value);
            break;
        case Type.COLOR:
            entity.setColor(this.#propertyName, value);
            break;
        case Type.ACCESS:
            entity.setAccessValue(this.#propertyName, value);
            break;
        default:
            throw new Error(`Missing implementation for type ${entity.getPropertyType(this.#propertyName)}`);
        }

        // update
        var map = {};
        map[this.#propertyName] = entity.getInternal(this.#propertyName);
        EntityManagers.get(entity.getType()).updateProperties(entity.getID(), map, accessLevel);
    }

    get(context) {
        const entity = this.getEntity(context);
        if(!entity.has(this.#propertyName)) throw new Error(`No property ${this.#propertyName}`);

        // check access
        const accessLevel = entity.getAccessLevel(context.profile);
        if(!entity.canViewProperty(this.#propertyName, accessLevel)) throw new Error(`No edit access to ${this.getFullName()}`);

        // get value (by type)
        switch(entity.getPropertyType(this.#propertyName)) {
        case Type.BOOLEAN:
            return entity.getBoolean(this.#propertyName);
        case Type.DOUBLE:
            return entity.getDouble(this.#propertyName);
        case Type.LAYER:
            return entity.getLayer(this.#propertyName);
        case Type.LIGHT:
            return entity.getLight(this.#propertyName);
        case Type.LONG:
            return entity.getLong(this.#propertyName);
        case Type.LONG_LIST:
            return entity.getLongList(this.#propertyName);
        case Type.STRING:
            return entity.getString(this.#propertyName);
        case Type.EFFECT:
            return entity.getEffect(this.#propertyName);
        case Type.COLOR:
            return entity.getColor(this.#propertyName);
        case Type.ACCESS:
            return entity.getAccessValue(this.#propertyName);
        default:
            throw new Error(`Missing implementation for type ${entity.getPropertyType(this.#propertyName)}`);
        }
    }

    getEntity(context) {
        return this.#entityFinder.findEntity(context);
    }
}

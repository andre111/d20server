import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { Entity } from '../entity/entity.js';
import { EntityReference } from '../entity/entity-reference.js';

export class TokenUtil {
    static getActor(token) {
        if(!token || !(token instanceof Entity) || token.getType() !== 'token') throw new Error('Provided object is not a token');

        if(token.getBoolean('actorLocal')) {
            const manager = EntityManagers.get('token/'+token.getID()+'-actor');
            if(!manager) return null; // avoid crashing on race conditions where the entitymanager has not been synched/created on client yet

            return manager.find(1);
        } else {
            const actorID = token.getLong('actorID');
            return EntityManagers.get('actor').find(actorID);
        }
    }

    static getControllingPlayers(token) {
        const actor = TokenUtil.getActor(token);

        if(actor) return actor.getControllingPlayers();
        else return [];
    }

    // TODO: this has many duplicated lines
    static isBarVisible(token, viewer, number) {
        return TokenUtil.getBarMax(token, viewer, number) != 0;
    }

    static getBarCurrent(token, viewer, number) {
        return TokenUtil.getBarValue(token, viewer, 'bar'+number+'Current');
    }

    static getBarMax(token, viewer, number) {
        return TokenUtil.getBarValue(token, viewer, 'bar'+number+'Max');
    }

    static getBarValue(token, viewer, barProp) {
        const accessLevel = token.getAccessLevel(viewer);
        if(!token.canViewProperty(barProp, accessLevel)) return 0;
        const propNameOrValue = token.getString(barProp);
        
        // direct value
        if(propNameOrValue.match(/^-?\d+$/)) return parseInt(propNameOrValue);

        // actor property
        const actor = TokenUtil.getActor(token);
        if(!actor) return 0;
        if(!actor.has(propNameOrValue) || actor.getPropertyType(propNameOrValue) != Type.LONG) return 0;
        if(!actor.canViewProperty(propNameOrValue, accessLevel)) return 0;
        return actor.getLong(propNameOrValue);
    }

    static canEditBarCurrent(token, viewer, number) {
        const accessLevel = token.getAccessLevel(viewer);
        const propNameOrValue = token.getString('bar'+number+'Current');

        // direct value
        if(propNameOrValue.match(/^-?\d+$/)) return token.canEditProperty('bar'+number+'Current', accessLevel);

        // actor property
        const actor = TokenUtil.getActor(token);
        if(!actor || !actor.canView(viewer)) return false;
        return actor.canEditProperty(propNameOrValue, accessLevel);
    }

    static setBarCurrent(token, viewer, number, newValue) {
        if(!TokenUtil.canEditBarCurrent(token, viewer, number)) return;

        const propNameOrValue = token.getString('bar'+number+'Current');

        // direct value
        if(propNameOrValue.match(/^-?\d+$/)) {
            const reference = new EntityReference(token);
            reference.setString('bar'+number+'Current', ''+newValue);
            reference.performUpdate();
            return;
        }

        // actor property
        const reference = new EntityReference(TokenUtil.getActor(token));
        reference.setLong(propNameOrValue, newValue);
        reference.performUpdate();
    }
}

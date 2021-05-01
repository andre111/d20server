import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { Entity } from '../entity/entity.js';

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
        const actor = TokenUtil.getActor(token);
        if(!actor || !actor.canView(viewer)) return false;

        const accessLevel = token.getAccessLevel(viewer);
        if(!actor.canViewProperty(token.getString('bar'+number+'Current'), accessLevel)) return false;
        if(!actor.canViewProperty(token.getString('bar'+number+'Max'), accessLevel)) return false;

        const max = TokenUtil.getBarMax(token, number);
        return max != 0;
    }

    static getBarCurrent(token, number) {
        const actor = TokenUtil.getActor(token);
        if(!actor) return 0;

        const propName = token.getString('bar'+number+'Current');
        if(!actor.has(propName) || actor.getPropertyType(propName) != Type.LONG) return 0;

        return actor.getLong(propName);
    }

    static getBarMax(token, number) {
        const actor = TokenUtil.getActor(token);
        if(!actor) return 0;

        const propName = token.getString('bar'+number+'Max');
        if(!actor.has(propName) || actor.getPropertyType(propName) != Type.LONG) return 0;

        return actor.getLong(propName);
    }

    static canEditBarCurrent(token, viewer, number) {
        const actor = TokenUtil.getActor(token);
        if(!actor || !actor.canView(viewer)) return false;

        const accessLevel = token.getAccessLevel(viewer);
        return actor.canEditProperty(token.getString('bar'+number+'Current'), accessLevel);
    }
}

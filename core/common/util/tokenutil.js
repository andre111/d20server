import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { Entity } from '../entity/entity.js';

export class TokenUtil {
    static getActor(token) {
        if(!token || !(token instanceof Entity) || token.getType() !== 'token') throw new Error('Provided object is not a token');

        if(token.prop('actorLocal').getBoolean()) {
            return EntityManagers.get('token/'+token.getID()+'-actor').find(0);
        } else {
            const actorID = token.prop('actorID').getLong();
            return EntityManagers.get('actor').find(actorID);
        }
    }

    static getControllingPlayers(token) {
        const actor = TokenUtil.getActor(token);

        if(actor) return actor.getControllingPlayers();
        else return [];
    }

    static isBarVisible(token, viewer, number) {
        const actor = TokenUtil.getActor(token);
        if(!actor || !actor.canView(viewer)) return false;

        const accessLevel = token.getAccessLevel(viewer);
        const currentProp = TokenUtil.getBarCurrentProp(token, number);
        const maxProp = TokenUtil.getBarMaxProp(token, number);
        return currentProp && maxProp && currentProp.canView(accessLevel) && maxProp.canView(accessLevel) && maxProp.getLong() != 0;
    }

    static getBarCurrentProp(token, number) {
        const actor = TokenUtil.getActor(token);
        if(!actor) return null;

        const propName = token.prop('bar'+number+'Current').getString();
        const prop = actor.prop(propName);
        if(!prop || prop.getType() != Type.LONG) return null;

        return prop;
    }

    static getBarMaxProp(token, number) {
        const actor = TokenUtil.getActor(token);
        if(!actor) return null;

        const propName = token.prop('bar'+number+'Max').getString();
        const prop = actor.prop(propName);
        if(!prop || prop.getType() != Type.LONG) return null;

        return prop;
    }
}

// @ts-check
import { Type } from '../constants.js';
import { Events } from '../events.js';
import { Profile } from '../profile.js';
import { Scripting } from '../scripting/scripting.js';
import { TokenUtil } from '../util/tokenutil.js';

// This file contains extracted entity methods (using the Events system) to avoid circular dependencies

//------------------------------------------------
// Update Rules
//------------------------------------------------
Events.on('propertyChange', event => {
    const entity = event.data.entity;
    const def = entity.getDefinition();
    applyUpdateRules(entity, def.updateRules, event.data.changedProperties);
    for (const extDef of entity.getActiveExtensions()) {
        applyUpdateRules(entity, extDef.updateRules, event.data.changedProperties);
    }
});

const SCRIPT = new Scripting(false);
const UPDATE_RULE_EXPR_CACHE = new Map();
function applyUpdateRules(entity, updateRules, changedProperties) {
    for (const ruleDef of updateRules) {
        if (!entity.has(ruleDef.property)) throw new Error(`Error in UpdateRule: Property ${ruleDef.property} does not exist`);

        try {
            // use cached expression or parse from definition (because parsing is an expensive operation that can lock up the browser for a noticeable time)
            if (!UPDATE_RULE_EXPR_CACHE.has(ruleDef.expression)) {
                UPDATE_RULE_EXPR_CACHE.set(ruleDef.expression, SCRIPT.parseExpression(ruleDef.expression));
            }
            const expression = UPDATE_RULE_EXPR_CACHE.get(ruleDef.expression);

            const result = SCRIPT.evalExpression(expression, Profile.SYSTEM, entity);
            SCRIPT.throwIfErrored();
            if (result.type != Type.DOUBLE) throw new Error('Update rule evaluated to unexpected type: expected DOUBLE got ' + result.type);

            const value = result.value;
            switch (entity.getPropertyType(ruleDef.property)) {
                case Type.DOUBLE:
                    entity.setDouble(ruleDef.property, value);
                    break;
                case Type.LONG:
                    entity.setLong(ruleDef.property, Math.trunc(value));
                    break;
                case Type.STRING:
                    var stringValue = '?';
                    if (ruleDef.stringMap && ruleDef.stringMap[Math.trunc(value)]) stringValue = ruleDef.stringMap[Math.trunc(value)];
                    entity.setString(ruleDef.property, stringValue);
                    break;
                default:
                    throw new Error(`Error in UpdateRule: Cannot modify property of type ${entity.getPropertyType(ruleDef.property)}`);
            }
            changedProperties[ruleDef.property] = entity.getInternal(ruleDef.property);
        } catch (error) {
            //TODO: how can I report where the old error happended?
            //throw new Error(`Error in UpdateRule: ${error.message}`);
            console.log(`Error in UpdateRule: ${error.message}`);
            console.log(error);
            throw error;
        }
    }
}

//------------------------------------------------
// Control
//------------------------------------------------
Events.on('getControllingPlayers', event => {
    const entity = event.data.entity;
    const cdef = entity.getDefinition().settings.control;
    switch (cdef.mode) {
        case 'NONE':
        default:
            return;
        case 'PROPERTY':
            if (!entity.has(cdef.property)) return;

            switch (entity.getPropertyType(cdef.property)) {
                case Type.LONG:
                    event.data.controllingPlayers = [entity.getLong(cdef.property)];
                    return;
                case Type.LONG_LIST:
                    event.data.controllingPlayers = entity.getLongList(cdef.property);
                    return;
                default:
                    return;
            }
        //TODO: remove this wierd stuff, maybe just move away from data driven again and just use code
        case 'TOKEN':
            event.data.controllingPlayers = TokenUtil.getControllingPlayers(entity);
            return;
    }
});

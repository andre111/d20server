import { Access, Role } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';

export const TokenListUtils = {
    getAccessLevel: function(profile, list, token) {
        if(token) {
            return token.getAccessLevel(profile);
        }
        
        if(profile && profile.getRole() == Role.GM) return Access.GM;
        return Access.EVERYONE;
    },
    
    getValue: function(list, tokenID) {
        var value = list.prop('values').getStringMap()[''+tokenID];
        if(value == null || value == undefined) return 0;
        return Number(value.split(':')[0]);
    },

    hasValue: function(list, tokenID) {
        var value = list.prop('values').getStringMap()[''+tokenID];
        return value != null && value != undefined;
    },

    addOrUpdateToken: function(profile, list, token, value, hidden) {
        var tokens = list.prop('tokens').getLongList();
        if(!tokens.includes(token.getID())) tokens.push(token.getID());

        var values = list.prop('values').getStringMap();
        values[''+token.getID()] = value + ':' + hidden;

        // sort if needed
        if(list.prop('sorted')) {
            tokens.sort((t1, t2) => {
                const v1 = Number(values[''+t1].split(':')[0]);
                const v2 = Number(values[''+t2].split(':')[0]);
                return v2 - v1;
            });
        }

        // update entity
        list.prop('tokens').setLongList(tokens);
        list.prop('values').setStringMap(values);
        EntityManagers.get('token_list').add(list);
    },

    removeToken(list, tokenID) {
        var tokens = list.prop('tokens').getLongList();
        if(tokens.includes(tokenID)) tokens.splice(tokens.indexOf(tokenID), 1);

        var values = list.prop('values').getStringMap();
        delete values[''+tokenID];

        list.prop('tokens').setLongList(tokens);
        list.prop('values').setStringMap(values);
        EntityManagers.get('token_list').add(list);
    },
    
    isHidden: function(list, tokenID) {
        var value = list.prop('values').getStringMap()[''+tokenID];
        if(value == null || value == undefined) return false;
        return value.split(':')[1] != 'false';
    }
}

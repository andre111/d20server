import { Access, Role } from '../constants.js';

export const TokenListUtils = {
    getAccessLevel: function(profile, list, token) {
        if(token) {
            return token.getAccessLevel(profile);
        }
        
        if(profile.getRole() == Role.GM) return Access.GM;
        return Access.EVERYONE;
    },
    
    getValue: function(list, tokenID) {
        var value = list.prop('values').getStringMap()[''+tokenID];
        if(value == null || value == undefined) return 0;
        return Number(value.split(':')[0]);
    },
    
    isHidden: function(list, tokenID) {
        var value = list.prop('values').getStringMap()[''+tokenID];
        if(value == null || value == undefined) return false;
        return value.split(':')[1] != 'false';
    }
}

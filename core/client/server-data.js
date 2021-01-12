import { Role } from '../common/constants.js';

class Observable {
    value;
    observers;

    constructor(value) {
        this.value = value;
        this.observers = [];
    }
    
    get() {
        return this.value;
    }
    
    set(value) {
        this.value = value;
        this.modified();
    }
    
    modified() {
        for(const observer of this.observers) {
            observer(this.value);
        }
    }
    
    addObserver(observer) {
        this.observers.push(observer);
    }
    
    removeObserver(observer) {
        var index = this.observers.indexOf(observer);
        if(index >= 0) this.observers.slice(index, 1);
    }
}

export const ServerData = {
    localProfile: null,
    editKey: -1,
    profiles: new Observable(new Map()),
    currentMap: new Observable(0),

    isGM: function() {
        return ServerData.localProfile && ServerData.localProfile.getRole() == Role.GM;
    }
}

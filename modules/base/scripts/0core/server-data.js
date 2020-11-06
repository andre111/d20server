class Observable {
    constructor(initialValue) {
        this.value = initialValue;
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
        for(var observer of this.observers) {
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
};

ServerData = {
    localProfile: null,
    profiles: new Observable(new Map()),
    currentMap: new Observable(0),
    
    isGM: function() {
        return ServerData.localProfile != null && ServerData.localProfile != undefined && ServerData.localProfile.role == Role.GM;
    }
};

ModuleManager = {
    _modules: [],
    
    registerModule(module) {
        ModuleManager._modules.push(module);
    },
    
    onEvent(type, event) {
        for(var module of ModuleManager._modules) {
            module.onEvent(type, event);
        }
    }
};

Access = {
    EVERYONE: "EVERYONE",
    CONTROLLING_PLAYER: "CONTROLLING_PLAYER",
    GM: "GM",
    SYSTEM: "SYSTEM",
    
    //TODO: can this be done better? - javascript does not really have enums
    matches: function(required, has) {
        if(required == Access.SYSTEM) return has == Access.SYSTEM;
        else if(required == Access.GM) return has == Access.SYSTEM || has == Access.GM;
        else if(required == Access.CONTROLLING_PLAYER) return has == Access.SYSTEM || has == Access.GM || has == Access.CONTROLLING_PLAYER;
        else return true;
    }
};

Effect = {
    NONE: "NONE",
    FOG: "FOG",
    RAIN_LIGHT: "RAIN_LIGHT",
    RAIN_HEAVY: "RAIN_HEAVY",
    RAIN_STORM: "RAIN_STORM",
    SNOW: "SNOW"
};

Layer = {
    BACKGROUND: "BACKGROUND",
    MAIN: "MAIN",
    GMOVERLAY: "GMOVERLAY"
};

Light = {
    DARK: "DARK",
    DIM: "DIM",
    BRIGHT: "BRIGHT",
    
    //TODO: can this be done better? - javascript does not really have enums
    isLess: function(required, has) {
        if(required == Light.DARK) return false;
        else if(required == Light.DIM) return has == Light.DARK;
        else if(required == Light.BRIGHT) return has == Light.DARK || has == Light.DIM;
    }
};

Type = {
    STRING: "STRING",
    LONG: "LONG",
    BOOLEAN: "BOOLEAN",
    DOUBLE: "DOUBLE",
    LONG_LIST: "LONG_LIST",
    STRING_MAP: "STRING_MAP",
    LAYER: "LAYER",
    LIGHT: "LIGHT",
    EFFECT: "EFFECT",
    COLOR: "COLOR",
    ACCESS: "ACCESS"
};

Role = {
    DEFAULT: "DEFAULT",
    GM: "GM"
};

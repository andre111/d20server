export class Context {
    profile;
    map;
    self;

    constructor(profile, map, self) {
        this.profile = profile;
        this.map = map;
        this.self = self;
    }
}

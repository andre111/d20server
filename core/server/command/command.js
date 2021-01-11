export class Command {
    name;
    aliases;

    constructor(name, aliases) {
        this.name = name;
        this.aliases = aliases;
    }

    execute(profile, args) { throw new Error('Cannot call abstract function'); }

    getName() {
        return this.name;
    }

    getAliases() {
        return this.aliases;
    }

    buildRecipents(sender, showPublic, showSelf) {
        var recipents = null;
        if(!showPublic) {
            if(showSelf) {
                recipents = [ sender.getID() ];
            } else {
                recipents = [ -1 ];
            }
        }
        return recipents;
    }
}

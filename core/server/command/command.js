export class Command {
    #name;
    #aliases;
    #requiresGM;

    constructor(name, aliases, requiresGM) {
        this.#name = name;
        this.#aliases = aliases;
        this.#requiresGM = requiresGM;
    }

    execute(profile, args) { throw new Error('Cannot call abstract function'); }

    getName() {
        return this.#name;
    }

    getAliases() {
        return this.#aliases;
    }

    requiresGM() {
        return this.#requiresGM;
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

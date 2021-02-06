export class CLICommand {
    name;

    constructor(name) {
        this.name = name;
    }

    getName() { 
        return this.name; 
    }
    
    getDescription() { throw new Error('Cannot call abstract function'); }
    getHelp() { throw new Error('Cannot call abstract function'); }

    execute(args) { throw new Error('Cannot call abstract function'); }
}

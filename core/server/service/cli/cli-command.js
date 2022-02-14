export class CLICommand {
    name;

    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getSplitter() {
        return '-'.repeat(process.stdout.columns);
    }

    getDescription() { throw new Error('Cannot call abstract function'); }
    getHelp() { throw new Error('Cannot call abstract function'); }

    execute(args) { throw new Error('Cannot call abstract function'); }
}

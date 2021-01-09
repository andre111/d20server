import { Variable } from "./variable.js";

export class TokenListVariable extends Variable {
    listName;
    hidden;
    tokenFinder;

    constructor(fullName, listName, hidden, tokenFinder) {
        super(fullName);

        this.listName = listName;
        this.hidden = hidden;
        this.tokenFinder = tokenFinder;
    }

    set(context, value) {
        //TODO...
    }

    get(context) {
        //TODO...
    }
}

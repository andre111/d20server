import { Variable } from "./variable.js";
import { TokenListUtils } from '../../util/token-list-util.js';

export class TokenListVariable extends Variable {
    hidden;
    tokenFinder;
    listFinder;

    constructor(fullName, hidden, tokenFinder, listFinder) {
        super(fullName);

        this.hidden = hidden;
        this.tokenFinder = tokenFinder;
        this.listFinder = listFinder;
    }

    set(context, value) {
        const token = this.tokenFinder.findEntity(context);
        const list = this.listFinder.findEntity(context);

        // check access
        const accessLevel = TokenListUtils.getAccessLevel(context.profile, list, token);
        if(!list.canEditWithAccess(accessLevel)) {
            throw new Error(`No edit access to ${this.getFullName()}`);
        }
        if(isNaN(Number(value))) {
            throw new Error(`Value is not a valid list entry: ${value}`);
        }

        //set
        TokenListUtils.addOrUpdateToken(context.profile, list, token, Number(value), this.hidden);
    }

    get(context) {
        const token = this.tokenFinder.findEntity(context);
        const list = this.listFinder.findEntity(context);

        // check access
        const accessLevel = TokenListUtils.getAccessLevel(context.profile, list, token);
        if(!list.canViewWithAccess(accessLevel)) {
            throw new Error(`No view access to ${this.getFullName()}`);
        }

        return TokenListUtils.getValue(list, token.getID());
    }
}

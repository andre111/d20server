import { Expression } from '../expression.js';
import { Result } from '../result.js';

// used for quick on the fly expression creation in parser
export class Expr extends Expression {
    func;

    constructor(func) {
        super();

        this.func = func;
    }

    eval(context) {
        return this.func(context);
    }
}

export const ZERO = new Expr(c => new Result(0, '0', []));
export const ONE = new Expr(c => new Result(1, '1', []));

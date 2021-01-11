export class Condition {
    type;
    expression;

    currentValue;

    constructor(type, expression) {
        this.type = type;
        this.expression = expression;
    }

    eval(context) {
        this.currentValue = this.expression.eval(context).getValue();
    }

    matches(input) {
        switch(this.type) {
        case Condition.Type.EQUAL:
            return input == this.currentValue;
        case Condition.Type.LESS_THAN:
            return input < this.currentValue;
        case Condition.Type.LESS_THAN_OR_EQUAL:
            return input <= this.currentValue;
        case Condition.Type.GREATER_THAN:
            return input > this.currentValue;
        case Condition.Type.GREATER_THAN_OR_EQUAL:
            return input >= this.currentValue;
        }
        return false;
    }

    static Type = {
		EQUAL: 'EQUAL',
		LESS_THAN: 'LESS_THAN',
		LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
		GREATER_THAN: 'GREATER_THAN',
		GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL'
    }
}

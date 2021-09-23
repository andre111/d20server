import { CanvasWindowInput } from './canvas-window-input.js';

export class CanvasWindowIntegerInput extends CanvasWindowInput {
    #allowRelative;

    constructor(parent, title, text, value, allowRelative, callback) {
        super(parent, title, text, value, callback);
        
        this.#allowRelative = allowRelative;

        // create html elements
        this.inputs[0].type = 'number';
        if(allowRelative) this.addInput('number', 0, 'input.relative', 'Relative Change: ', true);

        // size
        this.setDimensions(300, allowRelative ? 120 : 100);
        this.center();
    }

    onConfirm() {
        var newValue = parseInt(this.inputs[0].value);
        if(this.#allowRelative) newValue += parseInt(this.inputs[1].value);
        this.callback(newValue);
        this.close();
    }
}

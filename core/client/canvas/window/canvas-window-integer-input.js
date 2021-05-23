import { CanvasWindowInput } from './canvas-window-input.js';

export class CanvasWindowIntegerInput extends CanvasWindowInput {
    constructor(parent, title, text, value, allowRelative, callback) {
        super(parent, title, text, value, newValue => {
            if(newValue == null || newValue == undefined || newValue == '') return;
                                              
            const relative = allowRelative && (newValue.startsWith('+') || newValue.startsWith('-'));
            newValue = parseInt(newValue);
            if(newValue != NaN) {
                if(relative) newValue += value;
                callback(newValue);
            }
        });
    }
}

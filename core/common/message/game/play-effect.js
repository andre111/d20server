import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class PlayEffect extends Message {
    effect;
    parameters;

    x;
    y;
    rotation;
    scale;

    aboveOcclusion;
    focusCamera;

    constructor(effect, x, y, rotation, scale, aboveOcclusion, focusCamera, parameters) {
        super();
        this.effect = effect;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scale = scale;
        this.aboveOcclusion = aboveOcclusion;
        this.focusCamera = focusCamera;
        this.parameters = parameters;
    }

    getEffect() {
        return this.effect;
    }

    getParameters() {
        return this.parameters;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getRotation() {
        return this.rotation;
    }

    getScale() {
        return this.scale;
    }

    isAboveOcclusion() {
        return this.aboveOcclusion;
    }

    isFocusCamera() {
        return this.focusCamera;
    }

    requiresMap() {
        return true;
    }
}
registerType(PlayEffect);

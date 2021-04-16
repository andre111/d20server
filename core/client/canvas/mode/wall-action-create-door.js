import { WallActionCreate } from './wall-action-create.js';

export class WallActionCreateDoor extends WallActionCreate {
    constructor(mode) {
        super(mode, false, true, false);
    }
}

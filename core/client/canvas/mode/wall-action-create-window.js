import { WallActionCreate } from './wall-action-create.js';

export class WallActionCreateWindow extends WallActionCreate {
    constructor(mode) {
        super(mode, true, false);
    }
}

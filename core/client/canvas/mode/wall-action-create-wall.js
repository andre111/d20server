import { WallActionCreate } from './wall-action-create.js';

export class WallActionCreateWall extends WallActionCreate {
    constructor(mode) {
        super(mode, false, false);
    }
}

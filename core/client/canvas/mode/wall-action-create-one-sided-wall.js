import { WallActionCreate } from './wall-action-create.js';

export class WallActionCreateOneSidedWall extends WallActionCreate {
    constructor(mode) {
        super(mode, false, false, true);
    }
}

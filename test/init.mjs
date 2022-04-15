import { Common } from '../core/common/common.js';

export const mochaHooks = {
    beforeAll() {
        //TODO: create dummy id provider and entity manager class to correctly initializer the system
        Common.init(true, null, null);
    }
};

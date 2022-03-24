// @ts-check
import { Menu } from '../../gui/menu.js';
import { ServerData } from '../../server-data.js';

import { Events } from '../../../common/events.js';

export class EntityMenu extends Menu {
    constructor(mode, reference, isGM, x, y) {
        super(x, y);

        this.mode = mode;

        const event = Events.trigger('entityMenu', {
            menu: this,
            entityType: reference.getType(),
            reference: reference,
            accessLevel: reference.getAccessLevel(ServerData.localProfile),
            isGM: isGM
        }, true);

        if (event.canceled) {
            this.close();
        } else {
            this.open();
        }
    }
}

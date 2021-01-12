import { Menu } from '../../../gui/menu.js';

export class DirectoryMenu extends Menu {
    directory;

    constructor(directory, x, y) {
        super(x, y);

        this.directory = directory;

        for(const action of directory.getWindow().getDirectoryActions()) {
            if(action.shouldShowFor(directory)) {
                this.createItem(this.container, action.getName(), () => {
                    action.applyTo(directory);
                    this.close();
                });
            }
        }
        this.open();
    }
}

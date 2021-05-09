import { CanvasWindow } from '../canvas-window.js';
import { ServerData } from '../../server-data.js';
import { toFormatedSize } from '../../../common/util/datautil.js';

import { Directory } from './filemanager/directory.js';
import { File } from './filemanager/file.js';
import { DirectoryAction } from './filemanager/action/directory-action.js';
import { FileAction } from './filemanager/action/file-action.js';

import { FileActionSelect } from './filemanager/action/file-action-select.js';
import { FileActionRename } from './filemanager/action/file-action-rename.js';
import { FileActionDelete } from './filemanager/action/file-action-delete.js';
import { FileActionUpload } from './filemanager/action/file-action-upload.js';
import { DirectoryActionCreate } from './filemanager/action/directory-action-create.js';
import { DirectoryActionRename } from './filemanager/action/directory-action-rename.js';
import { DirectoryActionDelete } from './filemanager/action/directory-action-delete.js';
import { I18N } from '../../../common/util/i18n.js';

export function createDefaultFileManager(selectedPath) {
    return new CanvasWindowFilemanager(null, ServerData.isGM(), ServerData.editKey, ServerData.isGM() ? null : '/public', selectedPath);
}

export class CanvasWindowFilemanager extends CanvasWindow {
    // settings
    editable;
    key;
    forcedRoot;
    selectionCallback;
    startupPath;

    fileActions;
    directoryActions;

    // gui elements
    divStatus;

    divDirLoading;
    ulDirList;

    divFilesLoading;
    divFilesEmpty;
    divFilesSearchEmpty;
    ulFileList;
    
    inputOrder;
    inputSearch;

    // data
    directories = {};
    selectedDirectory = null;
    selectedFile = null;

    constructor(parent, editable, key, forcedRoot, startupPath) {
        super(parent, I18N.get('filemanager.title', 'File Manager'), true);

        this.editable = editable;
        this.key = key;
        this.forcedRoot = forcedRoot;
        this.startupPath = startupPath;

        this.fileActions = [];
        this.directoryActions = [];

        // register default actions
        if(editable) {
            this.registerEditActions();
        } else {
            this.registerBasicActions();
        }
        this.setDimensions(1100, 800);
        this.center();
    }

    init(selectionCallback) {
        this.selectionCallback = selectionCallback;

        var startupDir = '';
        if(this.startupPath && this.startupPath.trim() != '') {
            startupDir = this.startupPath.indexOf('/') >= 0 ? this.startupPath.substring(0, this.startupPath.lastIndexOf('/')) : this.startupPath;
        }

        this.createBaseHTML();
        this.loadDirectories(startupDir, this.startupPath);
        this.updateButtons();
    }

    createBaseHTML() {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.height = '100%';
        this.content.appendChild(table);

        // action buttons
        const actionRow = document.createElement('tr');
        actionRow.style.height = '64px';
        table.appendChild(actionRow);
        {
            const dirCell = document.createElement('td');
            actionRow.appendChild(dirCell);
            const dirActionPane = document.createElement('div')
            this.createDirActionHTML(dirActionPane);
            dirCell.appendChild(dirActionPane);

            const fileCell = document.createElement('td');
            actionRow.appendChild(fileCell);
            const fileActionPane = document.createElement('div');
            this.createFileActionHTML(fileActionPane);
            fileCell.appendChild(fileActionPane);
        }

        const mainRow = document.createElement('tr');
        table.appendChild(mainRow);
        {
            // directory list
            const dirCell = document.createElement('td');
            dirCell.style.width = '250px';
            mainRow.appendChild(dirCell);
            const dirPane = document.createElement('div');
            dirPane.style.width = '250px';
            dirPane.style.height = '100%';
            dirPane.style.overflow = 'auto';
            dirCell.appendChild(dirPane);
            this.createDirHTML(dirPane);

            // file list
            const fileCell = document.createElement('td');
            mainRow.appendChild(fileCell);
            const filePane = document.createElement('div');
            filePane.style.height = '100%';
            filePane.style.overflow = 'auto';
            fileCell.appendChild(filePane);
            this.createFileHTML(filePane);
        }

        // status line
        const statusRow = document.createElement('tr');
        statusRow.style.height = '32px';
        table.appendChild(statusRow);
        {
            const statusCell = document.createElement('td');
            statusCell.colSpan = 2;
            statusRow.appendChild(statusCell);
            statusCell.appendChild(this.divStatus = document.createElement('div'));
        }
    }

    createDirActionHTML(dirActionPane) {
        for(const action of this.directoryActions) {
            dirActionPane.appendChild(action.getButton());
            action.getButton().onclick = e => {
                if(this.getSelectedDirectory()) action.applyTo(this.getSelectedDirectory());
            };
        }
    }

    createDirHTML(dirPane) {
        // loading notice
        dirPane.appendChild(this.divDirLoading = document.createElement('div'));
        this.divDirLoading.innerHTML = '<span>'+I18N.get('filemanager.loaddirs', 'Loading directories...')+'</span><br><img src="/core/files/img/fileman/loading.gif" title="'+I18N.get('filemanager.loaddirs', 'Loading directories...')+'">';

        // actual directory list
        dirPane.appendChild(this.ulDirList = document.createElement('ul'));
        this.ulDirList.className = 'fileman-dirlist';
    }

    createFileActionHTML(fileActionPane) {
        for(const action of this.fileActions) {
            fileActionPane.appendChild(action.getButton());
            action.getButton().onclick = e => {
                if(this.getSelectedFile() || action.showWithoutFile()) action.applyTo(this.getSelectedFile());
            };
        }
        
        fileActionPane.appendChild(document.createElement('br'));

        const orderSpan = document.createElement('span');
        orderSpan.className = 'fileman-input-info';
        orderSpan.innerText = I18N.get('filemanager.order.by', 'Order by: ');
        fileActionPane.appendChild(orderSpan);
        this.inputOrder = document.createElement('select');
        const addOption = (value, name) => { const option = document.createElement('option'); option.value = value; option.innerHTML = name; this.inputOrder.appendChild(option); };
        addOption('nameASC', '&uarr;&nbsp;&nbsp;'+I18N.get('filemanager.order.name', 'Name'));
        addOption('nameDESC', '&darr;&nbsp;&nbsp;'+I18N.get('filemanager.order.name', 'Name'));
        addOption('sizeASC', '&uarr;&nbsp;&nbsp;'+I18N.get('filemanager.order.size', 'Size'));
        addOption('sizeDESC', '&darr;&nbsp;&nbsp;'+I18N.get('filemanager.order.size', 'Size'));
        addOption('timeASC', '&uarr;&nbsp;&nbsp;'+I18N.get('filemanager.order.modified', 'Last Modified'));
        addOption('timeDESC', '&darr;&nbsp;&nbsp;'+I18N.get('filemanager.order.modified', 'Last Modified'));
        this.inputOrder.onchange = () => this.selectDirectory(this.getSelectedDirectory(), false);
        fileActionPane.appendChild(this.inputOrder);

        const searchSpan = document.createElement('span');
        searchSpan.className = 'fileman-input-info';
        searchSpan.innerText = I18N.get('filemanager.search', 'Search: ');
        fileActionPane.appendChild(searchSpan);
        this.inputSearch = document.createElement('input');
        this.inputSearch.type = 'text';
        this.inputSearch.oninput = () => this.filterFiles();
        fileActionPane.appendChild(this.inputSearch);
    }

    createFileHTML(filePane) {
        // loading notice
        filePane.appendChild(this.divFilesLoading = document.createElement('div'));
        this.divFilesLoading.innerHTML = '<span>'+I18N.get('filemanager.loadfiles', 'Loading files...')+'</span><br><img src="/core/files/img/fileman/loading.gif" title="'+I18N.get('filemanager.loadfiles', 'Loading files...')+'">';
        this.divFilesLoading.style.display = 'none';

        // directory empty notice
        filePane.appendChild(this.divFilesEmpty = document.createElement('div'));
        this.divFilesEmpty.innerHTML = I18N.get('filemanager.status.empty', 'This directory is empty');
        this.divFilesEmpty.style.display = 'none';

        // search empty notice
        filePane.appendChild(this.divFilesSearchEmpty = document.createElement('div'));
        this.divFilesSearchEmpty.innerHTML = I18N.get('filemanager.status.nomatch', 'No files matching search');
        this.divFilesSearchEmpty.style.display = 'none';
        
        // actual file list
        filePane.appendChild(this.ulFileList = document.createElement('ul'));
        this.ulFileList.className = 'fileman-filelist';
    }

    loadDirectories(selectedDirectoryPath, selectedFilePath) {
        // clear old data
        this.ulDirList.innerHTML = '';
        this.divDirLoading.style.display = 'block';
        this.directories = {};

        // start loading
        const dirListURL = '/fileman/dirlist';
        $.ajax({
            url: dirListURL,
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: dirs => {
                // parse directories
                for(const dir of dirs) {
                    if(this.forcedRoot && !dir.p.startsWith(this.forcedRoot)) continue; // only include directories under forcedRoot if set

                    this.directories[dir.p] = new Directory(this, dir.p, dir.d, dir.f);
                }

                // create html
                for(const dir of Object.values(this.directories)) {
                    const parent = this.directories[dir.getParentPath()];
                    const parentElement = parent ? parent.getULChildren() : this.ulDirList;
                    if(parentElement != this.ulDirList) dir.getElement().style.display = 'none';

                    parentElement.appendChild(dir.getElement());
                }
                this.divDirLoading.style.display = 'none';

                // restore selection
                if(selectedDirectoryPath && this.directories[selectedDirectoryPath]) {
                    this.selectDirectory(this.directories[selectedDirectoryPath], false, selectedFilePath);
                }
            },
            error: data => {
                console.log('Error loading directories', data);
            }
        });
    }

    filterFiles() {
        const directory = this.getSelectedDirectory();
        if(!directory) return;
        if(directory.getFiles().length == 0) return;

        const selectedFile = this.getSelectedFile();

        // apply search
        const search = this.inputSearch.value.toLowerCase();
        var hadFile = false;
        for(const file of directory.getFiles()) {
            if(!search || search == '' || file.getName().toLowerCase().indexOf(search) >= 0) {
                file.getElementStyle().display = 'list-item';
                hadFile = true;
            } else {
                file.getElementStyle().display = 'none';
                if(selectedFile == file) this.selectFile(null);
            }
        }

        // show or hide 'no files found'
        this.divFilesSearchEmpty.style.display = hadFile ? 'none' : 'block';
    }

    updateButtons() {
        // update directory buttons
        const directory = this.getSelectedDirectory();
        for(const action of this.directoryActions) {
            const enabled = directory && action.shouldShowFor(directory);
            action.getButton().disabled = !enabled;
        }

        // update file buttons
        const file = this.getSelectedFile();
        for(const action of this.fileActions) {
            const enabled = (file && action.shouldShowFor(file)) || action.showWithoutFile();
            action.getButton().disabled = !enabled;
        }
    }

    canEdit() {
        return this.editable;
    }

    getKey() {
        return this.key;
    }

    // actions
    registerEditActions() {
        this.registerDirectoryAction(new DirectoryActionCreate(this));
        this.registerDirectoryAction(new DirectoryActionRename(this));
        this.registerDirectoryAction(new DirectoryActionDelete(this));
        //TODO... (move - would be a drag action)

        this.registerFileAction(new FileActionUpload(this));
        this.registerFileAction(new FileActionSelect(this));
        this.registerFileAction(new FileActionRename(this));
        this.registerFileAction(new FileActionDelete(this));
        //TODO... (copy, paste and move - would be a drag action)
    }

    registerBasicActions() {
        this.registerFileAction(new FileActionSelect(this));
    }

    registerDirectoryAction(action) {
        if(!(action instanceof DirectoryAction)) throw new Error('Can only register instances of DirectoryAction');
        this.directoryActions.push(action);
    }

    getDirectoryActions() {
        return this.directoryActions;
    }

    registerFileAction(action) {
        if(!(action instanceof FileAction)) throw new Error('Can only register instances of FileAction');
        this.fileActions.push(action);
    }

    getFileActions() {
        return this.fileActions;
    }

    // selection
    selectDirectory(directory, forceReload, selectedFilePath) {
        if(!(directory instanceof Directory)) return;
        if(directory.getWindow() != this) return;
        if(this.directories[directory.getPath()] != directory) return;

        // change style (and revert old selected style)
        if(this.selectedDirectory) {
            this.selectedDirectory.getDIVContainer().className = '';
        }
        directory.getDIVContainer().className = 'selected';
        
        // expand parents
        var parent = this.directories[directory.getParentPath()];
        while(parent) {
            parent.setExpanded(true);
            parent = this.directories[parent.getParentPath()];
        }

        // change status
        this.setStatus(I18N.get('filemanager.status.directory.path', 'Directory: ')+directory.getPath() + ' - '
            + I18N.get('filemanager.status.directory.dircount', 'Directories: ')+directory.getDirectoryCount() + ' '
            + I18N.get('filemanager.status.directory.filecount', 'Files: ')+directory.getFileCount());
        this.selectedDirectory = directory;
        this.updateButtons();

        // load files
        this.ulFileList.innerHTML = '';
        this.divFilesLoading.style.display = 'block';
        directory.loadFiles(forceReload, () => {
            if(this.selectedDirectory != directory) return; // selection changed before loading was done

            this.divFilesLoading.style.display = 'none';

            var selectedFile = directory.getSelectedFile();

            // create file elements
            if(directory.getFiles().length == 0) {
                this.divFilesEmpty.style.display = 'block';
            } else {
                this.divFilesEmpty.style.display = 'none';
                for(const file of directory.getFiles()) {
                    this.ulFileList.append(file.getElement());
                    if(selectedFilePath && file.getPath() == selectedFilePath) selectedFile = file;
                }
            }

            // restore file selection + search and order
            if(selectedFile) {
                this.selectFile(selectedFile, true);
            }
            this.filterFiles();
        });
    }

    getSelectedDirectory() {
        return this.selectedDirectory;
    }

    selectFile(file, scrollIntoView) {
        if(file && !(file instanceof File)) return;
        if(file && file.getWindow() != this) return;
        if(file && file.getDirectory() != this.selectedDirectory) return;
        if(!this.selectedDirectory) return;

        // change style (and revert old selected style)
        if(this.getSelectedFile()) {
            this.getSelectedFile().getElement().className = '';
        }
        if(file) file.getElement().className = 'selected';

        // change status
        if(file) this.setStatus(I18N.get('filemanager.status.file.path', 'File: ')+file.getPath() + ' - '
            + I18N.get('filemanager.status.file.size', 'Size: ')+toFormatedSize(file.getSize()) + ' - '
            + I18N.get('filemanager.status.file.modified', 'Last Modified: ')+dayjs.unix(file.getModified()).format('lll'));
        else this.setStatus('');

        // store selection, update buttons and make file visible
        this.selectedDirectory.setSelectedFile(file);
        this.updateButtons();
        if(file && scrollIntoView) file.getElement().scrollIntoView();
    }

    getSelectedFile() {
        return this.selectedDirectory ? this.selectedDirectory.getSelectedFile() : null;
    }

    confirmSelection() {
        if(this.selectionCallback) {
            this.selectionCallback(this.getSelectedFile());
        }
    }


    //
    setStatus(status) {
        this.divStatus.innerHTML = status;
    }
}

import fs from 'fs';
import { minify } from 'terser';
import CleanCSS from 'clean-css';

const DEST = './dist/';
const TERSER_OPTIONS = {
    module: true,
    compress: {},
    mangle: {},
    output: {},
    parse: {},
    rename: {}
};
const CLEAN_CSS_OPTIONS = {
};

// create destination directory
if (!fs.existsSync(DEST)) {
    fs.mkdirSync(DEST);
}

// copy package.json
fs.copyFileSync('./package.json', DEST + 'package.json');

// copy and process sources
async function processSources(sourceDirName) {
    const toProcess = [];
    toProcess.push(sourceDirName);

    while (toProcess.length > 0) {
        const fileName = toProcess.pop();
        const sourcePath = './' + fileName;
        const targetPath = DEST + fileName;

        //TODO: remove hardcoded exclude
        if (fileName == 'core/files/test') continue;

        console.log(fileName);
        if (fs.statSync(sourcePath).isDirectory()) {
            // process directory
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath);
            }

            const files = fs.readdirSync(sourcePath);
            for (const file of files) {
                toProcess.push(fileName + '/' + file);
            }
        } else {
            // process file
            if (fileName.endsWith('.js') && !fileName.includes('/libs/')) {
                fs.writeFileSync(targetPath, (await minify(fs.readFileSync(sourcePath, 'utf8'), TERSER_OPTIONS)).code);
            } else if (fileName.endsWith('.css') && !fileName.includes('/libs/')) {
                fs.writeFileSync(targetPath, new CleanCSS(CLEAN_CSS_OPTIONS).minify(fs.readFileSync(sourcePath, 'utf8')).styles);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }
}
processSources('core');
processSources('modules');
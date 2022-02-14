import fs from 'fs-extra';
import path from 'path';

import { Entity } from '../../../core/common/common.js';
import { Layer } from '../../../core/common/constants.js';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';

export class UniversalVTTImporter {
    static imageDir = './data/files/image/imported/';
    static lightFile = './modules/universalvtt_import/files/light.png'; //TODO: remove hardcoded path!!!

    static import(name, data, importLights) {
        // extract scale data
        const w = data.resolution.map_size.x;
        const h = data.resolution.map_size.y;
        const s = data.resolution.pixels_per_grid;

        // extract image
        const buffer = Buffer.from(data.image, 'base64');
        if (!fs.existsSync(UniversalVTTImporter.imageDir)) fs.mkdirsSync(UniversalVTTImporter.imageDir);
        fs.writeFileSync(path.join(UniversalVTTImporter.imageDir, name + '.png'), buffer);

        // create base map
        const map = new Entity('map');
        map.setString('name', name);
        map.setLong('width', w);
        map.setLong('height', h);
        map.setLong('gridSize', s);
        EntityManagers.get('map').add(map);

        // add background image token
        const bgToken = new Entity('token');
        bgToken.setString('imagePath', '/image/imported/' + name + '.png');
        bgToken.setLayer('layer', Layer.BACKGROUND);
        bgToken.setLong('width', w * s);
        bgToken.setLong('height', h * s);
        bgToken.setLong('x', w * s / 2);
        bgToken.setLong('y', h * s / 2);
        map.getContainedEntityManager('token').add(bgToken);

        // add walls
        for (const los of data.line_of_sight) {
            for (var i = 0; los[i + 1]; i++) {
                const x1 = los[i].x * s;
                const y1 = los[i].y * s;
                const x2 = los[i + 1].x * s;
                const y2 = los[i + 1].y * s;
                UniversalVTTImporter.createWall(map, x1, y1, x2, y2, false, false);
            }
        }

        // add doors and windows (portals)
        for (const portal of data.portals) {
            const x1 = portal.bounds[0].x * s;
            const y1 = portal.bounds[0].y * s;
            const x2 = portal.bounds[1].x * s;
            const y2 = portal.bounds[1].y * s;
            const seeThrough = !portal.closed;
            const door = portal.closed;
            UniversalVTTImporter.createWall(map, x1, y1, x2, y2, seeThrough, door);
        }

        // add lights
        if (importLights) {
            if (!fs.existsSync(path.join(UniversalVTTImporter.imageDir, 'light.png'))) {
                fs.copyFileSync(UniversalVTTImporter.lightFile, path.join(UniversalVTTImporter.imageDir, 'light.png'));
            }
            for (const light of data.lights) {
                const lightToken = new Entity('token');
                lightToken.setString('imagePath', '/image/imported/light.png');
                lightToken.setLayer('layer', Layer.GMOVERLAY);
                lightToken.setLong('width', s);
                lightToken.setLong('height', s);
                lightToken.setLong('x', light.position.x * s);
                lightToken.setLong('y', light.position.y * s);
                lightToken.setDouble('lightBright', light.range);
                lightToken.setDouble('lightDim', light.range * 2);
                lightToken.setColor('lightColor', '#' + light.color.substring(2));
                //TODO: light intensity?
                map.getContainedEntityManager('token').add(lightToken);
            }
        }
    }

    static createWall(map, x1, y1, x2, y2, seeThrough, door) {
        const wall = new Entity('wall');
        wall.setLong('x1', x1);
        wall.setLong('y1', y1);
        wall.setLong('x2', x2);
        wall.setLong('y2', y2);
        wall.setBoolean('seeThrough', seeThrough);
        wall.setBoolean('door', door);
        map.getContainedEntityManager('wall').add(wall);
    }
}

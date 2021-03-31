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
        if(!fs.existsSync(UniversalVTTImporter.imageDir)) fs.mkdirsSync(UniversalVTTImporter.imageDir);
        fs.writeFileSync(path.join(UniversalVTTImporter.imageDir, name+'.png'), buffer);

        // create base map
        const map = new Entity('map');
        map.prop('name').setString(name);
        map.prop('width').setLong(w);
        map.prop('height').setLong(h);
        map.prop('gridSize').setLong(s);
        EntityManagers.get('map').add(map);

        // add background image token
        const bgToken = new Entity('token');
        bgToken.prop('map').setLong(map.getID());
        bgToken.prop('imagePath').setString('/image/imported/'+name+'.png');
        bgToken.prop('layer').setLayer(Layer.BACKGROUND);
        bgToken.prop('width').setLong(w * s);
        bgToken.prop('height').setLong(h * s);
        bgToken.prop('x').setLong(w * s / 2);
        bgToken.prop('y').setLong(h * s / 2);
        EntityManagers.get('token').add(bgToken);

        // add walls
        for(const los of data.line_of_sight) {
            for(var i=0; los[i+1]; i++) {
                const x1 = los[i].x * s;
                const y1 = los[i].y * s;
                const x2 = los[i+1].x * s;
                const y2 = los[i+1].y * s;
                UniversalVTTImporter.createWall(map, x1, y1, x2, y2, false, false);
            }
        }

        // add doors and windows (portals)
        for(const portal of data.portals) {
            const x1 = portal.bounds[0].x * s;
            const y1 = portal.bounds[0].y * s;
            const x2 = portal.bounds[1].x * s;
            const y2 = portal.bounds[1].y * s;
            const seeThrough = !portal.closed;
            const door = portal.closed;
            UniversalVTTImporter.createWall(map, x1, y1, x2, y2, seeThrough, door);
        }

        // add lights
        if(importLights) {
            if(!fs.existsSync(path.join(UniversalVTTImporter.imageDir, 'light.png'))) {
                fs.copyFileSync(UniversalVTTImporter.lightFile, path.join(UniversalVTTImporter.imageDir, 'light.png')); 
            }
            for(const light of data.lights) {
                const lightToken = new Entity('token');
                lightToken.prop('map').setLong(map.getID());
                lightToken.prop('imagePath').setString('/image/imported/light.png');
                lightToken.prop('layer').setLayer(Layer.GMOVERLAY);
                lightToken.prop('width').setLong(s);
                lightToken.prop('height').setLong(s);
                lightToken.prop('x').setLong(light.position.x * s);
                lightToken.prop('y').setLong(light.position.y * s);
                lightToken.prop('lightBright').setDouble(light.range);
                lightToken.prop('lightDim').setDouble(light.range * 2);
                lightToken.prop('lightColor').setColor('#'+light.color.substring(2));
                //TODO: light intensity?
                EntityManagers.get('token').add(lightToken);
            }
        }
    }

    static createWall(map, x1, y1, x2, y2, seeThrough, door) {
        const wall = new Entity('wall');
        wall.prop('map').setLong(map.getID());
        wall.prop('x1').setLong(x1);
        wall.prop('y1').setLong(y1);
        wall.prop('x2').setLong(x2);
        wall.prop('y2').setLong(y2);
        wall.prop('seeThrough').setBoolean(seeThrough);
        wall.prop('door').setBoolean(door);
        EntityManagers.get('wall').add(wall);
    }
}

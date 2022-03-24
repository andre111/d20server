// @ts-check
import { Measurements } from '../../measurements.js';

import { CanvasRenderLayer } from '../../../../../core/client/canvas/canvas-renderlayer.js';
import { ServerData } from '../../../../../core/client/server-data.js';

import { IntMathUtils } from '../../../../../core/common/util/mathutil.js';
import { I18N } from '../../../../../core/common/util/i18n.js';

export class CanvasRenderLayerMeasurements extends CanvasRenderLayer {
    constructor(level) {
        super();

        this.level = level;

        this.coneAngle = 60 * Math.PI / 180;
    }

    render(ctx, state, view, viewers, camera, viewport, map) {
        const gridSize = map.getLong('gridSize');

        for (const [profile, measurement] of Measurements) {
            if (measurement.map != ServerData.currentMap) continue;

            const color = '#' + (ServerData.profiles.get(profile).getColor() & 0x00FFFFFF).toString(16).padStart(6, '0');
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;

            if (measurement.x1 != undefined && measurement.y1 != undefined && measurement.x2 != undefined && measurement.y2 != undefined) {
                // calculate measurement values
                var length = Math.sqrt((measurement.x2 - measurement.x1) * (measurement.x2 - measurement.x1) + (measurement.y2 - measurement.y1) * (measurement.y2 - measurement.y1));
                var lengthCells = length / gridSize;
                var lengthMeters = lengthCells * 1.5;
                var angle = -Math.atan2(measurement.x2 - measurement.x1, measurement.y2 - measurement.y1) + Math.PI / 2;

                // draw affected cells
                ctx.globalAlpha = 0.2;
                var bb = this.getMeasurementBB(measurement, length, angle);
                for (var xcell = Math.floor(bb.xmin / gridSize) - 1; xcell <= Math.ceil(bb.xmax / gridSize) + 1; xcell++) {
                    for (var ycell = Math.floor(bb.ymin / gridSize) - 1; ycell <= Math.ceil(bb.ymax / gridSize) + 1; ycell++) {
                        if (this.isInsideMeasurement(xcell * gridSize + gridSize / 2, ycell * gridSize + gridSize / 2, measurement, length, angle, gridSize)) {
                            ctx.fillRect(xcell * gridSize, ycell * gridSize, gridSize, gridSize);
                        }
                    }
                }
                ctx.globalAlpha = 1;

                // draw 'outline'
                if (measurement.type == 'CIRCLE') {
                    ctx.beginPath();
                    ctx.arc(measurement.x1, measurement.y1, length, 0, 2 * Math.PI);
                    ctx.stroke();
                } else if (measurement.type == 'CONE') {
                    ctx.beginPath();
                    ctx.arc(measurement.x1, measurement.y1, length, angle - this.coneAngle / 2, angle + this.coneAngle / 2);

                    ctx.moveTo(measurement.x1, measurement.y1);
                    ctx.lineTo(measurement.x1 + length * Math.cos(angle - this.coneAngle / 2), measurement.y1 + length * Math.sin(angle - this.coneAngle / 2));

                    ctx.moveTo(measurement.x1, measurement.y1);
                    ctx.lineTo(measurement.x1 + length * Math.cos(angle + this.coneAngle / 2), measurement.y1 + length * Math.sin(angle + this.coneAngle / 2));
                    ctx.stroke();
                }

                // draw connecting line
                ctx.beginPath();
                ctx.moveTo(measurement.x1, measurement.y1);
                ctx.lineTo(measurement.x2, measurement.y2);
                ctx.stroke();

                // draw length information
                ctx.save();
                ctx.translate(measurement.x1, measurement.y1);
                ctx.rotate(angle);
                ctx.fillText(I18N.get('measurement', 'Distance: %0 cells - %1m', lengthCells.toFixed(1), lengthMeters.toFixed(2)), length / 2 - 70, 16);
                ctx.restore();
            }

            // draw end points
            var size = 16;
            ctx.fillStyle = color;
            if (measurement.x1 != undefined && measurement.y1 != undefined) ctx.fillRect(measurement.x1 - size / 2, measurement.y1 - size / 2, size, size);
            if (measurement.x2 != undefined && measurement.y2 != undefined) ctx.fillRect(measurement.x2 - size / 2, measurement.y2 - size / 2, size, size);
        }
    }

    getLevel() {
        return this.level;
    }

    getMeasurementBB(measurement, length, angle) {
        if (measurement.type == 'LINE') {
            return {
                xmin: Math.min(measurement.x1, measurement.x2),
                ymin: Math.min(measurement.y1, measurement.y2),
                xmax: Math.max(measurement.x1, measurement.x2),
                ymax: Math.max(measurement.y1, measurement.y2)
            };
        } else if (measurement.type == 'CIRCLE' || measurement.type == 'CONE') {
            return {
                xmin: measurement.x1 - length,
                ymin: measurement.y1 - length,
                xmax: measurement.x1 + length,
                ymax: measurement.y1 + length
            }
        }
    }

    isInsideMeasurement(x, y, measurement, length, angle, gridSize) {
        // calculate if cell with center on x, y is affected
        if (measurement.type == 'LINE') {
            var distSQ = IntMathUtils.getDistanceSQTo(measurement.x1, measurement.y1, measurement.x2, measurement.y2, x, y);
            return distSQ <= (gridSize / 2) * (gridSize / 2);
        } else if (measurement.type == 'CIRCLE') {
            var distSQ = (x - measurement.x1) * (x - measurement.x1) + (y - measurement.y1) * (y - measurement.y1);
            return distSQ <= length * length;
        } else if (measurement.type == 'CONE') {
            var distSQ = (x - measurement.x1) * (x - measurement.x1) + (y - measurement.y1) * (y - measurement.y1);
            var cellAngle = -Math.atan2(x - measurement.x1, y - measurement.y1) + Math.PI / 2;
            var angleDiff = angle - cellAngle;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            return distSQ <= length * length && Math.abs(angleDiff) <= this.coneAngle / 2;
        }
        return false;
    }
}

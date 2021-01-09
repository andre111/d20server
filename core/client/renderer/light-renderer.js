import { MapUtils } from '../util/maputil.js';
import { RenderUtils } from '../util/renderutil.js';
import { FOWRenderer } from './fow-renderer.js';
import { WallRenderer } from './wall-renderer.js';

import { Light, Infinite } from '../../common/constants.js';
import { Rect } from '../../common/util/rect.js';
import { IntMathUtils } from '../../common/util/mathutil.js';

let {applyToPoint} = window.TransformationMatrix;

class LightWallCache {
    constructor(clip, lightX, lightY, lightRadius) {
        this.clip = clip;
        this.lightX = lightX;
        this.lightY = lightY;
        this.lightRadius = lightRadius;
    }
    
    isCompatible(lightX, lightY, lightRadius) {
        return this.lightX == lightX && this.lightY == lightY && this.lightRadius>=lightRadius;
    }
}

export const LightRenderer = {
    _mainBuffer: null,
    _lightBuffer1: null,
    _lightBuffer2: null,
    
    _mainCtx: null,
    _lightCtx1: null,
    _lightCtx2: null,
    
    init: function() {
        LightRenderer._mainBuffer = document.createElement('canvas');
        LightRenderer._lightBuffer1 = document.createElement('canvas');
        LightRenderer._lightBuffer2 = document.createElement('canvas');
        
        LightRenderer._mainCtx = LightRenderer._mainBuffer.getContext('2d');
        LightRenderer._lightCtx1 = LightRenderer._lightBuffer1.getContext('2d');
        LightRenderer._lightCtx2 = LightRenderer._lightBuffer2.getContext('2d');
    },
    
    renderLight: function(ctx, screenWidth, screenHeight, transform, viewport, map, viewers) {
        // (re)create buffers if needed
        if(LightRenderer._mainBuffer == null) {
            LightRenderer.init();
        }
        if(LightRenderer._mainBuffer.width < screenWidth) LightRenderer._mainBuffer.width = screenWidth;
        if(LightRenderer._mainBuffer.height < screenHeight) LightRenderer._mainBuffer.height = screenHeight;
        if(LightRenderer._lightBuffer1.width < screenWidth) LightRenderer._lightBuffer1.width = screenWidth;
        if(LightRenderer._lightBuffer1.height < screenHeight) LightRenderer._lightBuffer1.height = screenHeight;
        if(LightRenderer._lightBuffer2.width < screenWidth) LightRenderer._lightBuffer2.width = screenWidth;
        if(LightRenderer._lightBuffer2.height < screenHeight) LightRenderer._lightBuffer2.height = screenHeight;
        
		// prepare buffer and render light levels
        LightRenderer._mainCtx.save();
        LightRenderer._mainCtx.setTransform(1, 0, 0, 1, 0, 0); // identity
        LightRenderer._mainCtx.globalCompositeOperation = 'source-over';
        LightRenderer._mainCtx.fillStyle = 'black';
        LightRenderer._mainCtx.fillRect(0, 0, screenWidth, screenHeight);
        LightRenderer._mainCtx.globalCompositeOperation = 'lighter';
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.BRIGHT, null, viewers);
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.DIM, 'rgba(0, 0, 0, 0.59)', viewers);
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.DARK, 'rgba(0, 0, 0, 0.78)', viewers);
        LightRenderer._mainCtx.restore();
        
        // render to screen
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx.globalCompositeOperation = 'multiply'; // NOTE: comment this line out to view the current light buffer for debugging
        ctx.drawImage(LightRenderer._mainBuffer, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    },
    
    _renderLight: function(ctx, screenWidth, screenHeight, transform, viewport, map, light, overlay, viewers) {
        // shortcut for zero sight
        var hasSight = false;
		for(var viewer of viewers) {
			if(LightRenderer.getSight(viewer, light) > 0) {
				hasSight = true;
				break;
			}
		}
		if(!hasSight) {
			return;
		}
        
        // prepare buffer
        var needsRender = false;
        var ctx1 = LightRenderer._lightCtx1;
        if(Light.isLess(light, map.prop('light').getLight())) {
            ctx1.fillStyle = 'black';
            needsRender = true;
        } else {
            ctx1.fillStyle = 'white';
        }
        ctx1.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx1.fillRect(0, 0, screenWidth, screenHeight);
        
        // render lights
        if(Light.isLess(light, map.prop('light').getLight())) {
            ctx1.globalCompositeOperation = 'lighter';
            ctx1.setTransform(transform);
            
            MapUtils.currentEntities('token').forEach(token => {
				var centerX = token.prop('x').getLong();
				var centerY = token.prop('y').getLong();
                var maxLightRadius = Math.trunc(LightRenderer.getLight(token, light) * map.prop('gridSize').getLong());
				var lightRadius = Math.trunc(maxLightRadius * (1 - (token.prop('lightFlicker').getBoolean() ? 0.025*Math.random() : 0)));
                // skip lights that are outside of the viewport
				if(lightRadius > 0 && IntMathUtils.doAABBCircleIntersect(viewport.x, viewport.y, viewport.x+viewport.width, viewport.y+viewport.height, centerX, centerY, lightRadius)) {
                    var lightViewport = new Rect(centerX-maxLightRadius-1, centerY-maxLightRadius-1, maxLightRadius*2+2, maxLightRadius*2+2);
					
					if(map.prop('wallsBlockLight').getBoolean() && WallRenderer.hasToRenderWalls(MapUtils.currentEntities('wall'), lightViewport, token)) {
                        // get wall clip (with cached data whenever possible)
                        var cached = LightRenderer.getLightWallCache(token, light, centerX, centerY, maxLightRadius, lightViewport);
                        
						// draw light (with clip)
						LightRenderer.paintLight(ctx1, token, cached, true, centerX, centerY, lightRadius);
					} else {
						// draw light
						LightRenderer.paintLight(ctx1, token, null, false, centerX, centerY, lightRadius);
					}
                }
            }).value();
        }
        
        // render sight (directly when a single viewer is present, with extra buffer otherwise)
        ctx1.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx1.globalCompositeOperation = 'multiply';
        if(viewers.length == 1) {
            var sight = LightRenderer.getSight(viewers[0], light);
            if(sight != Infinite && !Number.isFinite(sight) && sight < 10000) {
                var sightRadius = sight * map.prop('gridSize').getLong();
                if(sightRadius > 0) {
                    var viewerPos = applyToPoint(transform, { x: viewers[0].prop('x').getLong(), y: viewers[0].prop('y').getLong() });
                    var grd = ctx1.createRadialGradient(viewerPos.x, viewerPos.y, 1, viewerPos.x, viewerPos.y, sightRadius * transform.a);
                    grd.addColorStop(0, 'white');
                    grd.addColorStop(0.5, 'white');
                    grd.addColorStop(1, 'black');
                    ctx1.fillStyle = grd;
                    ctx1.fillRect(0, 0, screenWidth, screenHeight);
                }
                needsRender = true;
            }
        } else {
            var ctx2 = LightRenderer._lightCtx2;
            ctx2.save();
            ctx2.setTransform(1, 0, 0, 1, 0, 0); // identity
            ctx2.fillStyle = 'black';
            ctx2.fillRect(0, 0, screenWidth, screenHeight);
            ctx2.globalCompositeOperation = 'lighter';
            
            for(var viewer of viewers) {
                var sight = LightRenderer.getSight(viewer, light);
                if(sight != Infinite && !Number.isFinite(sight) && sight < 10000) {
                    var sightRadius = sight * map.prop('gridSize').getLong();
                    if(sightRadius > 0) {
                        var viewerPos = applyToPoint(transform, { x: viewer.prop('x').getLong(), y: viewer.prop('y').getLong() });
                        var grd = ctx2.createRadialGradient(viewerPos.x, viewerPos.y, 1, viewerPos.x, viewerPos.y, sightRadius * transform.a);
                        grd.addColorStop(0, 'white');
                        grd.addColorStop(0.5, 'white');
                        grd.addColorStop(1, 'black');
                        ctx2.fillStyle = grd;
                        ctx2.fillRect(0, 0, screenWidth, screenHeight);
                    }
                } else {
                    ctx2.fillStyle = 'white';
                    ctx2.fillRect(0, 0, screenWidth, screenHeight);
                    break;
                }
            }
            
            ctx2.restore();
            ctx1.drawImage(LightRenderer._lightBuffer2, 0, 0);
            needsRender = true;
        }
        
        // finish render
        if(needsRender && overlay != null) {
            ctx1.fillStyle = overlay;
            ctx1.globalCompositeOperation = 'source-over';
            ctx1.fillRect(0, 0, screenWidth, screenHeight);
        }
        
        // render to buffer
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(LightRenderer._lightBuffer1, 0, 0);
    },
    
    paintLight: function(ctx1, token, cached, withClip, centerX, centerY, lightRadius) {
        // calculate light angles (TODO: untested)
        var lightAngle = token.prop('lightAngle').getLong();
        var startAngle = 0;
        var endAngle = Math.PI*2;
        if(lightAngle < 360 && lightAngle > 0) {
            startAngle = -(token.prop('rotation').getDouble()-lightAngle/2) * Math.PI / 180;
            endAngle = -(token.prop('rotation').getDouble()+lightAngle/2) * Math.PI / 180;
        }
        
        // calculate gradient (TODO: fade modifies color, can I fade to the same color but with no alpha?)
        var color = token.prop('lightColor').getColor();
        var grd = ctx1.createRadialGradient(centerX, centerY, 1, centerX, centerY, lightRadius);
        grd.addColorStop(0, color);
        grd.addColorStop(0.5, color);
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // paint
        ctx1.save();
        ctx1.fillStyle = grd;
        if(withClip) { 
            RenderUtils.addPaths(ctx1, cached.clip);
            ctx1.clip();
        }
        ctx1.beginPath();
        ctx1.ellipse(centerX, centerY, lightRadius, lightRadius, 0, startAngle, endAngle);
        ctx1.fill();
        ctx1.restore();
    },
    
    _cache: {
        DIM: new Map(),
        BRIGHT: new Map()
    },
    getLightWallCache: function(token, light, centerX, centerY, maxLightRadius, lightViewport) {
        var cached = LightRenderer._cache[light].get(token.id);
        if(cached == null || cached == undefined || !cached.isCompatible(centerX, centerY, maxLightRadius)) {
            var pwr =  WallRenderer.calculateWalls(MapUtils.currentEntities('wall').value(), lightViewport, [token]);
            var clip = FOWRenderer.calculateSeenArea(pwr, lightViewport);
            cached = new LightWallCache(clip, centerX, centerY, maxLightRadius);
            LightRenderer._cache[light].set(token.id, cached);
            console.log('Updated light cache for '+token.id);
        }
        return cached;
    },
    
    //TODO: These two methods do not follow the Pathfinder rules correctly
    getLight: function(token, light) {
        if(light == Light.BRIGHT) {
			return token.prop('lightBright').getDouble();
		} else if(light == Light.DIM) {
			return token.prop('lightDim').getDouble();
		} else {
			return 0;
		}
    },
    getSight: function(token, light) {
        if(light == Light.BRIGHT) {
			return token.prop('sightBright').getDouble();
		} else if(light == Light.DIM) {
			return token.prop('sightDim').getDouble();
		} else {
			return token.prop('sightDark').getDouble();
		}
    }
}

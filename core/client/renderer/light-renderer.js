import { MapUtils } from '../util/maputil.js';
import { RenderUtils } from '../util/renderutil.js';
import { FOWRenderer } from './fow-renderer.js';
import { WallRenderer } from './wall-renderer.js';

import { Light, Infinite } from '../../common/constants.js';
import { Rect } from '../../common/util/rect.js';
import { IntMathUtils } from '../../common/util/mathutil.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { TokenUtil } from '../../common/util/tokenutil.js';

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
        
        LightRenderer._mainCtx = LightRenderer._mainBuffer.getContext('2d', { alpha: false });
        LightRenderer._lightCtx1 = LightRenderer._lightBuffer1.getContext('2d', { alpha: false });
        LightRenderer._lightCtx2 = LightRenderer._lightBuffer2.getContext('2d', { alpha: false });

        EntityManagers.get('wall').addListener(() => LightRenderer.invalidateCache());
    },
    
    renderLight: function(ctx, screenWidth, screenHeight, transform, viewport, map, viewers, tokens) {
        // adjust buffer sizes if needed
        if(LightRenderer._mainBuffer.width < screenWidth) LightRenderer._mainBuffer.width = screenWidth;
        if(LightRenderer._mainBuffer.height < screenHeight) LightRenderer._mainBuffer.height = screenHeight;
        if(LightRenderer._lightBuffer1.width < screenWidth) LightRenderer._lightBuffer1.width = screenWidth;
        if(LightRenderer._lightBuffer1.height < screenHeight) LightRenderer._lightBuffer1.height = screenHeight;
        if(LightRenderer._lightBuffer2.width < screenWidth) LightRenderer._lightBuffer2.width = screenWidth;
        if(LightRenderer._lightBuffer2.height < screenHeight) LightRenderer._lightBuffer2.height = screenHeight;
        
		// prepare buffer and render light levels
        LightRenderer._mainCtx.setTransform(1, 0, 0, 1, 0, 0); // identity
        LightRenderer._mainCtx.globalCompositeOperation = 'source-over';
        LightRenderer._mainCtx.fillStyle = 'black';
        LightRenderer._mainCtx.fillRect(0, 0, screenWidth, screenHeight);
        LightRenderer._mainCtx.globalCompositeOperation = 'lighter';
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.BRIGHT, null, viewers, tokens);
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.DIM, 'rgba(0, 0, 0, 0.59)', viewers, tokens);
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.DARK, 'rgba(0, 0, 0, 0.78)', viewers, tokens);
        
        // render to screen
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx.globalCompositeOperation = 'multiply'; // NOTE: comment this line out to view the current light buffer for debugging
        ctx.drawImage(LightRenderer._mainBuffer, 0, 0);
        ctx.restore();
    },
    
    _renderLight: function(ctx, screenWidth, screenHeight, transform, viewport, map, light, overlay, viewers, tokens) {
        // shortcut for zero sight and multiplier detection
        // TODO: note that combining multiple viewers can have some parts visible that should not be
        // but I think the only way to solve this would be to render each viewers sight/light sepperately which is expensive
        var hasSight = false;
        var multiplier = 0;
		for(const viewer of viewers) {
            const actor = TokenUtil.getActor(viewer);
			if(LightRenderer.getSight(actor, light) > 0) {
				hasSight = true;
            }
            const viewerMultiplier = LightRenderer.getLightMultiplier(actor, light);
            if(viewerMultiplier > multiplier) multiplier = viewerMultiplier;
		}
		if(!hasSight || multiplier <= 0) {
			return;
		}
        
        // prepare buffer
        var ctx1 = LightRenderer._lightCtx1;
        if(Light.isLess(light, map.prop('light').getLight())) {
            ctx1.fillStyle = 'black';
        } else {
            ctx1.fillStyle = 'white';
        }
        ctx1.globalCompositeOperation = 'source-over';
        ctx1.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx1.fillRect(0, 0, screenWidth, screenHeight);
        
        // render lights
        if(Light.isLess(light, map.prop('light').getLight())) {
            ctx1.globalCompositeOperation = 'lighter';
            ctx1.setTransform(transform);
            
            for(const token of tokens) {
				const centerX = token.prop('x').getLong();
				const centerY = token.prop('y').getLong();
                const maxLightRadius = Math.trunc(LightRenderer.getLight(token, light) * map.prop('gridSize').getLong()) * multiplier;
				const lightRadius = Math.trunc(maxLightRadius * (1 - (token.prop('lightFlicker').getBoolean() ? 0.025*Math.random() : 0)));
                // only render lights that are inside of the viewport
				if(lightRadius > 0 && IntMathUtils.doAABBCircleIntersect(viewport.x, viewport.y, viewport.x+viewport.width, viewport.y+viewport.height, centerX, centerY, lightRadius)) {
                    const lightViewport = new Rect(centerX-maxLightRadius-1, centerY-maxLightRadius-1, maxLightRadius*2+2, maxLightRadius*2+2);
					
                    // get wall clip (with cached data whenever possible)
                    const cached = LightRenderer.getLightWallCache(token, light, centerX, centerY, maxLightRadius, lightViewport);
                    
                    // draw light (with clip)
                    LightRenderer.paintLight(ctx1, token, cached, true, centerX, centerY, lightRadius);
                }
            }
        }
        
        // render sight (directly when a single viewer is present, with extra buffer otherwise)
        ctx1.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx1.globalCompositeOperation = 'multiply';
        if(viewers.length == 1) {
            LightRenderer.paintSight(ctx1, screenWidth, screenHeight, transform, viewers[0], light, map);
        } else {
            var ctx2 = LightRenderer._lightCtx2;
            ctx2.save();
            ctx2.setTransform(1, 0, 0, 1, 0, 0); // identity
            ctx2.fillStyle = 'black';
            ctx2.fillRect(0, 0, screenWidth, screenHeight);
            ctx2.globalCompositeOperation = 'lighter';
            
            for(const viewer of viewers) {
                if(!LightRenderer.paintSight(ctx2, screenWidth, screenHeight, transform, viewer, light, map)) {
                    ctx2.fillStyle = 'white';
                    ctx2.fillRect(0, 0, screenWidth, screenHeight);
                    break;
                }
            }
            
            ctx2.restore();
            ctx1.drawImage(LightRenderer._lightBuffer2, 0, 0);
        }
        
        // finish render
        if(overlay != null) {
            ctx1.fillStyle = overlay;
            ctx1.globalCompositeOperation = 'source-over';
            ctx1.fillRect(0, 0, screenWidth, screenHeight);
        }
        
        // render to buffer
        ctx.drawImage(LightRenderer._lightBuffer1, 0, 0);
    },
    
    paintLight: function(ctx1, token, cached, withClip, centerX, centerY, lightRadius) {
        // calculate gradient
        const color = token.prop('lightColor').getColor();
        const grd = ctx1.createRadialGradient(centerX, centerY, 1, centerX, centerY, lightRadius);
        grd.addColorStop(0, color);
        grd.addColorStop(0.5, color);
        grd.addColorStop(1, color+'00');
        
        // paint
        ctx1.save();
        ctx1.fillStyle = grd;
        if(withClip) { 
            RenderUtils.addPaths(ctx1, cached.clip);
            ctx1.clip();
        }

        ctx1.beginPath();
        const lightAngle = token.prop('lightAngle').getLong();
        if(lightAngle <= 0 || lightAngle >= 360) {
            ctx1.ellipse(centerX, centerY, lightRadius, lightRadius, 0, 0, Math.PI*2);
        } else {
            // calculate light angles
            const startAngle = (token.prop('rotation').getDouble()+90-lightAngle/2) * Math.PI / 180;
            const endAngle = (token.prop('rotation').getDouble()+90+lightAngle/2) * Math.PI / 180;
            
            ctx1.arc(centerX, centerY, lightRadius, startAngle, endAngle);
            ctx1.lineTo(centerX, centerY);
        }
        ctx1.fill();
        ctx1.restore();
    },

    // return true if sight was limited, false otherwise (infinite sight)
    paintSight: function(ctx, screenWidth, screenHeight, transform, viewer, light, map) {
        const sight = LightRenderer.getSight(TokenUtil.getActor(viewer), light);
        if(sight < 10000) {
            const sightRadius = sight * map.prop('gridSize').getLong();
            if(sightRadius > 0) {
                const viewerPos = applyToPoint(transform, { x: viewer.prop('x').getLong(), y: viewer.prop('y').getLong() });
                const grd = ctx.createRadialGradient(viewerPos.x, viewerPos.y, 1, viewerPos.x, viewerPos.y, sightRadius * transform.a);
                grd.addColorStop(0, 'white');
                grd.addColorStop(0.5, 'white');
                grd.addColorStop(1, 'black');
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, screenWidth, screenHeight);
            }
            return true;
        } else {
            return false;
        }
    },
    
    _cache: {
        DIM: new Map(),
        BRIGHT: new Map()
    },
    getLightWallCache: function(token, light, centerX, centerY, maxLightRadius, lightViewport) {
        var cached = LightRenderer._cache[light].get(token.getID());
        if(cached == null || cached == undefined || !cached.isCompatible(centerX, centerY, maxLightRadius)) {
            var pwr =  WallRenderer.calculateCombinedOccolusion(MapUtils.currentEntities('wall'), token.prop('x').getLong(), token.prop('y').getLong(), lightViewport);
            var clip = FOWRenderer.calculateSeenArea(pwr, lightViewport);
            cached = new LightWallCache(clip, centerX, centerY, maxLightRadius);
            LightRenderer._cache[light].set(token.getID(), cached);
            console.log('Updated light cache for '+token.getID());
        }
        return cached;
    },
    invalidateCache: function() {
        LightRenderer._cache.DIM.clear();
        LightRenderer._cache.BRIGHT.clear();
    },
    
    getLight: function(token, light) {
        if(light == Light.BRIGHT) {
			return token.prop('lightBright').getDouble();
		} else if(light == Light.DIM) {
			return token.prop('lightDim').getDouble();
		} else {
			return 0;
		}
    },

    getLightMultiplier(actor, light) {
        if(!actor) return 0;

        if(light == Light.BRIGHT) {
			return actor.prop('lightBrightMult').getDouble();
		} else if(light == Light.DIM) {
			return actor.prop('lightDimMult').getDouble();
		} else {
			return 1;
		}
    },
    getSight: function(actor, light) {
        if(!actor) return 0;

        if(light == Light.BRIGHT) {
			return actor.prop('sightBright').getDouble();
		} else if(light == Light.DIM) {
			return actor.prop('sightDim').getDouble();
		} else {
			return actor.prop('sightDark').getDouble();
		}
    }
}

LightRenderer = {
    _mainBuffer: null,
    _lightBuffer1: null,
    _lightBuffer2: null,
    
    _mainCtx: null,
    _lightCtx1: null,
    _lightCtx2: null,
    
    init: function() {
        LightRenderer._mainBuffer = document.createElement("canvas");
        LightRenderer._lightBuffer1 = document.createElement("canvas");
        LightRenderer._lightBuffer2 = document.createElement("canvas");
        
        LightRenderer._mainCtx = LightRenderer._mainBuffer.getContext("2d");
        LightRenderer._lightCtx1 = LightRenderer._lightBuffer1.getContext("2d");
        LightRenderer._lightCtx2 = LightRenderer._lightBuffer2.getContext("2d");
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
        LightRenderer._mainCtx.globalCompositeOperation = "source-over";
        LightRenderer._mainCtx.fillStyle = "black";
        LightRenderer._mainCtx.fillRect(0, 0, screenWidth, screenHeight);
        LightRenderer._mainCtx.globalCompositeOperation = "lighter";
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.BRIGHT, null, viewers);
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.DIM, "rgba(0, 0, 0, 0.59)", viewers);
        LightRenderer._renderLight(LightRenderer._mainCtx, screenWidth, screenHeight, transform, viewport, map, Light.DARK, "rgba(0, 0, 0, 0.78)", viewers);
        LightRenderer._mainCtx.restore();
        
        // render to screen
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(LightRenderer._mainBuffer, 0, 0);
        ctx.globalCompositeOperation = "source-over";
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
        if(Light.isLess(light, map.prop("light").getLight())) {
            ctx1.fillStyle = "black";
            needsRender = true;
        } else {
            ctx1.fillStyle = "white";
        }
        ctx1.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx1.fillRect(0, 0, screenWidth, screenHeight);
        
        // render lights
        if(Light.isLess(light, map.prop("light").getLight())) {
            ctx1.globalCompositeOperation = "lighter";
            ctx1.setTransform(transform);
            
            MapUtils.currentEntities("token").forEach(token => {
				var centerX = token.prop("x").getLong();
				var centerY = token.prop("y").getLong();
                var maxLightRadius = Math.trunc(LightRenderer.getLight(token, light) * map.prop("gridSize").getLong());
				var lightRadius = Math.trunc(maxLightRadius * (1 - (token.prop("lightFlicker").getBoolean() ? 0.025*Math.random() : 0)));
                // skip lights that are outside of the viewport
				if(lightRadius > 0 && IntMathUtils.doAABBCircleIntersect(viewport.x, viewport.y, viewport.x+viewport.width, viewport.y+viewport.height, centerX, centerY, lightRadius)) {
                    var lightViewport = new CRect(centerX-maxLightRadius-1, centerY-maxLightRadius-1, maxLightRadius*2+2, maxLightRadius*2+2);
					
                    // get wall clip (with cached data whenever possible)
					var cached = LightRenderer.getLightWallCache(token, light, centerX, centerY, maxLightRadius, lightViewport);
					
					if(map.prop("wallsBlockLight").getBoolean() && WallRenderer.hasToRenderWalls(MapUtils.currentEntities("wall"), lightViewport, token)) {
						// draw light (with clip)
						LightRenderer.paintLight(ctx1, token, cached, true, centerX, centerY, lightRadius);
					} else {
						// draw light
						LightRenderer.paintLight(ctx1, token, cached, false, centerX, centerY, lightRadius);
					}
                }
            }).value();
        }
        
        //TODO render sight (directly when a single viewer is present, with extra buffer otherwise)
        ctx1.setTransform(1, 0, 0, 1, 0, 0); // identity
        ctx1.globalCompositeOperation = "multiply";
        //...
        
        // finish render
        if(needsRender && overlay != null) {
            ctx1.fillColor = overlay;
            ctx1.globalCompositeOperation = "source-over";
            ctx1.fillRect(0, 0, screenWidth, screenHeight);
        }
        
        // render to buffer
        ctx.drawImage(LightRenderer._lightBuffer1, 0, 0);
    },
    
    paintLight: function(ctx1, token, cached, withClip, centerX, centerY, lightRadius) {
        // calculate light angles (TODO: untested)
        var lightAngle = token.prop("lightAngle").getLong();
        var startAngle = 0;
        var endAngle = Math.PI*2;
        if(lightAngle < 360 && lightAngle > 0) {
            startAngle = -(token.prop("rotation").getDouble()-lightAngle/2) * Math.PI / 180;
            endAngle = -(token.prop("rotation").getDouble()+lightAngle/2) * Math.PI / 180;
        }
        
        // calculate gradient (TODO: fade modifies color, can I fade to the same color but with no alpha?)
        var color = token.prop("lightColor").getColor();
        var grd = ctx1.createRadialGradient(centerX, centerY, 1, centerX, centerY, lightRadius);
        grd.addColorStop(0, color);
        grd.addColorStop(0.5, color);
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        // paint (TODO: wall clipping)
        ctx1.save();
        ctx1.fillStyle = grd;
        //TODO: if(withClip) { ... }
        ctx1.beginPath();
        ctx1.ellipse(centerX, centerY, lightRadius, lightRadius, 0, startAngle, endAngle);
        ctx1.fill();
        ctx1.restore();
    },
    
    getLightWallCache: function(token, light, centerX, centerY, maxLightRadius, lightViewport) {
        //TODO: implement
        return null;
    },
    
    //TODO: These two methods do not follow the Pathfinder rules correctly
    getLight: function(token, light) {
        if(light == Light.BRIGHT) {
			return token.prop("lightBright").getDouble();
		} else if(light == Light.DIM) {
			return token.prop("lightDim").getDouble();
		} else {
			return 0;
		}
    },
    getSight: function(token, light) {
        if(light == Light.BRIGHT) {
			return token.prop("sightBright").getDouble();
		} else if(light == Light.DIM) {
			return token.prop("sightDim").getDouble();
		} else {
			return token.prop("sightDark").getDouble();
		}
    }
}

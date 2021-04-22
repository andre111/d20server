import { Events } from '../../common/events.js';
import { EntityUtils } from '../util/entityutil.js';
import { ImageService } from '../service/image-service.js';
import { TokenUtil } from '../../common/util/tokenutil.js';

export const TokenRenderer = {
    renderTokens: function(ctx, tokens, viewer, highlightToken, grayscale = false, renderInfo = true) {
        // render token
        for(const token of tokens) {
            const loc = TokenRenderer.getTokenLocation(token, true);
            TokenRenderer.renderToken(ctx, token, viewer, loc.x, loc.y, grayscale);
        }
        
        // render additional info
        if(!renderInfo) return;
        for(const token of tokens) {
            const loc = TokenRenderer.getTokenLocation(token, false);
            TokenRenderer.renderTokenInfo(ctx, token, viewer, loc.x, loc.y);
            
            // highlight the token
            if(token.getID() == highlightToken) {
                var border = 6;
                ctx.save();
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = border/2;
                EntityUtils.applyTransform(ctx, token);
                ctx.strokeRect(-token.prop('width').getLong()/2-border, -token.prop('height').getLong()/2-border, token.prop('width').getLong()+border*2, token.prop('height').getLong()+border*2);
                ctx.restore();
            }
        }
    },
    
    renderToken: function(ctx, token, viewer, x, y, grayscale) {
        var img = ImageService.getImage(token.prop('imagePath').getString(), grayscale);
        if(img == null) img = ImageService.MISSING;
        
        if(img != null) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(token.prop('rotation').getDouble() * Math.PI / 180);
            
            ctx.drawImage(img, -token.prop('width').getLong()/2, -token.prop('height').getLong()/2, token.prop('width').getLong(), token.prop('height').getLong());
            
            ctx.restore();
        }
    },
    
    renderTokenInfo: function(ctx, token, viewer, x, y) {
        // render additional info
        ctx.save();
        ctx.translate(x, y);
        ctx.lineWidth = 1;
        
        const accessLevel = token.getAccessLevel(viewer);
        const bounds = EntityUtils.getAABB(token);
        const actor = TokenUtil.getActor(token);
        
        // nameplate
        const nameProp = actor ? actor.prop('name') : null;
        if(nameProp && nameProp.canView(accessLevel) && nameProp.getString() != '') {
            const name = nameProp.getString();
            const nameMeasure = ctx.measureText(name);

            const nameW = nameMeasure.width + 4;
            const nameH = nameMeasure.actualBoundingBoxAscent + nameMeasure.actualBoundingBoxDescent + 4;
            const nameX = -nameW/2;
            const nameY = bounds.height/2 - 4;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.39)';
            ctx.fillRect(nameX, nameY, nameW, nameH);
            ctx.fillStyle = 'black';
            ctx.fillText(name, nameX + 2, nameY + 2 + nameMeasure.actualBoundingBoxAscent);
        }
        
        // bars
        const barW = TokenRenderer.getBarWidth(token, bounds, viewer);
        const barH = TokenRenderer.getBarHeight(token, bounds, viewer);
        for(var i=1; i<=3; i++) {
            if(TokenUtil.isBarVisible(token, viewer, i)) {
                const current = TokenUtil.getBarCurrentProp(token, i).getLong();
                const max = TokenUtil.getBarMaxProp(token, i).getLong();
                
                const barX = TokenRenderer.getBarX(token, bounds, viewer, i);
                const barY = TokenRenderer.getBarY(token, bounds, viewer, i);
                
                const currentBarW = ((barW * Math.max(0, Math.min(current, max))) / max);
                
                ctx.fillStyle = TokenRenderer.BAR_COLORS[i-1];
				ctx.fillRect(barX, barY, currentBarW, barH);
				ctx.strokeStyle = 'black';
				ctx.strokeRect(barX, barY, barW, barH);
                
                const barStr = current + '/' + max;
                const strX = -ctx.measureText(barStr).width/2;
                const strY = barY + 11;
                ctx.fillStyle = 'black';
                ctx.fillText(barStr, strX, strY);
            }
        }
        
        ctx.restore();
    },
    
    getBarWidth: function(token, bounds, viewer) {
        return bounds.width;
    },
    
    getBarHeight: function(token, bounds, viewer) {
        return 14;
    },
    
    getBarX: function(token, bounds, viewer, number) {
        // calculate (relative) var location
        return -TokenRenderer.getBarWidth(token, bounds, viewer)/2;
    },
    
    getBarY: function(token, bounds, viewer, number) {
        // count visible bars
        var visibleBars = 0;
        for(var i=1; i<=3; i++) {
            if(TokenUtil.isBarVisible(token, viewer, i)) visibleBars++;
        }
        
        // calculate (relative) var location
        var barH = TokenRenderer.getBarHeight(token, bounds, viewer);
        var barY = -bounds.height/2 - barH * (visibleBars+1) + 4;
        for(var i=1; i<=number; i++) {
            if(TokenUtil.isBarVisible(token, viewer, i)) barY += barH;
        }
        return barY;
    },
    
    BAR_COLORS: [
        'lime',
        'blue',
        'red'
    ],
    
    //-----------------------------------------------------------------------------------------------
    _lastTokenLocations: new Map(),
    onMapChange: function(id) {
        TokenRenderer._lastTokenLocations.clear();
    },
    getTokenLocation: function(token, update) {
        var lastLocation = TokenRenderer._lastTokenLocations.get(token.getID());
        if(lastLocation == null || lastLocation == undefined) {
            lastLocation = { x: token.prop('x').getLong(), y: token.prop('y').getLong() };
        }
        
        var x = lastLocation.x;
        var y = lastLocation.y;
        if(update) {
            x += (token.prop('x').getLong() - lastLocation.x) * 0.25;
            y += (token.prop('y').getLong() - lastLocation.y) * 0.25;
        }
        const currentLocation = { x: x, y: y };
        
        TokenRenderer._lastTokenLocations.set(token.getID(), currentLocation);
        return currentLocation;
    }
};
Events.on('mapChange', event => TokenRenderer.onMapChange());

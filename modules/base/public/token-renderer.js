TokenRenderer = {
    
    renderTokens: function(ctx, tokenStream, viewer, highlightToken, grayscale) {
        var tokens = tokenStream.value();
        
        // render token
        for(var token of tokens) {
            var loc = TokenRenderer.getTokenLocation(token, true);
            TokenRenderer.renderToken(ctx, token, viewer, loc.x, loc.y, grayscale);
        }
        
        // render additional info
        for(var token of tokens) {
            var loc = TokenRenderer.getTokenLocation(token, false);
            TokenRenderer.renderTokenInfo(ctx, token, viewer, loc.x, loc.y);
            
            // highlight the token
            if(token.id == highlightToken) {
                var border = 6;
                ctx.strokeStyle = "orange";
                ctx.lineWidth = border/2;
                ctx.save();
                EntityUtils.applyTransform(ctx, token);
                ctx.strokeRect(-token.prop("width").getLong()/2-border, -token.prop("height").getLong()/2-border, token.prop("width").getLong(), token.prop("height").getLong());
                ctx.restore();
            }
        }
    },
    
    renderToken: function(ctx, token, viewer, x, y, grayscale) {
        var img = ImageService.getImage(token.prop("imageID").getLong(), grayscale);
        if(img == null) img = ImageService.MISSING;
        
        if(img != null) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(token.prop("rotation").getLong() * Math.PI / 180);
            
            ctx.drawImage(img, -token.prop("width").getLong()/2, -token.prop("height").getLong()/2, token.prop("width").getLong(), token.prop("height").getLong());
            
            ctx.restore();
        }
    },
    
    renderTokenInfo: function(ctx, token, viewer, x, y) {
        //TODO: render additional info
        ctx.save();
        ctx.translate(x, y);
        
        var accessLevel = token.getAccessLevel(viewer);
        var bounds = EntityUtils.getAABB(token);
        
        // nameplate
        if(token.prop("displayNameplate").getBoolean()) {
            var nameProp = token.prop("name");
            if(nameProp.canView(accessLevel) && nameProp.getString() != '') {
                var name = nameProp.getString();
                var nameW = ctx.measureText(name).width + 4;
                var nameH = ctx.measureText(name).actualBoundingBoxAscent + ctx.measureText(name).actualBoundingBoxDescent + 4;
                var nameX = -nameW/2;
                var nameY = 0 - 4; //TODO: bounds.height/2 - 4;
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.39)";
                ctx.fillRect(nameX, nameY, nameW, nameH);
                ctx.fillStyle = "black";
                ctx.fillText(name, nameX + 2, nameY + 2 + ctx.measureText(name).actualBoundingBoxAscent);
            }
        }
        
        //TODO: bars
        
        ctx.restore();
    },
    
    _lastTokenLocations: new Map(), //TODO: clear on map change -> observer system required
    getTokenLocation: function(token, update) {
        var lastLocation = TokenRenderer._lastTokenLocations.get(token.id);
        if(lastLocation == null || lastLocation == undefined) {
            lastLocation = { x: token.prop("x").getLong(), y: token.prop("y").getLong() };
        }
        
        var x = lastLocation.x;
        var y = lastLocation.y;
        if(update) {
            x += (token.prop("x").getLong() - lastLocation.x) * 0.25;
            y += (token.prop("y").getLong() - lastLocation.y) * 0.25;
        }
        var currentLocation = { x: x, y: y };
        
        TokenRenderer._lastTokenLocations.set(token.id, currentLocation);
        return currentLocation;
    }
}

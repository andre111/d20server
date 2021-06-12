class AbstractEffect {
    constructor(x, y, rotation, scale) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scale = scale;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.rotation);
        this.drawEffect(ctx);
        ctx.restore();
    }
    
    update() {}
    drawEffect(ctx) {}
}

class PingEffect extends AbstractEffect {
    constructor(x, y, rotation, scale, parameters) {
        super(x, y, rotation, scale);
        
        this.color = parameters ? parameters[0] : '#000000';
        this.age = 0;
    }
    
    update() {
        this.age++;
        return this.age <= 20;
    }
    
    drawEffect(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        
        var size = 16 + (160-16) * this.age / 20;
        ctx.beginPath();
        ctx.ellipse(0, 0, size/2, size/2, 0, 0, Math.PI*2);
        ctx.stroke();
    }
}

var _effects = [];
var _above_effects = [];
export const EffectRenderer = {
    updateAndDrawEffects(ctx) {
        _effects = EffectRenderer.updateAndDraw(ctx, _effects);
    },
    updateAndDrawAboveEffects(ctx) {
        _above_effects = EffectRenderer.updateAndDraw(ctx, _above_effects);
    },
    
    addEffect(type, x, y, rotation, scale, aboveOcclusion, parameters) {
        switch(type) {
        case 'NONE':
            break;
        case 'PING':
            EffectRenderer._addEffect(new PingEffect(x, y, rotation, scale, parameters), aboveOcclusion);
            break;
        default:
            console.log('Ignored unknown effect of type: '+type);
            break;
        }
    },
    _addEffect(effect, aboveOcclusion) {
        if(aboveOcclusion) {
            _above_effects.push(effect);
        } else {
            _effects.push(effect);
        }
    },
    
    updateAndDraw(ctx, effects) {
        return effects.filter(effect => {
            if(effect.update()) {
                effect.draw(ctx);
                return true;
            } else {
                return false;
            }
        });
    }
}

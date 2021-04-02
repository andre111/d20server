import { ImageService } from '../service/image-service.js';
import { IntMathUtils } from '../../common/util/mathutil.js';
import { Effect } from '../../common/constants.js';
import { SettingsUtils } from '../util/settingsutil.js';
import { SETTING_WEATHER_VOLUME } from '../app.js';

class WeatherRendererParticle {
    constructor(x, y, height, vx, vy, vh, color) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.vx = vx;
        this.vy = vy;
        this.vh = vh;
        this.color = color;
    }
}

export const WeatherRenderer = {
    _particles: [],
    _rain_colors: [
        'rgba(150, 150, 200, 0.68)',
        'rgba(150, 150, 210, 0.49)',
        'rgba(150, 150, 220, 0.29)'
    ],
    _snow_colors: [
        'rgba(255, 255, 255, 0.68)',
        'rgba(255, 255, 255, 0.49)',
        'rgba(255, 255, 255, 0.29)'
    ],
    _fog_color: 'rgba(255, 255, 255, 0)',
    _fog_image: null,
    _lightning: 0,
    _sound: null,
    _soundSrc: null,
    
    updateAndDraw: function(ctx, viewport, effect) {
        // get values
        var count = 5;
        var height = 40, svx = 0, svy = 0, svh = -1;
        var color = 'black';
        var lightningChance = 0;
        var soundSrc = null;
        switch(effect) {
        case Effect.NONE:
            count = 0;
            break;
        case Effect.FOG:
            count = 1;
            svx = (Math.random() - 0.5) / 8;
            svy = (Math.random() - 0.5) / 8;
            svh = -0.2;
            color = WeatherRenderer._fog_color;
            break;
        case Effect.RAIN_LIGHT:
			count = 5;
			svx = 0;
			svy = 0;
			svh = -1;
			color = WeatherRenderer._rain_colors[IntMathUtils.getRandomInt(WeatherRenderer._rain_colors.length)];
            soundSrc = '/core/files/audio/weather/rain_light.mp3';
			break;
		case Effect.RAIN_HEAVY:
			count = 20;
			svx = 0;
			svy = 0;
			svh = -1;
			color = WeatherRenderer._rain_colors[IntMathUtils.getRandomInt(WeatherRenderer._rain_colors.length)];
            soundSrc = '/core/files/audio/weather/rain_heavy.mp3';
			break;
		case Effect.RAIN_STORM:
			count = 20;
			svx = 0;
			svy = 0;
			svh = -1;
			color = WeatherRenderer._rain_colors[IntMathUtils.getRandomInt(WeatherRenderer._rain_colors.length)];
			lightningChance = 0.001;
            soundSrc = '/core/files/audio/weather/rain_storm.mp3';
			break;
		case Effect.SNOW:
			count = 5;
			svx = (Math.random() - 0.5) / 2;
			svy = (Math.random() - 0.5) / 2;
			svh = -0.2;
			color = WeatherRenderer._snow_colors[IntMathUtils.getRandomInt(WeatherRenderer._snow_colors.length)];
			break;
        }
        
        //
        var vCenterX = viewport.x + viewport.width/2;
        var vCenterY = viewport.y + viewport.height/2;
        var vHalfWidth = viewport.width/2;
        var vHalfHeight = viewport.height/2;
        if(WeatherRenderer._fog_image == null) {
            WeatherRenderer._fog_image = ImageService.getInternalImage('/core/files/img/fog.png');
        }
        
        // create new particles
        var edge = 300;
        for(var i=0; i<count; i++) {
            WeatherRenderer._particles.push(new WeatherRendererParticle(viewport.x-edge+IntMathUtils.getRandomInt(viewport.width+edge*2), viewport.y-edge+IntMathUtils.getRandomInt(viewport.height+edge*2),
                    height, svx, svy, svh, color));
        }
        
        // update (and draw) particles
        if(effect != Effect.NONE) {
            ctx.save();
            if(effect == Effect.RAIN_LIGHT || effect == Effect.RAIN_HEAVY || effect == Effect.RAIN_STORM) {
                ctx.lineWidth = 1.5;
            }
            WeatherRenderer._particles = WeatherRenderer._particles.filter(particle => {
                particle.height += particle.vh;
                if(particle.height <= 0) {
                    //TODO: add rain splashes on impact
                    return false;
                } else {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    var vx = (particle.x-vCenterX) / vHalfWidth;
                    var vy = (particle.y-vCenterY) / vHalfHeight;
                    var h1Sq = particle.height * particle.height;
                    var h2Sq = (particle.height + 2) * (particle.height + 2);
                    
                    if(effect == Effect.FOG) {
                        //FOG:
                        if(WeatherRenderer._fog_image != null) {
                            var alpha = 1 - Math.abs(20 - particle.height)/20;
                            ctx.globalAlpha = alpha;
                            ctx.drawImage(WeatherRenderer._fog_image, particle.x - WeatherRenderer._fog_image.naturalWidth/2, particle.y - WeatherRenderer._fog_image.naturalHeight/2);
                        }
                    } else if(effect == Effect.SNOW) {
                        //SNOW:
                        var radius = (4 + 4 * h1Sq / (40*40)) / 2;
                        ctx.fillStyle = particle.color;
                        ctx.beginPath();
                        ctx.ellipse((particle.x+vx*h1Sq)+radius, (particle.y+vy*h1Sq)+radius, radius, radius, 0, 0, Math.PI*2);
                        ctx.fill();
                    } else {
                        //RAIN:
                        ctx.strokeStyle = particle.color;
                        ctx.beginPath();
                        ctx.moveTo(particle.x+vx*h1Sq, particle.y+vy*h1Sq);
                        ctx.lineTo(particle.x+vx*h2Sq, particle.y+vy*h2Sq);
                        ctx.stroke();
                    }
                    
                    return true;
                }
            });
            ctx.restore();
        }
        
        // update sound
        if(soundSrc != null) {
            if(!WeatherRenderer._sound || WeatherRenderer._soundSrc != soundSrc) {
                if(WeatherRenderer._sound) {
                    if(WeatherRenderer._sound.playing()) WeatherRenderer._sound.stop();
                    WeatherRenderer._sound = null;
                }
                WeatherRenderer._soundSrc = soundSrc;
                WeatherRenderer._sound = new Howl({
                    src: [soundSrc],
                    volume: 0.1 * SettingsUtils.getVolume(SETTING_WEATHER_VOLUME),
                    autoplay: true,
                    loop: true
                });
            }
        } else {
            if(WeatherRenderer._sound) {
                if(WeatherRenderer._sound.playing()) WeatherRenderer._sound.stop();
                WeatherRenderer._sound = null;
            }
        }
        
        // update (and draw) lightning
        if(Math.random() < lightningChance) {
            WeatherRenderer._lightning = 0.9;
            var thunderSound = '/core/files/audio/weather/thunder'+IntMathUtils.getRandomInt(4)+'.mp3';
            new Howl({
                src: [thunderSound],
                volume: 0.5 * SettingsUtils.getVolume(SETTING_WEATHER_VOLUME),
                autoplay: true
            });
        }
        if(WeatherRenderer._lightning > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, '+WeatherRenderer._lightning+')';
            ctx.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
            WeatherRenderer._lightning -= 0.1;
        }
    }
}

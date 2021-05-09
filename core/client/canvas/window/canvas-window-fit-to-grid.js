import { CanvasWindow } from '../canvas-window.js';
import { Camera } from '../camera.js';
import { MouseController } from '../../mouse-controller.js';
import { MouseControllerCamera } from '../mouse-controller-camera.js';
import { ImageService } from '../../service/image-service.js';
import { Events } from '../../../common/events.js';
import { MapUtils } from '../../util/maputil.js';
import { I18N } from '../../../common/util/i18n.js';

class CanvasWindowFitToGridMouseController extends MouseController {
    constructor(w) {
        super();
        
        this.w = w;
    }
    
    mouseClicked(e) {
        if(e.which == 1) {
            this.w.setAnchor1(e.xm, e.ym);
        } else if(e.which == 3) {
            this.w.setAnchor2(e.xm, e.ym);
        }
    }
}

export class CanvasWindowFitToGrid extends CanvasWindow {
    constructor(parent, reference) {
        super(parent, I18N.get('window.fittogrid', 'Fit to Grid (select a 7x7 cells area with left and right click)'), true);
        
        this.reference = reference;
        this.x1 = null;
        this.y1 = null;
        this.x2 = null;
        this.y2 = null;
        
        // create html elements
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '99%';
        this.canvas.style.height = '99%';
        this.canvas.style.margin = 'auto';
        this.content.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // camera
        this.camera = new Camera();
        this.camera.maxScale = 10;
        var img = this.getImage();
        if(img != null) {
            this.camera.setLocation(img.naturalWidth/2, img.naturalHeight/2, true);
        }
        
        // controlls
        //TODO: this is duplicated from StateMain, the controller should probably register the listeners itself?
        var mcc = new MouseControllerCamera(this.camera, new CanvasWindowFitToGridMouseController(this));
        this.canvas.addEventListener('mousemove', e => mcc.onMove(e), true);
        this.canvas.addEventListener('wheel', e => mcc.mouseWheelMoved(e), true);
        this.canvas.addEventListener('click', e => mcc.mouseClicked(e), true);
        this.canvas.addEventListener('contextmenu', e => { mcc.mouseClicked(e); e.preventDefault(); return false; }, true);
        this.canvas.addEventListener('mousedown', e => mcc.mousePressed(e), true);
        this.canvas.addEventListener('mouseup', e => mcc.mouseReleased(e), true);
        this.canvas.addEventListener('mouseenter', e => mcc.mouseEntered(e), true);
        this.canvas.addEventListener('mouseleave', e => mcc.mouseExited(e), true);
        
        this.maximize();
        
        // 
        this.addButton(I18N.get('global.ok', 'Ok'), () => {
            this.doUpdateEntity();
            this.close();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.close();
        });
        this.maximize();
        
        // register rendering
        this.listener = Events.on('frameEnd', event => this.render());
    }
    
    render() {
        // stop rendering once closed
        if(this.isClosed) {
            Events.remove('frameEnd', this.listener);
            return;
        }
        if(this.canvas.width != this.canvas.clientWidth) this.canvas.width = this.canvas.clientWidth;
        if(this.canvas.height != this.canvas.clientHeight) this.canvas.height = this.canvas.clientHeight;
        
        // rendering
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.camera.update(this.canvas.width, this.canvas.height);
        this.ctx.setTransform(this.camera.getTransform());
        
        // render image
        var img = this.getImage();
        if(img != null) {
            this.ctx.drawImage(img, 0, 0);
        }
        
        // render anchor points
        if(this.x1 != null && this.y1 != null) {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(this.x1-2, this.y1-2, 5, 5);
        }
        if(this.x2 != null && this.y2 != null) {
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(this.x2-2, this.y2-2, 5, 5);
        }
        
        // render grid
        if(this.x1 != null && this.y1 != null && this.x2 != null && this.y2 != null) {
            this.strokeStyle = 'black';
            this.lineWidth = 3;
            
            for(var x=0; x<=7; x++) {
                var xp = this.x1 + (this.x2-this.x1) / 7 * x;
                
                this.ctx.beginPath();
                this.ctx.moveTo(xp, this.y1);
                this.ctx.lineTo(xp, this.y2);
                this.ctx.stroke();
            }
            
            for(var y=0; y<=7; y++) {
                var yp = this.y1 + (this.y2-this.y1) / 7 * y;
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.x1, yp);
                this.ctx.lineTo(this.x2, yp);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    getImage() {
        var imagePath = this.reference.getString('imagePath');
        if(imagePath && imagePath != '') {
            return ImageService.getImage(imagePath);
        }
        return null;
    }
    
    setAnchor1(x, y) {
        this.x1 = x;
        this.y1 = y;
    }
    
    setAnchor2(x, y) {
        this.x2 = x;
        this.y2 = y;
    }
    
    doUpdateEntity() {
        if(this.x1 == null || this.y1 == null || this.x2 == null || this.y2 == null) return;
        
        var map = MapUtils.currentMap();
		if(map == null) return;
		
        var img = this.getImage();
        if(img == null) return;
        
		var gridSize = map.getLong('gridSize');
		var gridCenterX = Math.trunc(map.getLong('width') * gridSize / 2);
		var gridCenterY = Math.trunc(map.getLong('height') * gridSize / 2);
		
        // calculate image size
		var cellWidth = ((this.x2-this.x1) / 7);
		var cellHeight = ((this.x2-this.x1) / 7);
		var imageCellsW = img.naturalWidth / cellWidth;
		var imageCellsH = img.naturalHeight / cellHeight;
        
		var imageTargetWidth = Math.round(imageCellsW * gridSize);
		var imageTargetHeight = Math.round(imageCellsH * gridSize);
		
        // calculate offset from grid
		var x1Scaled = (this.x1 / img.naturalWidth) * imageTargetWidth;
		var y1Scaled = (this.y1 / img.naturalHeight) * imageTargetHeight;
		var imageXOffset = -Math.trunc((x1Scaled-imageTargetWidth/2)) % gridSize;
		var imageYOffset = -Math.trunc((y1Scaled-imageTargetHeight/2)) % gridSize;
		
		var imageTargetX = (Math.trunc(gridCenterX / gridSize) * gridSize) + imageXOffset;
		var imageTargetY = (Math.trunc(gridCenterY / gridSize) * gridSize) + imageYOffset;
		
		this.reference.setLong('x', imageTargetX);
		this.reference.setLong('y', imageTargetY);
		this.reference.setLong('width', imageTargetWidth);
		this.reference.setLong('height', imageTargetHeight);
		this.reference.performUpdate();
    }
}

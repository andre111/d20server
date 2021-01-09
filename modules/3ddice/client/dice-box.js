import { DICE_MODELS } from './dice-models.js';
import { COLORSETS } from './dice-colors.js';

export class DiceBox {
	constructor(element_container, dice_factory, config) {
		//private variables
		this.container = element_container;
		this.dicefactory = dice_factory;
		this.config = config;
		this.speed = 1;
		this.isVisible = false;
		this.adaptive_timestep = false;
		this.last_time = 0;
		this.settle_time = 0;
		this.running = false;
		this.rolling = false;
		this.threadid;

		this.nbIterationsBetweenRolls = 15;

		this.display = {
			currentWidth: null,
			currentHeight: null,
			containerWidth: null,
			containerHeight: null,
			aspect: null,
			scale: null
		};

		this.mouse = {
			pos: new THREE.Vector2(),
			startDrag: undefined,
			startDragTime: undefined
		};

		this.cameraHeight = {
			max: null,
			close: null,
			medium: null,
			far: null
		};

		
		this.clock = new THREE.Clock();
		this.world_sim = new CANNON.World();
		this.dice_body_material = new CANNON.Material();
		this.desk_body_material = new CANNON.Material();
		this.barrier_body_material = new CANNON.Material();
		this.sounds_table = {};
		this.sounds_dice = {};
		this.sounds_coins = [];
		this.lastSoundType = '';
		this.lastSoundStep = 0;
		this.lastSound = 0;
		this.iteration;
		this.renderer;
		this.barrier1;
        this.barrier2;
        this.barrier3;
        this.barrier4;
		this.camera;
		this.light;
		this.light_amb;
		this.desk;
		this.pane;

		//public variables
		this.public_interface = {};
		this.diceList = []; //'private' variable
		this.deadDiceList = [];
		this.framerate = (1/60);
		this.sounds = true;
		this.volume = 1;
		this.soundDelay = 1; // time between sound effects in worldstep
		this.soundsSurface = 'felt';
		this.animstate = '';
		this.throwingForce = 'medium';

		this.colors = {
			ambient:  0xffffff,
			spotlight: 0xffffff,
			ground:0x242644
		};

		this.shadows = true;

		this.rethrowFunctions = {};
		this.afterThrowFunctions = {};
	}

	preloadSounds(){
		let surfaces = [
			['felt', 7],
			['wood_table', 7],
			['wood_tray', 7],
			['metal', 9]
		];

		for (const [surface, numsounds] of surfaces) {
			this.sounds_table[surface] = [];
			for (let s=1; s <= numsounds; ++s) {
				let path = `/modules/3ddice/files/sounds/${surface}/surface_${surface}${s}.wav`;
				new Howl({
					src:path,
					autoplay:false
				});
				this.sounds_table[surface].push(path);
			}
		}

		let materials = [
			['plastic', 15],
			['metal', 12],
			['wood', 12]
		];

		for (const [material, numsounds] of materials) {
			this.sounds_dice[material] = [];
			for (let s=1; s <= numsounds; ++s) {
				let path = `/modules/3ddice/files/sounds/dicehit/dicehit${s}_${material}.wav`;
				new Howl({
					src:path,
					autoplay:false
				});
				this.sounds_dice[material].push(path);
			}
		}

		for (let i=1; i <= 6; ++i) {
			let path = `/modules/3ddice/files/sounds/dicehit/coinhit${i}.wav`;
			new Howl({
				src:path,
				autoplay:false
			});
			this.sounds_coins.push(path);
		}
	}

	initialize() {
		return new Promise(async resolve => {
			this.sounds = this.config.sounds;
			this.volume = this.config.soundsVolume;
			this.soundsSurface = this.config.soundsSurface;
			this.shadows = this.config.shadowQuality != 'none';
			this.speed = 1;
			this.throwingForce = this.config.throwingForce;
			this.scene = new THREE.Scene();
			
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference:'high-performance'});
            if(this.config.useHighDPI)
                this.renderer.setPixelRatio(window.devicePixelRatio);
            if(this.dicefactory.bumpMapping){
                this.renderer.physicallyCorrectLights = true;
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                this.renderer.toneMappingExposure = 0.9;
                this.renderer.outputEncoding = THREE.sRGBEncoding;
            }
            await this.loadContextScopedTextures(this.config.boxType);
            this.dicefactory.initializeMaterials();
            
			/*this.rendererStats	= new THREEx.RendererStats()

			this.rendererStats.domElement.style.position	= 'absolute';
			this.rendererStats.domElement.style.left	= '44px';
			this.rendererStats.domElement.style.bottom	= '178px';
			this.rendererStats.domElement.style.transform	= 'scale(2)';
			document.body.appendChild( this.rendererStats.domElement );*/

			this.container.appendChild(this.renderer.domElement);
			this.renderer.shadowMap.enabled = this.shadows;
			this.renderer.shadowMap.type = this.config.shadowQuality == 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
			this.renderer.setClearColor(0x000000, 0);

			this.world_sim.gravity.set(0, 0, -9.8 * 800);
			this.world_sim.broadphase = new CANNON.NaiveBroadphase();
			this.world_sim.solver.iterations = 14;
			this.world_sim.allowSleep = true;
		
			let contactMaterial = new CANNON.ContactMaterial( this.desk_body_material, this.dice_body_material, {friction: 0.01, restitution: 0.5});
			this.world_sim.addContactMaterial(contactMaterial);
			contactMaterial = new CANNON.ContactMaterial( this.barrier_body_material, this.dice_body_material, {friction: 0, restitution: 0.95});
			this.world_sim.addContactMaterial(contactMaterial);
			contactMaterial = new CANNON.ContactMaterial( this.dice_body_material, this.dice_body_material, {friction: 0.01, restitution: 0.7});
			this.world_sim.addContactMaterial(contactMaterial);
			let desk = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: this.desk_body_material});
			this.world_sim.addBody(desk);

			this.setDimensions();
			resolve();
		});
	}

	loadContextScopedTextures(type){
		return new Promise(resolve => {
			this.renderer.scopedTextureCache = {type:type};
			if(this.dicefactory.bumpMapping){
				let textureLoader = new THREE.TextureLoader();
				this.renderer.scopedTextureCache.roughnessMap_fingerprint = textureLoader.load('/modules/3ddice/files/textures/roughnessMap_finger.webp');
				this.renderer.scopedTextureCache.roughnessMap_wood = textureLoader.load('/modules/3ddice/files/textures/roughnessMap_wood.webp');
				this.renderer.scopedTextureCache.roughnessMap_metal = textureLoader.load('/modules/3ddice/files/textures/roughnessMap_metal.webp');

				this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
				this.pmremGenerator.compileEquirectangularShader();

				new RGBELoader()
				.setDataType( THREE.UnsignedByteType )
				.setPath( '/modules/3ddice/files/textures/equirectangular/' )
				.load('foyer.hdr', function ( texture ) {
					this.renderer.scopedTextureCache.textureCube = this.pmremGenerator.fromEquirectangular(texture).texture;
	
					texture.dispose();
					this.pmremGenerator.dispose();
					resolve();
					
				}.bind(this));
			} else {
				let loader = new THREE.CubeTextureLoader();
				loader.setPath('/modules/3ddice/files/textures/cubemap/');

				this.renderer.scopedTextureCache.textureCube = loader.load( [
					'px.webp', 'nx.webp',
					'py.webp', 'ny.webp',
					'pz.webp', 'nz.webp'
				]);
				resolve();
			}
		});
	}

	setDimensions() {
        // do not update size with container is invisible (has no size -> causes errors)
        if(this.container.clientWidth == 0 || this.container.clientHeight == 0) return;
        
        // calculate new size and only perform expensive scene recreation when size changes
        var lastWidth = this.display.currentWidth;
        var lastHeight = this.display.currentHeight;
		this.display.currentWidth = this.container.clientWidth / 2;
		this.display.currentHeight = this.container.clientHeight / 2;
        this.display.containerWidth = this.display.currentWidth;
        this.display.containerHeight = this.display.currentHeight;
		this.display.aspect = Math.min(this.display.currentWidth / this.display.containerWidth, this.display.currentHeight / this.display.containerHeight);
        if(this.display.currentWidth == lastWidth && this.display.currentHeight == lastHeight) return;
        
		if(this.config.autoscale)
			this.display.scale = Math.sqrt(this.display.containerWidth * this.display.containerWidth + this.display.containerHeight * this.display.containerHeight) / 13;
		else
			this.display.scale = this.config.scale;
		if(this.config.boxType == 'board')
			this.dicefactory.setScale(this.display.scale);
		this.renderer.setSize(this.display.currentWidth * 2, this.display.currentHeight * 2);

        // replace camera
		this.cameraHeight.max = this.display.currentHeight / this.display.aspect / Math.tan(10 * Math.PI / 180);

		this.cameraHeight.medium = this.cameraHeight.max / 1.5;
		this.cameraHeight.far = this.cameraHeight.max;
		this.cameraHeight.close = this.cameraHeight.max / 2;

		if (this.camera) this.scene.remove(this.camera);
		this.camera = new THREE.PerspectiveCamera(20, this.display.currentWidth / this.display.currentHeight, 1, this.cameraHeight.max * 1.3);
        this.camera.position.z = this.cameraHeight.far;

		this.camera.lookAt(new THREE.Vector3(0,0,0));
		
        // replace light
		if (this.light) this.scene.remove(this.light);
		if (this.light_amb) this.scene.remove(this.light_amb);

		let intensity;
		if(this.dicefactory.bumpMapping){ //advanced lighting
			intensity = 0.6;
		} else {
			intensity = 0.7;
			this.light_amb = new THREE.HemisphereLight(this.colors.ambient, this.colors.ground, 1);
			this.scene.add(this.light_amb);
		}
		const maxwidth = Math.max(this.display.containerWidth, this.display.containerHeight);
		
		this.light = new THREE.DirectionalLight(this.colors.spotlight, intensity);
		this.light.position.set(-this.display.containerWidth/10, this.display.containerHeight/10, maxwidth/2);
		this.light.target.position.set(0, 0, 0);
		this.light.distance = 0;
		this.light.castShadow = this.shadows;
		this.light.shadow.camera.near = maxwidth / 10;
		this.light.shadow.camera.far = maxwidth * 5;
		this.light.shadow.camera.fov = 50;
		this.light.shadow.bias = -0.0001;;
		this.light.shadow.mapSize.width = 1024;
		this.light.shadow.mapSize.height = 1024;
		const d = 1000;
		this.light.shadow.camera.left = - d;
		this.light.shadow.camera.right = d;
		this.light.shadow.camera.top = d;
		this.light.shadow.camera.bottom = - d;
		this.scene.add(this.light);

        // replace desk/shadow plane
		if (this.desk) this.scene.remove(this.desk);
		let shadowplane = new THREE.ShadowMaterial();
		shadowplane.opacity = 0.5;
		this.desk = new THREE.Mesh(new THREE.PlaneGeometry(this.display.containerWidth * 6, this.display.containerHeight * 6, 1, 1), shadowplane);
		this.desk.receiveShadow = this.shadows;
		this.desk.position.set(0, 0, -1);
		this.scene.add(this.desk);
        
        // replace barriers
        if(this.barrier1) this.scene.remove(this.barrier1);
        this.barrier1 = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: this.barrier_body_material});
        this.barrier1.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        this.barrier1.position.set(0, this.display.containerHeight * 0.93, 0);
        this.world_sim.addBody(this.barrier1);

        if(this.barrier2) this.scene.remove(this.barrier2);
        this.barrier2 = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: this.barrier_body_material});
        this.barrier2.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.barrier2.position.set(0, -this.display.containerHeight * 0.93, 0);
        this.world_sim.addBody(this.barrier2);

        if(this.barrier3) this.scene.remove(this.barrier3);
        this.barrier3 = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: this.barrier_body_material});
        this.barrier3.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
        this.barrier3.position.set(this.display.containerWidth * 0.93, 0, 0);
        this.world_sim.addBody(this.barrier3);

        if(this.barrier4) this.scene.remove(this.barrier4);
        this.barrier4 = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: this.barrier_body_material});
        this.barrier4.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
        this.barrier4.position.set(-this.display.containerWidth * 0.93, 0, 0);
        this.world_sim.addBody(this.barrier4);

		this.renderer.render(this.scene, this.camera);
	}


	vectorRand({x, y}) {
		let angle = Math.random() * Math.PI / 5 - Math.PI / 5 / 2;
		let vec = {
			x: x * Math.cos(angle) - y * Math.sin(angle),
			y: x * Math.sin(angle) + y * Math.cos(angle)
		};
		if (vec.x == 0) vec.x = 0.01;
		if (vec.y == 0) vec.y = 0.01;
		return vec;
	}

	//returns an array of vectordata objects
	getVectors(notationVectors, vector, boost, dist){

		for (let i = notationVectors.dice.length-1; i>=0; i--) {

			const diceobj = this.dicefactory.get('d'+notationVectors.dice[i].sides); //TODO: add support for special dice?
            if(!diceobj) { notationVectors.dice.splice(i, 1); continue; } // skip unknown dice

			let vec = this.vectorRand(vector);

			vec.x /= dist;
			vec.y /= dist;

			let pos = {
				x: this.display.containerWidth * (vec.x > 0 ? -1 : 1) * 0.9 + Math.floor(Math.random() * 201) - 100 ,
				y: this.display.containerHeight * (vec.y > 0 ? -1 : 1) * 0.9 + Math.floor(Math.random() * 201) - 100,
				z: Math.random() * 200 + 200
			};

			let projector = Math.abs(vec.x / vec.y);
			if (projector > 1.0) pos.y /= projector; else pos.x *= projector;


			let velvec = this.vectorRand(vector);

			velvec.x /= dist;
			velvec.y /= dist;
			let velocity, angle, axis;

			if(diceobj.shape != 'd2'){

				velocity = { 
					x: velvec.x * boost, 
					y: velvec.y * boost, 
					z: -10
				};

				angle = {
					x: -(Math.random() * vec.y * 5 + diceobj.inertia * vec.y),
					y: Math.random() * vec.x * 5 + diceobj.inertia * vec.x,
					z: 0
				};

				axis = { 
					x: Math.random(), 
					y: Math.random(), 
					z: Math.random(), 
					a: Math.random()
				};

				axis = { 
					x: 0, 
					y: 0, 
					z: 0, 
					a: 0
				};
			}else {
				//coin flip
				velocity = { 
					x: velvec.x * boost / 10, 
					y: velvec.y * boost / 10, 
					z: 3000
				};

				angle = {
					x: 12 * diceobj.inertia,//-(Math.random() * velvec.y * 50 + diceobj.inertia * velvec.y ) ,
					y: 1 * diceobj.inertia,//Math.random() * velvec.x * 50 + diceobj.inertia * velvec.x ,
					z: 0
				};

				axis = { 
					x: 1,//Math.random(), 
					y: 1,//Math.random(), 
					z: Math.random(), 
					a: Math.random()
				};
			}

			notationVectors.dice[i].vectors = { 
				type: diceobj.type,  
				pos, 
				velocity, 
				angle, 
				axis
			};           
		}
		return notationVectors;
	}

	// swaps dice faces to match desired result
	swapDiceFace(dicemesh){
		const diceobj = this.dicefactory.get(dicemesh.notation.type);

		let value = parseInt(dicemesh.getLastValue().value);
		let result = parseInt(dicemesh.forcedResult);
		
		if (diceobj.shape == 'd10' && result == 0) result = 10;

		if(diceobj.valueMap){ //die with special values
			result = diceobj.valueMap[result];
		}
	
		if(value == result) return;

		let rotIndex = value > result ? result+','+value : value+','+result;
		let rotationDegrees = DICE_MODELS[dicemesh.shape].rotationCombinations[rotIndex];
		let eulerAngle = new THREE.Euler(THREE.MathUtils.degToRad(rotationDegrees[0]),THREE.MathUtils.degToRad(rotationDegrees[1]),THREE.MathUtils.degToRad(rotationDegrees[2]));
		let quaternion = new THREE.Quaternion().setFromEuler(eulerAngle);
		if(value > result)
			quaternion.inverse();
		
		dicemesh.applyQuaternion(quaternion);

		dicemesh.resultReason = 'forced';
	}

	//spawns one dicemesh object from a single vectordata object
	spawnDice(dicedata) {
		let vectordata = dicedata.vectors;
		const diceobj = this.dicefactory.get(vectordata.type);
		if(!diceobj) return;
        
		let colorset = 'black';
		if(dicedata.label && COLORSETS[dicedata.label]){
			colorset = dicedata.label;
		}

		let dicemesh = this.dicefactory.create(this.renderer.scopedTextureCache, diceobj.type, colorset);
		if(!dicemesh) return;

		let mass = diceobj.mass;
		switch(this.dicefactory.material_rand){
			case 'metal':
				mass *= 7;
				break;
			case 'wood':
				mass *= 0.65;
				break;
			case 'glass':
				mass *= 2;
				break;
		}

		dicemesh.notation = vectordata;
		dicemesh.result = [];
		dicemesh.forcedResult = dicedata.result;
		dicemesh.startAtIteration = dicedata.startAtIteration;
		dicemesh.stopped = 0;
		dicemesh.castShadow = this.shadows;

		dicemesh.body_sim = new CANNON.Body({allowSleep: true, sleepSpeedLimit: 75, sleepTimeLimit:0.9,mass: mass, shape: dicemesh.geometry.cannon_shape, material: this.dice_body_material});
		dicemesh.body_sim.type = CANNON.Body.DYNAMIC;
		dicemesh.body_sim.position.set(vectordata.pos.x, vectordata.pos.y, vectordata.pos.z);
		dicemesh.body_sim.quaternion.setFromAxisAngle(new CANNON.Vec3(vectordata.axis.x, vectordata.axis.y, vectordata.axis.z), vectordata.axis.a * Math.PI * 2);
		dicemesh.body_sim.angularVelocity.set(vectordata.angle.x, vectordata.angle.y, vectordata.angle.z);
		dicemesh.body_sim.velocity.set(vectordata.velocity.x, vectordata.velocity.y, vectordata.velocity.z);
		dicemesh.body_sim.linearDamping = 0.1;
		dicemesh.body_sim.angularDamping = 0.1;
		dicemesh.body_sim.addEventListener('collide', this.eventCollide.bind(this));
		dicemesh.body_sim.stepQuaternions = new Array(1000);
		dicemesh.body_sim.stepPositions = new Array(1000);

		//We add some informations about the dice to the CANNON body to be used in the collide event
		dicemesh.body_sim.diceType = diceobj.type;
		dicemesh.body_sim.diceMaterial = this.dicefactory.material_rand;

		let objectContainer = new THREE.Object3D();
		objectContainer.add(dicemesh);

		this.diceList.push(dicemesh);
		if(dicemesh.startAtIteration == 0){
			this.scene.add(objectContainer);
			this.world_sim.addBody(dicemesh.body_sim);
		}
	}

	eventCollide({body, target}) {
		// collision events happen simultaneously for both colliding bodies
		// all this sanity checking helps limits sounds being played
		if (!this.sounds || !body || !this.sounds_dice.plastic) return;
		
		let now = body.world.stepnumber;
		let currentSoundType = (body.mass > 0) ? 'dice' : 'table';

		// the idea here is that a dice clack should never be skipped in favor of a table sound
		// if ((don't play sounds if we played one this world step, or there hasn't been enough delay) AND 'this sound IS NOT a dice clack') then 'skip it'
		if ((this.lastSoundStep == body.world.stepnumber || this.lastSound > body.world.stepnumber) && currentSoundType != 'dice') return;

		// also skip if it's too early and both last sound and this sound are the same
		if ((this.lastSoundStep == body.world.stepnumber || this.lastSound > body.world.stepnumber) && currentSoundType == 'dice' && this.lastSoundType == 'dice') return;

		if (body.mass > 0) { // dice to dice collision
			let speed = body.velocity.length();
			// also don't bother playing at low speeds
			if (speed < 250) return;

			let strength = Math.max(Math.min(speed / (550), 1), 0.2);
			let sound;

			if(body.diceType != 'dc'){
				let sounds_dice = this.sounds_dice['plastic'];
				if(this.sounds_dice[body.diceMaterial])
					sounds_dice = this.sounds_dice[body.diceMaterial];
				sound = sounds_dice[Math.floor(Math.random() * sounds_dice.length)];
			}
			else
				sound = this.sounds_coins[Math.floor(Math.random() * this.sounds_coins.length)];
			this.detectedCollides[this.iteration] = [sound,strength];
			this.lastSoundType = 'dice';


		} else { // dice to table collision
			let speed = target.velocity.length();
			// also don't bother playing at low speeds
			if (speed < 100) return;

			let surface = this.soundsSurface;
			let strength = Math.max(Math.min(speed / (500), 1), 0.2);

			let soundlist = this.sounds_table[surface];
			let sound = soundlist[Math.floor(Math.random() * soundlist.length)];
			this.detectedCollides[this.iteration] = [sound,strength];

			this.lastSoundType = 'table';
		}
		this.lastSoundStep = body.world.stepnumber;
		this.lastSound = body.world.stepnumber + this.soundDelay;
	}

	playSoundCollide(sound){
		let volume = sound[1] * this.volume;
		new Howl({
			src: sound[0],
			volume: volume,
            autoplay: true
		});
	}

	throwFinished(worldType = 'render')  {
		
		let stopped = true;
		if (this.iteration > 1000) return true;
		if (this.iteration <= this.minIterations) return false;
		if(worldType == 'render'){
			stopped = this.iteration>=this.iterationsNeeded;
			if(stopped){
				for (let i=0, len=this.diceList.length; i < len; ++i){
					this.diceList[i].body_sim.stepPositions = new Array(1000);
					this.diceList[i].body_sim.stepQuaternions = new Array(1000);
					this.diceList[i].body_sim.detectedCollides = [];
					if(!this.diceList[i].body_sim.mass)
						this.diceList[i].body_sim.dead= true;
				}
			}
		}
		else{
			for (let i=0, len=this.diceList.length; i < len; ++i) {
				if(this.diceList[i].body_sim.sleepState < 2)
					return false;
				else if(this.diceList[i].result.length==0)
					this.diceList[i].storeRolledValue();
			}
			//Throw is actually finished
			if(stopped){
				this.iterationsNeeded = this.iteration;
				let canBeFlipped = this.config.canBeFlipped;
				if(!canBeFlipped){
					//make the current dice on the board STATIC object so they can't be knocked
					for (let i=0, len=this.diceList.length; i < len; ++i){
						this.diceList[i].body_sim.mass = 0;
						this.diceList[i].body_sim.updateMassProperties();
					}
				}
			}
		}
		return stopped;
	}

	simulateThrow() {
		this.detectedCollides = new Array(1000);
		this.iterationsNeeded = 0;
		this.animstate = 'simulate';
		this.settle_time = 0;
		this.rolling = true;
		while (!this.throwFinished('sim')) {
			//Before each step, we copy the quaternions of every die in an array
			++this.iteration;
			
			if(!(this.iteration % this.nbIterationsBetweenRolls)){
				for(let i = 0; i < this.diceList.length; i++){
					if(this.diceList[i].startAtIteration == this.iteration)
						this.world_sim.addBody(this.diceList[i].body_sim);
				}
			}
			this.world_sim.step(this.framerate);
			
			for(let i = 0; i < this.world_sim.bodies.length; i++){
				if(this.world_sim.bodies[i].stepPositions){
					this.world_sim.bodies[i].stepQuaternions[this.iteration] = {
						'w':this.world_sim.bodies[i].quaternion.w,
						'x':this.world_sim.bodies[i].quaternion.x,
						'y':this.world_sim.bodies[i].quaternion.y,
						'z':this.world_sim.bodies[i].quaternion.z
					};
					this.world_sim.bodies[i].stepPositions[this.iteration] = {
						'x':this.world_sim.bodies[i].position.x,
						'y':this.world_sim.bodies[i].position.y,
						'z':this.world_sim.bodies[i].position.z
					};
				}
			}
		}
	}

	animateThrow(){
		this.animstate = 'throw';
		let time = (new Date()).getTime();
		this.last_time = this.last_time || time - (this.framerate*1000);
		let time_diff = (time - this.last_time) / 1000;
		
		let neededSteps = Math.floor(time_diff / this.framerate);

		//Update animated dice mixer
		if(this.animatedDiceDetected){
			let delta = this.clock.getDelta();
			for(let i in this.scene.children){
				let container = this.scene.children[i];
				let dicemesh = container.children && container.children.length && container.children[0].body_sim != undefined ? container.children[0]:null;
				if(dicemesh && dicemesh.mixer){
					dicemesh.mixer.update(delta);
				}
			}
		}

		if(neededSteps && this.rolling){
			for(let i =0; i < neededSteps*this.speed; i++) {
				++this.iteration;
				if(!(this.iteration % this.nbIterationsBetweenRolls)){
					for(let i = 0; i < this.diceList.length; i++){
						if(this.diceList[i].startAtIteration == this.iteration){
							this.scene.add(this.diceList[i].parent);
						}		
					}
				}
			}
			if(this.iteration > this.iterationsNeeded)
				this.iteration = this.iterationsNeeded;

			// update physics interactions visually
		
			for (let i in this.scene.children) {
				let container = this.scene.children[i];
				let dicemesh = container.children && container.children.length && container.children[0].body_sim != undefined && !container.children[0].body_sim.dead ? container.children[0]:null;
				if (dicemesh) {
					container.position.copy(dicemesh.body_sim.stepPositions[this.iteration]);
					container.quaternion.copy(dicemesh.body_sim.stepQuaternions[this.iteration]);
						
					if(dicemesh.meshCannon){
						dicemesh.meshCannon.position.copy(dicemesh.body_sim.stepPositions[this.iteration]);
						dicemesh.meshCannon.quaternion.copy(dicemesh.body_sim.stepQuaternions[this.iteration]);
					}
				}
			}
			if(this.detectedCollides[this.iteration]){
				this.playSoundCollide(this.detectedCollides[this.iteration]);
			}
		} 

		if(this.animatedDiceDetected || neededSteps)
			this.renderer.render(this.scene, this.camera);
		//this.rendererStats.update(this.renderer);
		this.last_time = this.last_time + neededSteps*this.framerate*1000;

		// roll finished
		if (this.throwFinished('render')) {
			//if animated dice still on the table, keep animating
			
			this.running = false;
			this.rolling = false;

			if(this.callback) this.callback(this.throws);
			this.callback = null;
			this.throws = null;
			this.running = (new Date()).getTime();
			if(!this.animatedDiceDetected)
                this.shouldUpdateOnFrame = false;
		}
	}

	start_throw(throws, callback) {
		if (this.rolling) return false;
        
		this.isVisible = true;
		let countNewDice = 0;
		throws.forEach(notation => {
			let vector = { x: (Math.random() * 2 - 0.5) * this.display.currentWidth, y: -(Math.random() * 2 - 0.5) * this.display.currentHeight};
			let dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
			let throwingForceModifier = 0.8;
			switch(this.throwingForce){
				case 'weak':
					throwingForceModifier = 0.5;
					break;
				case 'strong':
					throwingForceModifier = 1.8;
					break;
			}
			let boost = ((Math.random() + 3)*throwingForceModifier) * dist;

			notation = this.getVectors(notation, vector, boost, dist);
			countNewDice += notation.dice.length;
		});

		let maxDiceNumber = 100;
		if(this.deadDiceList.length + this.diceList.length + countNewDice > maxDiceNumber) {
			this.clearAll();
		}

		this.rollDice(throws, callback);
        return true;
	}

	clearDice() {
		this.running = false;
		this.deadDiceList = this.deadDiceList.concat(this.diceList);
		this.diceList = [];
	}

	clearAll(){
		this.clearDice();
		let dice;
		while (dice = this.deadDiceList.pop()) {
			this.scene.remove(dice.parent.type == 'Scene' ? dice:dice.parent); 
			if (dice.body_sim) this.world_sim.remove(dice.body_sim);
		}
		
		if (this.pane) this.scene.remove(this.pane);
		this.renderer.render(this.scene, this.camera);
		this.isVisible = false;
	}

	clearScene(){
		while(this.scene.children.length > 0){ 
			this.scene.remove(this.scene.children[0]); 
		}
		this.desk.material.dispose();
		this.desk.geometry.dispose();
		if(this.shadows){
			this.light.shadow.map.dispose();
		}
	}

	rollDice(throws, callback){

		this.camera.position.z = this.cameraHeight.far;
		this.clearDice();
		this.minIterations = (throws.length-1) * this.nbIterationsBetweenRolls;

		for(let j = 0; j < throws.length; j++){
			let notationVectors = throws[j];
			for (let i=0, len=notationVectors.dice.length; i < len; ++i) {
				notationVectors.dice[i].startAtIteration = j*this.nbIterationsBetweenRolls;
				this.spawnDice(notationVectors.dice[i]);
			}
		}
		this.iteration = 0;
		
		this.simulateThrow();
		this.iteration = 0;
		this.settle_time = 0;


		//check forced results, fix dice faces if necessary
		//Detect if there's an animated dice
		this.animatedDiceDetected = false;
		for (let i=0, len=this.diceList.length; i < len; ++i) {
			let dicemesh = this.diceList[i];
			if (!dicemesh) continue;
			this.swapDiceFace(dicemesh);
			if(dicemesh.mixer)	
				this.animatedDiceDetected = true;
		}

		//reset the result
		for (let i=0, len=this.diceList.length; i < len; ++i) {
			if (!this.diceList[i]) continue;

			if (this.diceList[i].resultReason != 'forced') {
				this.diceList[i].result = [];
			}
		}

		// animate the previously simulated roll
		this.rolling = true;
		this.running = (new Date()).getTime();
		this.last_time = 0;
		this.callback = callback;
		this.throws = throws;
        this.shouldUpdateOnFrame = true;
	}
}

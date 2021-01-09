const TEXTURELIST = {
	'none': {
		composite: 'source-over',
		source: '',
		bump: ''
	},
	'cloudy': {
		composite: 'destination-in',
		source: '/modules/3ddice/files/textures/cloudy.webp',
		bump: '/modules/3ddice/files/textures/cloudy.alt.webp'
	},
	'cloudy_2': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/cloudy.alt.webp',
		bump: '/modules/3ddice/files/textures/cloudy.alt.webp'
	},
	'fire': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/fire.webp',
		bump: '/modules/3ddice/files/textures/fire.webp'
	},
	'marble': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/marble.webp',
		bump: '',
		material: 'glass'
	},
	'water': {
		composite: 'destination-in',
		source: '/modules/3ddice/files/textures/water.webp',
		bump: '/modules/3ddice/files/textures/water.webp',
		material: 'glass',
	},
	'ice': {
		composite: 'destination-in',
		source: '/modules/3ddice/files/textures/ice.webp',
		bump: '/modules/3ddice/files/textures/ice.webp',
		material: 'glass'
	},
	'paper': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/paper.webp',
		bump: '/modules/3ddice/files/textures/paper-bump.webp',
		material: 'wood'
	},
	'speckles': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/speckles.webp',
		bump: '/modules/3ddice/files/textures/speckles.webp'
	},
	'glitter': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/glitter.webp',
		bump: '/modules/3ddice/files/textures/glitter-bump.webp'
	},
	'glitter_2': {
		composite: 'destination-in',
		source: '/modules/3ddice/files/textures/glitter-alpha.webp',
		bump: ''
	},
	'stars': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/stars.webp',
		bump: '/modules/3ddice/files/textures/stars.webp'
	},
	'stainedglass': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/stainedglass.webp',
		bump: '/modules/3ddice/files/textures/stainedglass-bump.webp',
		material: 'glass'
	},
	'skulls': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/skulls.webp',
		bump: '/modules/3ddice/files/textures/skulls.webp'
	},
	'leopard': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/leopard.webp',
		bump: '/modules/3ddice/files/textures/leopard.webp',
		material: 'wood'
	},
	'tiger': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/tiger.webp',
		bump: '/modules/3ddice/files/textures/tiger.webp',
		material: 'wood'
	},
	'cheetah': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/cheetah.webp',
		bump: '/modules/3ddice/files/textures/cheetah.webp',
		material: 'wood'
	},
	'dragon': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/dragon.webp',
		bump: '/modules/3ddice/files/textures/dragon-bump.webp'
	},
	'lizard': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/lizard.webp',
		bump: '/modules/3ddice/files/textures/lizard-bump.webp'
	},
	'bird': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/feather.webp',
		bump: '/modules/3ddice/files/textures/feather-bump.webp'
	},
	'astral': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/astral.webp',
		bump: '/modules/3ddice/files/textures/stars.webp'
	},
	'wood': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/wood.webp',
		bump: '/modules/3ddice/files/textures/wood.webp',
		material: 'wood'
	},
	'metal': {
		composite: 'multiply',
		source: '/modules/3ddice/files/textures/metal.webp',
		bump: '',
		material: 'metal'
	},
	'radial': {
		composite: 'source-over',
		source: '/modules/3ddice/files/textures/radial.webp',
		bump: '',
	},
	'bronze01': {
		composite: 'difference',
		source: '/modules/3ddice/files/textures/bronze01.webp',
		material: 'metal',
		bump: ''
	},
	'bronze02': {
		composite: 'difference',
		source: '/modules/3ddice/files/textures/bronze02.webp',
		material: 'metal',
		bump: ''
	},
	'bronze03': {
		composite: 'difference',
		source: '/modules/3ddice/files/textures/bronze03.webp',
		material: 'metal',
		bump: ''
	},
	'bronze03a': {
		composite: 'difference',
		source: '/modules/3ddice/files/textures/bronze03a.webp',
		material: 'metal',
		bump: ''
	},
	'bronze03b': {
		composite: 'difference',
		source: '/modules/3ddice/files/textures/bronze03b.webp',
		material: 'metal',
		bump: ''
	},
	'bronze04': {
		composite: 'difference',
		source: '/modules/3ddice/files/textures/bronze04.webp',
		material: 'metal',
		bump: ''
	}
};

const DICE_SCALE = {
	'd2':1,
	'd4':1,
	'd6':1.3,
	'd8':1.1,
	'd10':1,
	'd12':1.1,
	'd20':1,
	'd3':1.3,
	'd5':1,
	'df':2,
	'd100':0.75
};

export const COLORSETS = {
	'coin_default': {
		name: 'coin_default',
		foreground: '#f6c928',
		background: '#f6c928',
		outline: 'none',
		texture: 'metal'
	},
	'radiant': {
		name: 'radiant',
		foreground: '#F9B333',
		background: '#FFFFFF',
		outline: 'none',
		texture: 'paper'
	},
	'fire': {
		name: 'fire',
		foreground: '#f8d84f',
		background: ['#f8d84f','#f9b02d','#f43c04','#910200','#4c1009'],
		outline: 'black',
		texture: 'fire'
	},
	'ice': {
		name: 'ice',
		foreground: '#60E9FF',
		background: ['#214fa3','#3c6ac1','#253f70','#0b56e2','#09317a'],
		outline: 'black',
		texture: 'ice'
	},
	'poison': {
		name: 'poison',
		foreground: '#D6A8FF',
		background: ['#313866','#504099','#66409e','#934fc3','#c949fc'],
		outline: 'black',
		texture: 'cloudy'
	},
	'acid': {
		name: 'acid',
		foreground: '#A9FF70',
		background: ['#a6ff00', '#83b625','#5ace04','#69f006','#b0f006','#93bc25'],
		outline: 'black',
		texture: 'marble',
		material: 'plastic'
	},
	'thunder': {
		name: 'thunder',
		foreground: '#FFC500',
		background: '#7D7D7D',
		outline: 'black',
		texture: 'cloudy'
	},
	'lightning': {
		name: 'lightning',
		foreground: '#FFC500',
		background: ['#f17105', '#f3ca40','#eddea4','#df9a57','#dea54b'],
		outline: '#7D7D7D',
		texture: 'ice'
	},
	'air': {
		name: 'air',
		foreground: '#ffffff',
		background: ['#d0e5ea', '#c3dee5','#a4ccd6','#8dafb7','#80a4ad'],
		outline: 'black',
		texture: 'cloudy'
	},
	'water': {
		name: 'water',
		foreground: '#60E9FF',
		background: ['#87b8c4', '#77a6b2','#6b98a3','#5b8691','#4b757f'],
		outline: 'black',
		texture: 'water'
	},
	'earth': {
		name: 'earth',
		foreground: '#6C9943',
		background: ['#346804', '#184200','#527f22', '#3a1d04', '#56341a','#331c17','#5a352a','#302210'],
		outline: 'black',
		texture: 'speckles'
	},
	'force': {
		name: 'force',
		foreground: 'white',
		background: ['#FF97FF', '#FF68FF','#C651C6'],
		outline: '#570000',
		texture: 'stars'
	},
	'psychic': {
		name: 'psychic',
		foreground: '#D6A8FF',
		background: ['#313866','#504099','#66409E','#934FC3','#C949FC','#313866'],
		outline: 'black',
		texture: 'speckles'
	},
	'necrotic': {
		name: 'necrotic',
		foreground: '#ffffff',
		background: '#6F0000',
		outline: 'black',
		texture: 'skulls'
	},
	'breebaby': {
		name: 'breebaby',
		foreground: ['#5E175E', '#564A5E','#45455E','#3D5A5E','#1E595E','#5E3F3D','#5E1E29','#283C5E','#25295E'],
		background: ['#FE89CF', '#DFD4F2','#C2C2E8','#CCE7FA','#A1D9FC','#F3C3C2','#EB8993','#8EA1D2','#7477AD'],
		outline: 'white',
		texture: 'marble',
		material: 'plastic'
	},
	'pinkdreams': {
		name: 'pinkdreams',
		foreground: 'white',
		background: ['#ff007c', '#df73ff','#f400a1','#df00ff','#ff33cc'],
		outline: '#570000',
		texture: 'skulls'
	},
	'inspired': {
		name: 'inspired',
		foreground: '#FFD800',
		background: '#C4C4B6',
		outline: '#8E8E86',
		texture: 'none'
	},
	'bloodmoon': {
		name: 'bloodmoon',
		foreground: '#CDB800',
		background: '#6F0000',
		outline: 'black',
		texture: 'marble',
		material: 'plastic'
	},
	'starynight': {
		name: 'starynight',
		foreground: '#4F708F',
		background: ['#091636','#233660','#4F708F','#8597AD','#E2E2E2'],
		outline: 'white',
		texture: 'speckles'
	},
	'glitterparty': {
		name: 'glitterparty',
		foreground: 'white',
		background: ['#FFB5F5','#7FC9FF','#A17FFF'],
		outline: 'none',
		texture: 'glitter'
	},
	'astralsea': {
		name: 'astralsea',
		foreground: '#565656',
		background: 'white',
		outline: 'none',
		texture: 'astral'
	},
	'dragons': {
		name: 'dragons',
		foreground: '#FFFFFF',
		// 			[ red,       black,     blue,      green      white      gold,      silver,    bronze,    copper     brass
		background: ['#B80000', '#4D5A5A', '#5BB8FF', '#7E934E', '#FFFFFF', '#F6ED7C', '#7797A3', '#A78437', '#862C1A', '#FFDF8A'],
		outline: 'black',
		texture: ['dragon', 'lizard']
	},
	'birdup': {
		name: 'birdup',
		foreground: '#FFFFFF',
		background: ['#F11602', '#FFC000', '#6EC832', '#0094BC', '#05608D', '#FEABB3', '#F75680', '#F3F0DF', '#C7A57F'],
		outline: 'black',
		texture: 'bird'
	},
	'tigerking': {
		name: 'tigerking',
		foreground: '#ffffff',
		background: '#FFCC40',
		outline: 'black',
		texture: ['leopard', 'tiger', 'cheetah']
	},
	'toxic': {
		name: 'toxic',
		foreground: '#A9FF70',
		background: ['#a6ff00', '#83b625','#5ace04','#69f006','#b0f006','#93bc25'],
		outline: 'black',
		texture: 'fire'
	},
	'rainbow': {
		name: 'rainbow',
		foreground: ['#FF5959','#FFA74F','#FFFF56','#59FF59','#2374FF','#00FFFF','#FF59FF'],
		background: ['#900000','#CE3900','#BCBC00','#00B500','#00008E','#008282','#A500A5'],
		outline: 'black',
		texture: 'none'
	},
	'random': {
		name: 'random',
		foreground: [],
		outline: [],
		background: [],
		texture: []
	},
	'black': {
		name: 'black',
		foreground: '#ffffff',
		background: '#000000',
		outline: 'black',
		texture: 'none'
	},
	'white': {
		name: 'white',
		foreground: '#000000',
		background: '#FFFFFF',
		outline: '#FFFFFF',
		texture: 'none'
	},
	'bronze': {
		name: 'bronze',
		foreground: ['#FF9159','#FFB066','#FFBF59','#FFD059'],
		background: ['#705206','#7A4E06','#643100','#7A2D06'],
		outline: ['#3D2D03','#472D04','#301700','#471A04'],
		edge: ['#FF5D0D','#FF7B00','#FFA20D','#FFBA0D'],
		texture: [['bronze01','bronze02','bronze03','bronze03b','bronze03b','bronze04']],
		material: 'metal'
	}
};

export class DiceColors {

	static loadTextures(callback) {

		let images = {};
		let bumps = {};
		let loadedImages = 0;
	
		let itemprops = Object.entries(TEXTURELIST);
		let numImages = itemprops.length*2; //One for texture, one for bump texture
		for (const [key, value] of itemprops) {

			if(value.source === '') {
				loadedImages+=2;
				continue;
			}
	
			images[key] = new Image();
			images[key].onload = function() {
	
				if (++loadedImages >= numImages) {
					DiceColors.diceTextures = images; // mergeObject(images, DiceColors.diceTextures || {});
					DiceColors.diceBumps = bumps; //mergeObject(bumps, DiceColors.diceBumps || {});
					callback();
				}
			};
			images[key].src = value.source;

			if(value.bump === '') {
				++loadedImages;
				continue;
			}

			bumps[key] = new Image();
			bumps[key].onload = function() {
	
				if (++loadedImages >= numImages) {
					DiceColors.diceTextures = images; // mergeObject(images, DiceColors.diceTextures || {});
					DiceColors.diceBumps = bumps; //mergeObject(bumps, DiceColors.diceBumps || {});
					callback();
				}
			};

			bumps[key].src = value.bump;
		}
	}
	
	static getTexture(texturename) {
	
		if (Array.isArray(texturename)) {
	
			let textures = [];
			for(let i = 0, l = texturename.length; i < l; i++){
				if (typeof texturename[i] == 'string' || Array.isArray(texturename[i])) {
					textures.push(this.getTexture(texturename[i]));
				}
			}
			return textures;
		}
	
		if (!texturename || texturename == '') {
			return {name:'',texture:'',material:'plastic'};
		}
	
		if (texturename == 'none') {
			return {name:'none',texture:'',material:'plastic'};
		}
	
		if(texturename == 'random') {
			let names = Object.keys(DiceColors.diceTextures);
			// add 'none' for possibility of no texture
			names.pop(); //remove 'random' from this list
	
			return this.getTexture(names[Math.floor(Math.random() * names.length)]);
		}
		//Init not done yet, let the init load the texture
		if(!DiceColors.diceTextures)
			return texturename;
		if (DiceColors.diceTextures[texturename] != null) {
			if(!TEXTURELIST[texturename].material)
				TEXTURELIST[texturename].material = 'plastic';
			if(!DiceColors.diceBumps[texturename])
				DiceColors.diceBumps[texturename] = '';
			return { name: texturename, bump: DiceColors.diceBumps[texturename], material: TEXTURELIST[texturename].material, texture: DiceColors.diceTextures[texturename], composite: TEXTURELIST[texturename].composite };
		}
		return {name:'',texture:''};
	}
	
	static randomColor() {
		// random colors
		let rgb=[];
		rgb[0] = Math.floor(Math.random() * 254);
		rgb[1] = Math.floor(Math.random() * 254);
		rgb[2] = Math.floor(Math.random() * 254);
	
		// this is an attempt to make the foregroudn color stand out from the background color
		// it sometimes produces ok results
		let brightness = ((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) +  (parseInt(rgb[2]) * 114)) / 1000;
		let foreground = (brightness > 126) ? 'rgb(30,30,30)' : 'rgb(230,230,230)'; // high brightness = dark text, else bright text
		let background = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
	
		return {background: background, foreground: foreground };
	}
	
	static initColorSets(entries = null) {
		let sets;
		if(entries)
		{
			let uniqueSet = {};
			uniqueSet[entries.name] = entries;
			sets = Object.entries(uniqueSet);
		}
		else
			sets = Object.entries(COLORSETS);
		for (const [name, data] of sets) {
			COLORSETS[name].id = name;
			if(data.texture != 'custom')
				COLORSETS[name].texture = this.getTexture(data.texture);
			if(typeof COLORSETS[name].texture == 'object')
				COLORSETS[name].texture.id = data.texture;
			if(!COLORSETS[name].material)
				COLORSETS[name].material = '';
			if(!COLORSETS[name].font)
				COLORSETS[name].font = 'Arial';
			if(!COLORSETS[name].fontScale)
				COLORSETS[name].fontScale = DICE_SCALE;
		}
		
		// generate the colors and textures for the random set
		if(!entries)
		{
			for (let i = 0; i < 10; i++) {
				let randcolor = this.randomColor();
				let randtex = this.getTexture('random');
		
				if (randtex.name != '') {
					COLORSETS['random'].foreground.push(randcolor.foreground); 
					COLORSETS['random'].background.push(randcolor.background);
					COLORSETS['random'].outline.push(randcolor.background);
					COLORSETS['random'].texture.push(randtex);
				} else {
					COLORSETS['random'].foreground.push(randcolor.foreground); 
					COLORSETS['random'].background.push(randcolor.background);
					COLORSETS['random'].outline.push('black');
					COLORSETS['random'].texture.push('');
				}
			}
		}
	}
	
	static getColorSet(colorsetname) {
		let colorset = COLORSETS[colorsetname] || COLORSETS['black'];
		return {...colorset};
	}
}

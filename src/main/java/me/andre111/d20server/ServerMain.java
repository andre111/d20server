package me.andre111.d20server;

import me.andre111.d20common.AppType;
import me.andre111.d20common.D20Common;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.model.ServerEntityManager;
import me.andre111.d20server.server.HttpServer;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.CommandLineService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.ModuleService;
import me.andre111.d20server.service.SaveService;

//TODO: current plans:
// allow interacting with doors in CanvasModeEntities as long as a controllable entity is near it (toggle isOpen or play locked sound)
// add motd (and maybe more?) to login screen
// Replace serverside hardcoded image and audio upload/download with generic file upload/download (also get rid of image/audio "entities" and just use paths for that)

//TODO: web client todos:
// Somehow live update update rules ("parser implementation problems")
// file server should send lastModified data and respond with use cached when applicable

//TODO: when the web client porting is done:
// Separate into modules 
//    audio module still needs serverside functionality (audio upload/download) in module (needs to wait until server is running on javascript as well)
// "Area" module (you can define areas, maybe using the drawing system, that can influence stuff, 
//               first idea: "no weather/indoor" areas where the WeatherRenderer does not spawn particles)

//-------------------------------------------
//TODO: Current Plans:
// support sending selected entities of other types
// Doppelklick um Dinge zu öffnen
// Hidden Initiative Macro (Hidden Entry in Lists system (add hidden value and toggle for gm))
// replace sidebar tab names with icons? (to avoid needing to scroll? - but would be harder to understand)
// create real "import" command line functionality on server (+ other commands?)

//TODO: dice/template/scripting rework
//    not as important: (using a string property as part of the expression (cheap solution would be replacing before parsing, but that can be done better...))
//    storing a evaluated expression and reusing that (multiple times) as part of other expressions (so not just the resulting value, but also the full "result" object)
//    better display of eval results (calculations for dice sides/count/... are not show at all currently)

//TODO: Current Priorities:
// make pf character sheet more complete (atleast: movementrates, ...) AND replace with custom no copyright sheet
// journal: entity with a single string (parsed by layoutengine), that can be shown/viewed - needs atleast text and image (based on id) support
// more keyboard shortcuts (delete, camera moving, ...)
// Add optional "attachment" macros

//TODO: And the completely insane next plan:
// Convert the server to node.js (in small steps)
//   - 1: Store a __type attribute in all transmitted Objects (Entities,Properties,Messages,...)
//   - 2: Convert client to actual es6 modules and create "common" modules
//   - 3: Implement the ExpressionParser/Variables/UpdateRule systems in js modules
//   - 4: Convert images and audio from entities to using a "file manager" and paths to resolve
//      - 4.1: write the file manager using actual modules in core/client
//      - 4.2: integrate into tinymce editor (HTMLStringPropertyEditor)
//      - 4.3: write a small data converter -> read id -> read name -> store as path
//      - 4.4: add custom functionality (images: show to players, create token; audio: open in player)
//      - 4.5: integrate into ImagePropertyEditor and editor for audio path
//      4.6: Add an "fileRenamed" event and a listener that adjusts token imagePath and audioPath properties to server
//   - 5: Convert server to node.js (by reusing the "common" modules)
// After that is done:
//    Rework the entity system (the current one always needs to transmit and iterate all for everything -> performance degradation with many maps)
//      Maps, Actors and Attachments remain the only "global" entities
//      Tokens, Walls, Drawings, ... are stored in the maps (not as properties, a sepparate system that can allow gradual loading of map content)
//      Make it possible to store a single entity in a property (as a JSON string) -> use for actor default token
//      What do we do with lists? Is this the time to rework the whole combat system?
//
// Convert ALL entities to be FULLY data defined/driven
//    Third.1 step: Add remaining data defined stuff: cascading deletes
//    ? step: verify entity type on entitymanager add / other locations
// 
// split attachments into more logical separate things:
//    items
//    features
//    spells
//    journal entries

//TODO: Nice to haves:
// more "Effects" for use with the effect command (-> i.e. attack animations and magic)
// one sided walls ?
// Script support (server side, may just happen automatically if I decide to port the server to node.js)
// language support
// a "map" function for an actual map somehow?

//TODO: future (not sure about how to implement it technically)
// implement a "local token copy" of actor system (one global actor, but changes made are stored per token not in the actor? needs to work differently on a technical level)
// -> allows for creating an in tool "monster manual" that can easily spawn in premade tokens but keep temporary modifier changes per token

//TODO: Technical:
// improve entity management: async saving has fixed the biggest delay problem for now, but maybe there is a better way than resaving all entities on a single prop change?
// improve access management: Currently all tokens and walls are synched even for inaccessible maps, And maps require a forced sync for players (that may be a good thing?)
public class ServerMain {
	public static void main(String[] args) {
		//TODO: replace all System.out.*
		System.out.println("Initializing...");
		D20Common.init(AppType.SERVER, ServerEntityManager::new);
		ModuleService.init();
		SaveService.init();
		GameService.init();
		CommandLineService.init();
		
		// used to apply data chagnes needed for node server
		//NodeConverter.convertData();
		
		System.out.println("Starting game server...");
		//TODO: set/configure correct ports
		HttpServer.start(8082);
	}
}

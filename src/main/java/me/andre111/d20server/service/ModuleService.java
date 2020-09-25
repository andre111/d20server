package me.andre111.d20server.service;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import me.andre111.d20common.model.def.Definitions;
import me.andre111.d20common.model.def.EntityDefinition;
import me.andre111.d20common.model.def.EntityDefinition.ExtensionPoint;
import me.andre111.d20common.model.def.ExtensionDefinition;
import me.andre111.d20common.util.Utils;

public abstract class ModuleService {
	private static List<String> loadedModules = new ArrayList<>();
	
	public static void init() {
		// load modules
		loadedModules.add("base"); //TODO: allow full custom modules (including removing base?)
		
		for(File file : new File("./modules/").listFiles()) {
			if(file.isDirectory() && !file.getName().equals("base")) {
				loadedModules.add(file.getName());
			}
		}
		
		// load definitions
		loadDefinitions();
		
		// TODO: create entity managers
	}
	
	private static void loadDefinitions() {
		for(Map.Entry<String, File> e : getFilesIn("entities").entrySet()) {
			if(e.getValue().isFile() && e.getKey().endsWith(".json")) {
				// read basic entity definition
				String type = e.getKey().substring(0, e.getKey().length()-5);
				EntityDefinition entityDefinition = Utils.readJson(e.getValue(), EntityDefinition.class);
				System.out.println("Entity: "+type);
				
				// read extension definitions
				for(ExtensionPoint extensionPoint : entityDefinition.extensionPoints()) {
					for(Map.Entry<String, File> ee : getFilesIn("entities/extensions/"+type+"/"+extensionPoint+"/").entrySet()) {
						if(ee.getValue().isFile() && ee.getKey().endsWith(".json")) {
							String extensionName = ee.getKey().substring(0, ee.getKey().length()-5);
							ExtensionDefinition extensionDefinition = Utils.readJson(ee.getValue(), ExtensionDefinition.class);
							System.out.println("    "+extensionPoint.name()+": "+extensionName);
							
							// add extension definition
							extensionPoint.extensionDefinitions().put(extensionName, extensionDefinition);
						}
					}
				}
				
				// add entity definition
				Definitions.addEntityDefinition(type, entityDefinition);
			}
		}
	}
	
	public static Map<String, File> getFilesIn(String path) {
		Map<String, File> files = new HashMap<>();
		
		for(String module : loadedModules) {
			File moduleDir = new File("./modules/"+module+"/"+path);
			if(moduleDir.exists()) {
				for(File file : moduleDir.listFiles()) {
					files.put(file.getName(), file);
				}
			}
		}
		
		return files;
	}
}

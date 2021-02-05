package me.andre111.d20server.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import com.google.gson.Gson;

import me.andre111.d20common.model.def.Definitions;
import me.andre111.d20common.model.def.EntityDefinition;
import me.andre111.d20common.model.def.EntityDefinition.ExtensionPoint;
import me.andre111.d20common.model.def.ExtensionDefinition;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.server.HttpServerHandler;

public abstract class ModuleService {
	private static List<Module> modules = new ArrayList<>();
	
	public static void init() {
		init(new File("./modules/"));
	}
	public static void init(File modulesDir) {
		// load modules
		//modules.add(new Module("base", new File(modulesDir, "/base/"))); //TODO: allow full custom modules (including removing base?)
		modules.add(new Module("core", new File(modulesDir, "../core/"))); //TODO: allow full custom modules (including removing base?)
		
		for(File file : modulesDir.listFiles()) {
			if(file.isDirectory() && !file.getName().equals("base")) {
				modules.add(new Module(file.getName(), file));
			}
		}
		
		load();
	}
	
	public static Stream<Module> enabledModules() {
		return modules.stream().filter(module -> module.isEnabled());
	}
	
	private static void load() {
		// load definitions
		loadDefinitions();
		Definitions.init();
		HttpServerHandler.initModules();
	}
	
	
	private static void loadDefinitions() {
		// load entity definitions
		for(Map.Entry<String, File> e : getFilesIn("entities").entrySet()) {
			if(e.getValue().isFile() && e.getKey().endsWith(".json")) {
				// read basic entity definition
				String type = e.getKey().substring(0, e.getKey().length()-5);
				EntityDefinition entityDefinition = Utils.readJson(e.getValue(), EntityDefinition.class);
				System.out.println("Entity: "+type);
				
				// read extension definitions
				for(ExtensionPoint extensionPoint : entityDefinition.extensionPoints()) {
					for(Map.Entry<String, File> ee : getFilesIn("entities/extensions/"+type+"/"+extensionPoint.name()+"/").entrySet()) {
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
	
	private static Map<String, File> getFilesIn(String path) {
		Map<String, File> files = new HashMap<>();
		// reject paths that could lead to leaving the module directory
		if(path.contains("..")) return files;

		enabledModules().forEach(module -> {
			File moduleDir = new File(module.directory, path);
			if(moduleDir.exists()) {
				for(File file : moduleDir.listFiles()) {
					files.put(file.getName(), file);
				}
			}
		});
		
		return files;
	}
	
	public static final class Module {
		private final transient String identifier;
		private final transient File directory;
		private final ModuleDefinition definition;
		
		public Module(String identifier, File directory) {
			this.identifier = identifier;
			this.directory = directory;
			
			if(!identifier.equals("core")) {
				try(InputStreamReader reader = new InputStreamReader(new FileInputStream(new File(directory, "module.json")), "UTF-8")) {
					this.definition = (new Gson()).fromJson(reader, ModuleDefinition.class);
				} catch(IOException e) {
					throw new RuntimeException("Invalid module: "+identifier, e);
				}
			} else {
				this.definition = new ModuleDefinition("core", "0", "temporary hack", false, new ArrayList<>());
			}
		}
		
		public String getIdentifier() {
			return this.identifier;
		}
		
		public ModuleDefinition getDefinition() {
			return this.definition;
		}
		
		public File getDirectory() {
			return this.directory;
		}
		
		public boolean isEnabled() {
			return true; //TODO: implement
		}
	}
	public static final record ModuleDefinition(String name, String version, String description, boolean disableable, List<String> libraries) {
	}
}

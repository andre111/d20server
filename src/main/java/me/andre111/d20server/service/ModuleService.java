package me.andre111.d20server.service;

import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import com.google.gson.Gson;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.PropertyRenamingPolicy;
import com.google.javascript.jscomp.Result;
import com.google.javascript.jscomp.ShowByPathWarningsGuard;
import com.google.javascript.jscomp.SourceFile;
import com.google.javascript.jscomp.VariableRenamingPolicy;
import com.google.javascript.rhino.StaticSourceFile.SourceKind;

import me.andre111.d20common.model.def.Definitions;
import me.andre111.d20common.model.def.EntityDefinition;
import me.andre111.d20common.model.def.EntityDefinition.ExtensionPoint;
import me.andre111.d20common.model.def.ExtensionDefinition;
import me.andre111.d20common.model.def.RenderLayerDefinition;
import me.andre111.d20common.util.Utils;

public abstract class ModuleService {
	private static final boolean DEBUG_SCRIPTS = true;
	
	private static List<Module> modules = new ArrayList<>();
	private static File modulesDir;
	
	private static byte[] scriptData;
	private static byte[] cssData;
	
	public static void init() {
		init(new File("./modules/"));
	}
	public static void init(File modulesDir) {
		ModuleService.modulesDir = modulesDir;
		
		// load modules
		modules.add(new Module("base", new File(modulesDir, "/base/"))); //TODO: allow full custom modules (including removing base?)
		
		for(File file : modulesDir.listFiles()) {
			if(file.isDirectory() && !file.getName().equals("base")) {
				modules.add(new Module(file.getName(), file));
			}
		}
		
		load();
	}
	
	private static Stream<Module> enabledModules() {
		return modules.stream().filter(module -> module.isEnabled());
	}
	
	private static void load() {
		// load definitions
		loadDefinitions();
		Definitions.init();
		
		// load scripts
		loadScripts();
		loadCSS();
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
		
		// load render layer definitions
		for(Map.Entry<String, File> e : getFilesIn("renderlayers").entrySet()) {
			if(e.getValue().isFile() && e.getKey().endsWith(".json")) {
				String type = e.getKey().substring(0, e.getKey().length()-5);
				RenderLayerDefinition renderLayerDefinition = Utils.readJson(e.getValue(), RenderLayerDefinition.class);
				System.out.println("RenderLayer: "+type);
				
				Definitions.addRenderLayerDefinition(type, renderLayerDefinition);
			}
		}
	}
	
	private static void loadScripts() {
		StringBuilder sb = new StringBuilder();
		
		// build script
		enabledModules().forEach(module -> {
			File moduleDir = new File(module.directory, "/scripts/");
			if(moduleDir.exists()) {
				appendDirectoryContents(sb, module, moduleDir);
			}
			
			File moduleFile = new File(module.directory, "/module.js");
			if(moduleFile.exists()) {
				appendFileContent(sb, module, moduleFile);
			}
		});
		
		// minify script
		String script = sb.toString();
		if(!DEBUG_SCRIPTS) {
			com.google.javascript.jscomp.Compiler compiler = new com.google.javascript.jscomp.Compiler();
			CompilerOptions options = new CompilerOptions().setEmitUseStrict(false);
			options.setCollapseVariableDeclarations(true);
			options.setFoldConstants(true);
			options.setRenamingPolicy(VariableRenamingPolicy.ALL, PropertyRenamingPolicy.OFF);
			options.addWarningsGuard(new ShowByPathWarningsGuard("never"));
			
			Result result = compiler.compile(SourceFile.fromCode("empty", "function init() {}; const window = {}; const document = {};"), SourceFile.fromCode("main.js", script, SourceKind.STRONG), options);
			if(!result.success) {
				throw new RuntimeException("Module compilation failed");
			}
			script = compiler.toSource();
		};
		
		// store script
		try(ByteArrayOutputStream bos = new ByteArrayOutputStream();
			BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(bos, "UTF-8"))) {
			writer.write(script);
			writer.flush();
			scriptData = bos.toByteArray();
		} catch(IOException e) {
		}
	}
	private static void loadCSS() {
		StringBuilder sb = new StringBuilder();
		
		// build css
		enabledModules().forEach(module -> {
			File moduleFile = new File(module.directory, "/module.css");
			if(moduleFile.exists()) {
				appendFileContent(sb, module, moduleFile);
			}
		});
		
		// store css
		try(ByteArrayOutputStream bos = new ByteArrayOutputStream();
			BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(bos, "UTF-8"))) {
			writer.write(sb.toString());
			writer.flush();
			cssData = bos.toByteArray();
		} catch(IOException e) {
		}
	}
	private static void appendDirectoryContents(StringBuilder sb, Module module, File directory) {
		File[] files = directory.listFiles();
		Arrays.sort(files, (f1, f2) -> {
			return f1.getName().compareTo(f2.getName());
		});
		
		for(File file : files) {
			if(file.isFile()) {
				appendFileContent(sb, module, file);
			} else if(file.isDirectory()) {
				appendDirectoryContents(sb, module, file);
			}
		}
	}
	private static void appendFileContent(StringBuilder sb, Module module, File file) {
		try {
			sb.append("/* source: "+module.identifier+" -> "+file.getName()+" */\n");
			Files.lines(file.toPath()).forEach(line -> {
				sb.append(line);
				sb.append("\n");
			});
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public static byte[] getScriptData() {
		return scriptData;
	}
	
	public static byte[] getCSSData() {
		return cssData;
	}
	
	public static Map<String, File> getFilesIn(String path) {
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
	
	public static File getFile(String path) {
		// reject paths that could lead to leaving the module directory
		if(path.contains("..")) return null;
		
		// find file
		File file = enabledModules().map(module -> {
			File moduleFile = new File(module.directory, path);
			if(moduleFile.exists()) return moduleFile;
			else return null;
		}).filter(f -> f != null).reduce((first, second) -> second).orElse(null);
		
		// verify file is in modules dir
		if(file == null || !file.toPath().startsWith(modulesDir.toPath())) {
			return null;
		}
		
		return file;
	}
	
	private static final class Module {
		private final transient String identifier;
		private final transient File directory;
		private final ModuleDefinition definition;
		
		public Module(String identifier, File directory) {
			this.identifier = identifier;
			this.directory = directory;
			
			try(InputStreamReader reader = new InputStreamReader(new FileInputStream(new File(directory, "module.json")), "UTF-8")) {
				this.definition = (new Gson()).fromJson(reader, ModuleDefinition.class);
			} catch(IOException e) {
				throw new RuntimeException("Invalid module: "+identifier, e);
			}
		}
		
		public boolean isEnabled() {
			return true; //TODO: implement
		}
	}
	public static final record ModuleDefinition(String name, String version, String description, boolean disableable) {
	}
}

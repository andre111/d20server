package me.andre111.d20server.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.lang.reflect.Type;

import com.google.common.io.Files;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import io.github.classgraph.ClassGraph;
import io.github.classgraph.ScanResult;

public class Utils {
	public static final ScanResult CLASSPATH_SCAN;
	static {
		CLASSPATH_SCAN = new ClassGraph().whitelistPackages("me.andre111").scan();
	}

	private static final Gson GSON;
	static {
		GsonBuilder builder = new GsonBuilder();
		builder.registerTypeAdapterFactory(new IOEventEnabler());
		GSON = builder.create();
	}
	
	/**
	 * Empty method. Call in main to initialize the static class variables.
	 */
	public static void init() {
	}
	
	public static <T> T read(String name, Type type) {
		File file = nameToFile(name, ".json");
		if(!file.exists()) return null;
		
		try(InputStreamReader reader = new InputStreamReader(new FileInputStream(file), "UTF-8")) {
			return GSON.fromJson(reader, type);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
	}
	public static void save(String name, Object object) {
		File file = nameToFile(name, ".json");
		createFileAndParents(file);
		
		try(OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(file), "UTF-8")) {
			GSON.toJson(object, writer);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public static byte[] readBinary(String name) {
		File file = nameToFile(name, ".bin");
		if(!file.exists()) return null;
		
		try {
			return Files.asByteSource(file).read();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
	}
	public static void saveBinary(String name, byte[] data) {
		File file = nameToFile(name, ".bin");
		createFileAndParents(file);
		
		try {
			Files.write(data, file);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	private static File nameToFile(String name, String ending) {
		if(name.contains("\\") || name.contains("/")) throw new IllegalArgumentException("Name cannot contain slashes.");
		
		name = name.replace(".", File.separator);
		name = name + ending;
		name = "." + File.separator + "data" + File.separator + name;
		
		return new File(name);
	}
	private static void createFileAndParents(File file) {
		if(!file.getParentFile().exists()) {
			file.getParentFile().mkdirs();
		}
		if(!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
}

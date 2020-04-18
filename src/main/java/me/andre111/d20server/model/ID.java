package me.andre111.d20server.model;

import java.util.HashMap;
import java.util.Map;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20server.util.Utils;

public abstract class ID {
	private static Map<String, Long> NEXT_IDS = new HashMap<>();
	static {
		NEXT_IDS = Utils.read("ids", new TypeToken<Map<String, Long>>(){}.getType());
		if(NEXT_IDS == null) NEXT_IDS = new HashMap<>();
	}
	
	public static long next(Class<?> c) {
		String entry = c.getSimpleName();
		
		long id = 1;
		if(NEXT_IDS.containsKey(entry)) {
			id = NEXT_IDS.get(entry);
		}
		NEXT_IDS.put(entry, id+1);
		Utils.save("ids", NEXT_IDS);
		
		return id;
	}
}

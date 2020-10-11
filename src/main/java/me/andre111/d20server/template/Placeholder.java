package me.andre111.d20server.template;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.ScriptException;

public abstract class Placeholder {
	private static final Map<String, Placeholder> PLACEHOLDERS = new HashMap<>();
	static {
		PLACEHOLDERS.put("text", new PlaceholderText());
		PLACEHOLDERS.put("roll-inline", new PlaceholderRollInline());
	}
	public static Placeholder get(String name) {
		if(PLACEHOLDERS.containsKey(name)) {
			return PLACEHOLDERS.get(name);
		}
		throw new IllegalArgumentException("Unknown placeholder: "+name);
	}
	
	public abstract String parse(Profile profile, String input) throws ScriptException;
}

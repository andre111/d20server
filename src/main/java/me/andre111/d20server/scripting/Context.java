package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;

public class Context {
	private Profile profile;
	private Map map;
	
	public Context(Profile profile, Map map) {
		this.profile = profile;
		this.map = map;
	}
	
	public Profile getProfile() {
		return profile;
	}
	
	public Map getMap() {
		return map;
	}
}

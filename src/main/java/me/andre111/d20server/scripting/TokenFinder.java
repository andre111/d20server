package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.profile.Profile;

public abstract class TokenFinder {
	public abstract Token findToken(Map map, Profile profile) throws ScriptException;
}

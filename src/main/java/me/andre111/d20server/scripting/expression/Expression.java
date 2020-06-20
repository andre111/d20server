package me.andre111.d20server.scripting.expression;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.ScriptException;

@FunctionalInterface
public interface Expression {
	public Result eval(Map map, Profile profile) throws ScriptException;
}

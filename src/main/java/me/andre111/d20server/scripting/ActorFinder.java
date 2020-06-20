package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;

public abstract class ActorFinder {
	public abstract Actor findActor(Map map, Profile profile) throws ScriptException;
}

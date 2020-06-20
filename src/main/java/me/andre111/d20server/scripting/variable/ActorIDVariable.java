package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.ScriptException;

public class ActorIDVariable extends Variable {
	private final ActorFinder actorFinder;
	
	public ActorIDVariable(String fullName, ActorFinder actorFinder) {
		super(fullName);
		
		this.actorFinder = actorFinder;
	}

	@Override
	public void set(Map map, Profile profile, Object value) throws ScriptException {
		throw new ScriptException("Actor id is read only!");
	}

	@Override
	public Object get(Map map, Profile profile) throws ScriptException {
		return actorFinder.findActor(map, profile).id();
	}
}

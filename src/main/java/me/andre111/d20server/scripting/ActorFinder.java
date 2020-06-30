package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.actor.Actor;

public abstract class ActorFinder {
	public abstract Actor findActor(Context context) throws ScriptException;
}

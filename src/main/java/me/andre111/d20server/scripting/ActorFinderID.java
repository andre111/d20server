package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20server.model.EntityManager;

public class ActorFinderID extends ActorFinder {
	private final long actorID;
	
	public ActorFinderID(long actorID) {
		this.actorID = actorID;
	}

	@Override
	public Actor findActor(Context context) throws ScriptException {
		Actor actor = EntityManager.ACTOR.find(actorID);
		if(actor == null) {
			throw new ScriptException("Actor with id "+actorID+" not found");
		}
		return actor;
	}
}

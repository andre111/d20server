package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20server.model.EntityManagers;

public class ActorFinderToken extends ActorFinder {
	private final TokenFinder tokenFinder;
	
	public ActorFinderToken(TokenFinder tokenFinder) {
		this.tokenFinder = tokenFinder;
	}

	@Override
	public Actor findActor(Context context) throws ScriptException {
		long actorID = tokenFinder.findToken(context).prop("actorID").getLong();
		Actor actor = EntityManagers.ACTOR.find(actorID);
		if(actor == null) {
			throw new ScriptException("Token has no assigned actor");
		}
		return actor;
	}

}

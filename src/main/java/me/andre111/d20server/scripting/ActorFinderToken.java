package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManager;

public class ActorFinderToken extends ActorFinder {
	private final TokenFinder tokenFinder;
	
	public ActorFinderToken(TokenFinder tokenFinder) {
		this.tokenFinder = tokenFinder;
	}

	@Override
	public Actor findActor(Map map, Profile profile) throws ScriptException {
		long actorID = tokenFinder.findToken(map, profile).getActorID();
		Actor actor = EntityManager.ACTOR.find(actorID);
		if(actor == null) {
			throw new ScriptException("Token has no assigned actor");
		}
		return actor;
	}

}

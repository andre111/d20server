package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.actor.UpdateActor;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.MessageService;

public class PropertyVariableActor extends PropertyVariable {
	private final ActorFinder actorFinder;
	
	public PropertyVariableActor(String fullName, String propertyName, ActorFinder actorFinder) {
		super(fullName, propertyName);
		
		this.actorFinder = actorFinder;
	}

	@Override
	protected Property getProperty(Context context) throws ScriptException {
		// get property
		Property property = actorFinder.findActor(context).getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Actor has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Context context) throws ScriptException {
		return actorFinder.findActor(context).getAccessLevel(context.profile());
	}

	@Override
	protected void saveSourceAfterSet(Context context) throws ScriptException {
		Actor actor = actorFinder.findActor(context);
		EntityManager.ACTOR.save(actor);
		MessageService.broadcast(new UpdateActor(actor));
	}
}

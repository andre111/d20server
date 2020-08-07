package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public class PropertyVariableActor extends PropertyVariable {
	private final ActorFinder actorFinder;
	
	public PropertyVariableActor(String fullName, String propertyName, ActorFinder actorFinder) {
		super(fullName, propertyName);
		
		this.actorFinder = actorFinder;
	}

	@Override
	protected BaseEntity getEntity(Context context) throws ScriptException {
		return actorFinder.findActor(context);
	}
}

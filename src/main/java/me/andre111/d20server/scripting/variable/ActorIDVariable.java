package me.andre111.d20server.scripting.variable;

import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public class ActorIDVariable extends Variable {
	private final ActorFinder actorFinder;
	
	public ActorIDVariable(String fullName, ActorFinder actorFinder) {
		super(fullName);
		
		this.actorFinder = actorFinder;
	}

	@Override
	public void set(Context context, Object value) throws ScriptException {
		throw new ScriptException("Actor id is read only!");
	}

	@Override
	public Object get(Context context) throws ScriptException {
		return actorFinder.findActor(context).id();
	}
}

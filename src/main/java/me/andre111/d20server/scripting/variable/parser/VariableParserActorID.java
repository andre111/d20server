package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.ActorIDVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserActorID extends VariableParserActor {
	@Override
	public Variable parse(String fullName, String name, ActorFinder actorFinder) throws ScriptException {
		return new ActorIDVariable(fullName, actorFinder);
	}
}

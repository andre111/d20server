package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.PropertyVariableActor;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserPropertyActor extends VariableParserActor {
	@Override
	public Variable parse(String fullName, String name, ActorFinder actorFinder) throws ScriptException {
		return new PropertyVariableActor(fullName, name, actorFinder);
	}
}

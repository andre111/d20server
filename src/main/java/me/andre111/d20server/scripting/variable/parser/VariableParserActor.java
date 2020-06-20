package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.Variable;

public abstract class VariableParserActor extends VariableParser {
	@Override
	public final Variable parse(String fullName, String name) throws ScriptException {
		throw new ScriptException("Internal Error: VariableParserActor did not recieve a ActorFinder!");
	}

	public abstract Variable parse(String fullName, String name, ActorFinder actorFinder) throws ScriptException;
}

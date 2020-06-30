package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.PropertyVariableActor;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserPropertyActor extends VariableParser {
	@Override
	public Variable parse(ParserContext context, String fullName, String name) throws ScriptException {
		if(context.getActorFinder() == null) throw new ScriptException("Internal Error: No ActorFinder present!");
		
		return new PropertyVariableActor(fullName, name, context.getActorFinder());
	}
}

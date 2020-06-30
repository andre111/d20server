package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.ActorIDVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserActorID extends VariableParser {
	@Override
	public Variable parse(ParserContext context, String fullName, String name) throws ScriptException {
		if(context.getActorFinder() == null) throw new ScriptException("Internal Error: No ActorFinder present!");
		
		return new ActorIDVariable(fullName, context.getActorFinder());
	}
}

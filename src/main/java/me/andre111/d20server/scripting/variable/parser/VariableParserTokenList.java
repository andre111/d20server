package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.TokenListVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserTokenList extends VariableParser {
	@Override
	public Variable parse(ParserContext context, String fullName, String name) throws ScriptException {
		if(context.getTokenFinder() == null) throw new ScriptException("Internal Error: No TokenFinder present!");
		
		return new TokenListVariable(fullName, name, context.getTokenFinder());
	}
}

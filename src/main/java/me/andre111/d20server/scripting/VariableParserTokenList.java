package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.TokenListVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserTokenList extends VariableParserToken {
	@Override
	public Variable parse(String fullName, String name, TokenFinder tokenFinder) throws ScriptException {
		return new TokenListVariable(fullName, name, tokenFinder);
	}
}

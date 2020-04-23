package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.TokenIDVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserTokenID extends VariableParserToken {
	@Override
	public Variable parse(String fullName, String name, TokenFinder tokenFinder) throws ScriptException {
		return new TokenIDVariable(fullName, tokenFinder);
	}
}

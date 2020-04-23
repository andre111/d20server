package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.PropertyVariableToken;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserPropertyToken extends VariableParserToken {
	@Override
	public Variable parse(String fullName, String name, TokenFinder tokenFinder) throws ScriptException {
		return new PropertyVariableToken(fullName, name, tokenFinder);
	}
}

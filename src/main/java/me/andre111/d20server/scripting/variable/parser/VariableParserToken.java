package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.scripting.variable.Variable;

public abstract class VariableParserToken extends VariableParser {
	@Override
	public final Variable parse(String fullName, String name) throws ScriptException {
		throw new ScriptException("Internal Error: VariableParserToken did not recieve a TokenFinder!");
	}

	public abstract Variable parse(String fullName, String name, TokenFinder tokenFinder) throws ScriptException;
}

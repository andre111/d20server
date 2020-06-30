package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.PropertyVariableMap;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserPropertyMap extends VariableParser {
	@Override
	public Variable parse(ParserContext context, String fullName, String name) throws ScriptException {
		return new PropertyVariableMap(fullName, name);
	}
}

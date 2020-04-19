package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.MapPropertyVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserPropertyMap extends VariableParser {
	@Override
	public Variable parse(String fullName, String name) throws ScriptException {
		return new MapPropertyVariable(fullName, name);
	}
}

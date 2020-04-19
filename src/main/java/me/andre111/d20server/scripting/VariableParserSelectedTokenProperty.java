package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.SelectedTokenPropertyVariable;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserSelectedTokenProperty extends VariableParser {
	@Override
	public Variable parse(String fullName, String name) throws ScriptException {
		return new SelectedTokenPropertyVariable(fullName, name);
	}
}

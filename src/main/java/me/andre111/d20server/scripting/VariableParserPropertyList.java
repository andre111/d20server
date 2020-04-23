package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.PropertyVariableList;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserPropertyList extends VariableParser {
	@Override
	public Variable parse(String fullName, String name) throws ScriptException {
		String[] split = name.split("\\.", 2);
		if(split.length != 2) throw new ScriptException("Missing listname.propertyname");
		
		return new PropertyVariableList(fullName, split[0], split[1]);
	}
}

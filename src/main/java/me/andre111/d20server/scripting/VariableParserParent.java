package me.andre111.d20server.scripting;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserParent extends VariableParser {
	private Map<String, VariableParser> children = new HashMap<>();
	
	public VariableParserParent addChild(String name, VariableParser child) {
		children.put(name, child);
		return this;
	}

	@Override
	public Variable parse(String fullName, String name) throws ScriptException{
		String[] split = name.split("\\.", 2);
		
		VariableParser child = children.get(split[0]);
		if(child == null) {
			throw new ScriptException("Unknown variable "+fullName);
		}
		
		return child.parse(fullName, split.length == 2 ? split[1] : "");
	}

}

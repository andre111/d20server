package me.andre111.d20server.scripting.variable.parser;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserParent extends VariableParser {
	private Map<String, VariableParser> children = new HashMap<>();
	
	public VariableParserParent addChild(String name, VariableParser child) {
		children.put(name, child);
		return this;
	}

	@Override
	public Variable parse(ParserContext context, String fullName, String name) throws ScriptException{
		VariableParser child = children.get(getChildParserName(name));
		if(child == null) {
			throw new ScriptException("Unknown variable "+fullName);
		}
		
		updateContext(context, name);
		
		return child.parse(context, fullName, getChildString(name));
	}

	// default implementation for basic parents "<childName>.<childString>"
	protected String getChildParserName(String name) {
		String[] split = name.split("\\.", 2);
		return split[0];
	}
	protected String getChildString(String name) {
		String[] split = name.split("\\.", 2);
		return split.length==2 ? split[1] : "";
	}
	protected void updateContext(ParserContext context, String name) {
	}
}

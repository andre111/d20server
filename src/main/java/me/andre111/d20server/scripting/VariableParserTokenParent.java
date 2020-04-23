package me.andre111.d20server.scripting;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.scripting.variable.Variable;

public abstract class VariableParserTokenParent extends VariableParser {
	private Map<String, VariableParserToken> children = new HashMap<>();
	
	public VariableParserTokenParent addChild(String name, VariableParserToken child) {
		children.put(name, child);
		return this;
	}

	@Override
	public Variable parse(String fullName, String name) throws ScriptException{
		VariableParserToken child = children.get(getChildParserName(name));
		if(child == null) {
			throw new ScriptException("Unknown variable "+fullName);
		}
		
		return child.parse(fullName, getChildString(name), getTokenFinder(name));
	}

	protected abstract String getChildParserName(String name);
	protected abstract String getChildString(String name);
	protected abstract TokenFinder getTokenFinder(String name);
}

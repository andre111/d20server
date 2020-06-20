package me.andre111.d20server.scripting.variable.parser;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.scripting.ActorFinderToken;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserParentActorToken extends VariableParserToken {
	private Map<String, VariableParserActor> children = new HashMap<>();
	
	public VariableParserParentActorToken addChild(String name, VariableParserActor child) {
		children.put(name, child);
		return this;
	}

	@Override
	public Variable parse(String fullName, String name, TokenFinder tokenFinder) throws ScriptException{
		VariableParserActor child = children.get(getChildParserName(name));
		if(child == null) {
			throw new ScriptException("Unknown variable "+fullName);
		}
		
		return child.parse(fullName, getChildString(name), new ActorFinderToken(tokenFinder));
	}
	
	protected String getChildParserName(String name) {
		String[] split = name.split("\\.", 2);
		return split[0];
	}

	protected String getChildString(String name) {
		String[] split = name.split("\\.", 2);
		return split.length==2 ? split[1] : "";
	}
}

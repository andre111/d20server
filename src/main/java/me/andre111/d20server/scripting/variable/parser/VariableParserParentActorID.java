package me.andre111.d20server.scripting.variable.parser;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.scripting.ActorFinder;
import me.andre111.d20server.scripting.ActorFinderID;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.Variable;

public class VariableParserParentActorID extends VariableParser {
	private Map<String, VariableParserActor> children = new HashMap<>();
	
	public VariableParserParentActorID addChild(String name, VariableParserActor child) {
		children.put(name, child);
		return this;
	}

	@Override
	public Variable parse(String fullName, String name) throws ScriptException {
		VariableParserActor child = children.get(getChildParserName(name));
		if(child == null) {
			throw new ScriptException("Unknown variable "+fullName);
		}
		
		return child.parse(fullName, getChildString(name), getActorFinder(name));
	}
	
	protected String getChildParserName(String name) {
		String[] split = name.split("\\.", 3);
		return split.length>1 ? split[1] : "";
	}

	protected String getChildString(String name) {
		String[] split = name.split("\\.", 3);
		return split.length==3 ? split[2] : "";
	}

	protected ActorFinder getActorFinder(String name) {
		String[] split = name.split("\\.", 3);
		long actorID = -1;
		try {
			actorID = Long.parseLong(split[0]);
		} catch(NumberFormatException e) {
		}
		return new ActorFinderID(actorID);
	}
}

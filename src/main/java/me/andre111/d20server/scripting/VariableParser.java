package me.andre111.d20server.scripting;

import me.andre111.d20server.scripting.variable.Variable;

public abstract class VariableParser {
	private static final VariableParser rootParser;
	static {
		rootParser = new VariableParserParent()
				.addChild("selected", new VariableParserTokenParentSelected()
						.addChild("property", new VariableParserPropertyToken())
						.addChild("list", new VariableParserTokenList())
						.addChild("id", new VariableParserTokenID())
				)
				.addChild("token", new VariableParserTokenParentID()
						.addChild("property", new VariableParserPropertyToken())
						.addChild("list", new VariableParserTokenList())
						.addChild("id", new VariableParserTokenID())
				)
				.addChild("list", new VariableParserParent()
						.addChild("property", new VariableParserPropertyList())
				)
				.addChild("map", new VariableParserParent()
						.addChild("property", new VariableParserPropertyMap())
				);
	}
	

	public static Variable parseVariable(String name) throws ScriptException {
		return rootParser.parse(name, name);
	}
	
	public abstract Variable parse(String fullName, String name) throws ScriptException;
}

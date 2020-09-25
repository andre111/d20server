package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.Variable;

public abstract class VariableParser {
	private static final VariableParser rootParser;
	static {
		rootParser = new VariableParserParent()
				.addChild("selected", new VariableParserParentTokenSelected()
						.addChild("property", new VariableParserPropertyToken())
						.addChild("list", new VariableParserTokenList())
						.addChild("id", new VariableParserTokenID())
						.addChild("actor", new VariableParserParentActorToken()
								.addChild("property", new VariableParserPropertyActor())
								.addChild("id", new VariableParserActorID())
						)
				)
				.addChild("token", new VariableParserParentTokenID()
						.addChild("property", new VariableParserPropertyToken())
						.addChild("list", new VariableParserTokenList())
						.addChild("id", new VariableParserTokenID())
						.addChild("actor", new VariableParserParentActorToken()
								.addChild("property", new VariableParserPropertyActor())
								.addChild("id", new VariableParserActorID())
						)
				)
				.addChild("actor", new VariableParserParentActorID()
						.addChild("property", new VariableParserPropertyActor())
						.addChild("id", new VariableParserActorID())
				)
				.addChild("self", new VariableParserParent()
						.addChild("property", new VariableParserPropertySelf())
						.addChild("id", new VariableParserSelfID())
				)
				.addChild("list", new VariableParserParent()
						.addChild("property", new VariableParserPropertyList())
				)
				.addChild("map", new VariableParserParent()
						.addChild("property", new VariableParserPropertyMap())
				);
	}
	

	public static Variable parseVariable(String name) throws ScriptException {
		return rootParser.parse(new ParserContext(), name, name);
	}
	
	public abstract Variable parse(ParserContext context, String fullName, String name) throws ScriptException;
}

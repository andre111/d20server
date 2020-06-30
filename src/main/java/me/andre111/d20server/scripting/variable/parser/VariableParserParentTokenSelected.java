package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ParserContext;
import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.scripting.TokenFinderSelected;

public class VariableParserParentTokenSelected extends VariableParserParent {
	private static final TokenFinder FINDER = new TokenFinderSelected();
	
	@Override
	protected void updateContext(ParserContext context, String name) {
		context.setTokenFinder(FINDER);
	}
}
